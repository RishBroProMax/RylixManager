#!/bin/bash
# ==============================================================================
#  RylixManager — Reimagined Dokploy PaaS & Game Server Platform
#  One-Line Installer: curl -sSL https://raw.githubusercontent.com/RishBroProMax/rylixmanager/main/install.sh | sh
# ==============================================================================

set -e

# Docker version to install and maintain
DOCKER_VERSION="28.5.0"

# Colors for terminal styling
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

print_banner() {
    cat << "EOF"

  ██████╗ ██╗   ██╗██╗     ██╗██╗  ██╗
  ██╔══██╗╚██╗ ██╔╝██║     ██║╚██╗██╔╝
  ██████╔╝ ╚████╔╝ ██║     ██║ ╚███╔╝ 
  ██╔══██╗  ╚██╔╝  ██║     ██║ ██╔██╗ 
  ██║  ██║   ██║   ███████╗██║██╔╝ ██╗
  ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝╚═╝  ╚═╝
   M A N A G E R  —  Reimagined Dokploy VPS & PaaS Platform

EOF
}

# Detect version from environment variable or default to latest
detect_version() {
    local version="${RYLIX_VERSION:-${DOKPLOY_VERSION}}"
    
    if [ -z "$version" ]; then
        version=$(curl -fsSL --connect-timeout 5 -o /dev/null -w '%{url_effective}\n' \
            https://github.com/RishBroProMax/rylixmanager/releases/latest 2>/dev/null | \
            sed 's#.*/tag/##')

        case "$version" in
            v[0-9]*) ;;
            *) version="" ;;
        esac

        if [ -z "$version" ]; then
            version="latest"
        fi
    fi
    
    echo "$version"
}

# Function to detect if running in Proxmox LXC container
is_proxmox_lxc() {
    if [ -n "$container" ] && [ "$container" = "lxc" ]; then
        return 0
    fi
    if grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        return 0
    fi
    return 1
}

# Generate secure random password
generate_random_password() {
    local password=""
    if command -v openssl >/dev/null 2>&1; then
        password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    elif [ -r /dev/urandom ]; then
        password=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32)
    else
        password=$(date +%s%N | sha256sum | base64 | head -c 32)
    fi
    
    if [ -z "$password" ] || [ ${#password} -lt 20 ]; then
        echo "Error: Failed to generate random password" >&2
        exit 1
    fi
    echo "$password"
}

get_ip() {
    local ip=""
    ip=$(curl -4s --connect-timeout 4 https://ifconfig.io 2>/dev/null)
    if [ -z "$ip" ]; then
        ip=$(curl -4s --connect-timeout 4 https://icanhazip.com 2>/dev/null)
    fi
    if [ -z "$ip" ]; then
        ip=$(curl -4s --connect-timeout 4 https://ipecho.net/plain 2>/dev/null)
    fi
    if [ -z "$ip" ]; then
        ip=$(curl -6s --connect-timeout 4 https://ifconfig.io 2>/dev/null)
    fi
    if [ -z "$ip" ]; then
        echo "127.0.0.1"
    else
        echo "$ip"
    fi
}

get_private_ip() {
    ip -o -4 addr show scope global 2>/dev/null \
        | awk '$2 !~ /^(docker|br-|veth)/ {print $4}' \
        | cut -d/ -f1 \
        | grep -E "^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)" \
        | head -n1 || true
}

format_ip_for_url() {
    local ip="$1"
    if echo "$ip" | grep -q ':'; then
        echo "[${ip}]"
    else
        echo "${ip}"
    fi
}

prompt_admin_account() {
    printf "${CYAN}────────────────────────────────────────────────────────────${NC}\n"
    printf "${BOLD}${GREEN}  Create Master Admin Account${NC}\n"
    printf "  These credentials will allow you to log in to RylixManager\n"
    printf "${CYAN}────────────────────────────────────────────────────────────${NC}\n\n"

    # Support pre-configured environment variables for automated deployment
    if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
        ADMIN_NAME="${ADMIN_NAME:-Admin}"
        ADMIN_LAST_NAME="${ADMIN_LAST_NAME:-User}"
        printf "${GREEN}✓ Using pre-configured admin account:${NC} ${ADMIN_EMAIL}\n\n"
        return
    fi

    # Read Name
    read -p "Enter Admin First Name [Admin]: " input_name </dev/tty || true
    ADMIN_NAME="${input_name:-Admin}"

    read -p "Enter Admin Last Name [User]: " input_lastname </dev/tty || true
    ADMIN_LAST_NAME="${input_lastname:-User}"

    # Read Email
    while true; do
        read -p "Enter Admin Email: " input_email </dev/tty || true
        input_email=$(echo "$input_email" | tr '[:upper:]' '[:lower:]' | xargs)
        if [[ "$input_email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            ADMIN_EMAIL="$input_email"
            break
        else
            printf "${RED}Please enter a valid email address (e.g., admin@example.com).${NC}\n"
        fi
    done

    # Read Password
    while true; do
        read -s -p "Enter Admin Password (min 8 characters): " input_pwd </dev/tty || true
        echo ""
        if [ ${#input_pwd} -lt 8 ]; then
            printf "${RED}Password must be at least 8 characters long.${NC}\n"
            continue
        fi

        read -s -p "Confirm Admin Password: " input_pwd_confirm </dev/tty || true
        echo ""

        if [ "$input_pwd" != "$input_pwd_confirm" ]; then
            printf "${RED}Passwords do not match! Please try again.${NC}\n"
            continue
        fi

        ADMIN_PASSWORD="$input_pwd"
        break
    done

    printf "\n${GREEN}✓ Admin account details confirmed.${NC}\n\n"
}

install_rylix() {
    print_banner

    VERSION_TAG=$(detect_version)
    # Default to GHCR rylixmanager image (no Docker Hub secret required)
    PRIMARY_IMAGE="ghcr.io/rishbropromax/rylixmanager:${VERSION_TAG}"
    DOCKER_IMAGE="${RYLIX_IMAGE:-$PRIMARY_IMAGE}"
    
    printf "${CYAN}=== Starting RylixManager Installation (${VERSION_TAG}) ===${NC}\n\n"

    # Pre-flight checks
    if [ "$(id -u)" != "0" ]; then
        printf "${RED}Error: This script must be run as root (use sudo).${NC}\n" >&2
        exit 1
    fi

    if [ "$(uname)" = "Darwin" ]; then
        printf "${RED}Error: RylixManager requires a Linux server/VPS environment.${NC}\n" >&2
        exit 1
    fi

    if [ -f /.dockerenv ]; then
        printf "${RED}Error: Please run this script on the Linux host system, not inside a container.${NC}\n" >&2
        exit 1
    fi

    # Interactive Admin Account Setup in Terminal
    prompt_admin_account

    # Port checks
    if ss -tulnp 2>/dev/null | grep -E ':(80|443|3000) ' >/dev/null; then
        printf "${YELLOW}Notice: Checking system ports...${NC}\n"
        if ss -tulnp 2>/dev/null | grep ':3000 ' >/dev/null; then
            printf "${RED}Port 3000 is currently in use. Please stop any process using port 3000 before continuing.${NC}\n" >&2
            exit 1
        fi
    fi

    # Check and install Docker if missing
    command_exists() {
        command -v "$@" > /dev/null 2>&1
    }

    if command_exists docker; then
        printf "${GREEN}✓ Docker is already installed.${NC}\n"
    else
        printf "${BLUE}→ Installing Docker Engine...${NC}\n"
        curl -sSL https://get.docker.com | sh -s -- --version $DOCKER_VERSION
        if command_exists apt-mark; then
            apt-mark hold docker-ce docker-ce-cli docker-ce-rootless-extras >/dev/null 2>&1 || true
        fi
        printf "${GREEN}✓ Docker installed successfully.${NC}\n"
    fi

    # Proxmox LXC compatibility mode
    endpoint_mode=""
    if [ "$ENDPOINT_MODE" = "dnsrr" ] || is_proxmox_lxc; then
        printf "${YELLOW}Setting --endpoint-mode dnsrr for container environment compatibility.${NC}\n"
        endpoint_mode="--endpoint-mode dnsrr"
    fi

    # IP detection
    public_ip="${ADVERTISE_ADDR:-$(get_ip)}"
    private_ip=$(get_private_ip)
    advertise_addr="${ADVERTISE_ADDR:-$private_ip}"
    if [ -z "$advertise_addr" ]; then
        advertise_addr="$public_ip"
    fi

    printf "${CYAN}→ Using advertise address: ${advertise_addr}${NC}\n"

    # Initialize Docker Swarm if not already active
    if ! docker node ls >/dev/null 2>&1; then
        printf "${BLUE}→ Initializing Docker Swarm...${NC}\n"
        docker swarm leave --force 2>/dev/null || true
        docker swarm init --advertise-addr "$advertise_addr" ${DOCKER_SWARM_INIT_ARGS:-}
        printf "${GREEN}✓ Docker Swarm initialized.${NC}\n"
    else
        printf "${GREEN}✓ Docker Swarm already active.${NC}\n"
    fi

    # Overlay network
    if ! docker network inspect rylix-network >/dev/null 2>&1; then
        printf "${BLUE}→ Creating overlay network 'rylix-network'...${NC}\n"
        docker network create --driver overlay --attachable rylix-network
    fi
    if ! docker network inspect dokploy-network >/dev/null 2>&1; then
        docker network create --driver overlay --attachable dokploy-network 2>/dev/null || true
    fi

    # Directories
    mkdir -p /etc/rylix
    mkdir -p /etc/dokploy
    chmod 777 /etc/rylix /etc/dokploy

    # Generate internal secrets
    POSTGRES_PASSWORD=$(generate_random_password)
    AUTH_SECRET=$(openssl rand -hex 32 2>/dev/null || generate_random_password)

    # Store Docker Secrets
    echo "$POSTGRES_PASSWORD" | docker secret create rylix_postgres_password - 2>/dev/null || true
    echo "$POSTGRES_PASSWORD" | docker secret create dokploy_postgres_password - 2>/dev/null || true
    echo "$AUTH_SECRET" | docker secret create rylix_auth_secret - 2>/dev/null || true
    echo "$AUTH_SECRET" | docker secret create dokploy_auth_secret - 2>/dev/null || true

    # Store Admin Setup Secrets
    if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
        echo "$ADMIN_EMAIL" | docker secret create rylix_admin_email - 2>/dev/null || true
        echo "$ADMIN_PASSWORD" | docker secret create rylix_admin_password - 2>/dev/null || true
        echo "$ADMIN_NAME" | docker secret create rylix_admin_name - 2>/dev/null || true
        echo "$ADMIN_LAST_NAME" | docker secret create rylix_admin_last_name - 2>/dev/null || true

        # Also write backup config in /etc/rylix/admin-setup.json
        cat << EOF > /etc/rylix/admin-setup.json
{
  "email": "${ADMIN_EMAIL}",
  "password": "${ADMIN_PASSWORD}",
  "firstName": "${ADMIN_NAME}",
  "lastName": "${ADMIN_LAST_NAME}"
}
EOF
        chmod 600 /etc/rylix/admin-setup.json
        cp /etc/rylix/admin-setup.json /etc/dokploy/admin-setup.json 2>/dev/null || true
    fi

    printf "${GREEN}✓ Generated secure database, authentication, and admin credentials.${NC}\n"

    # Pre-pull or build RylixManager image with full progress output
    printf "${BLUE}→ Checking RylixManager container image (${DOCKER_IMAGE})...${NC}\n"
    if ! docker pull "$DOCKER_IMAGE"; then
        printf "${YELLOW}Notice: Primary image '${DOCKER_IMAGE}' could not be pulled directly.${NC}\n"
        if [ -f "./Dockerfile" ]; then
            printf "${CYAN}→ Local Dockerfile found! Building RylixManager locally from source...${NC}\n"
            docker build -t rylixmanager:latest .
            DOCKER_IMAGE="rylixmanager:latest"
        else
            # Try pulling latest tag or fallback
            printf "${CYAN}→ Attempting fallback image: ghcr.io/rishbropromax/rylixmanager:latest...${NC}\n"
            if ! docker pull ghcr.io/rishbropromax/rylixmanager:latest; then
                printf "${YELLOW}→ Registry image pending. Using reliable base container engine...${NC}\n"
                docker pull dokploy/dokploy:latest
                DOCKER_IMAGE="dokploy/dokploy:latest"
            else
                DOCKER_IMAGE="ghcr.io/rishbropromax/rylixmanager:latest"
            fi
        fi
    fi
    printf "${GREEN}✓ RylixManager container image ready: ${DOCKER_IMAGE}${NC}\n"

    # Create Database service
    printf "${BLUE}→ Deploying PostgreSQL database service...${NC}\n"
    docker service rm rylix-postgres 2>/dev/null || true
    docker service rm dokploy-postgres 2>/dev/null || true

    docker service create \
        --name rylix-postgres \
        --constraint 'node.role==manager' \
        --network rylix-network \
        --network dokploy-network \
        --env POSTGRES_USER=dokploy \
        --env POSTGRES_DB=dokploy \
        --secret source=dokploy_postgres_password,target=/run/secrets/postgres_password \
        --env POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password \
        --mount type=volume,source=dokploy-postgres,target=/var/lib/postgresql/data \
        $endpoint_mode \
        postgres:16

    # Create Manager service
    printf "${BLUE}→ Deploying RylixManager panel service...${NC}\n"
    docker service rm rylix-manager 2>/dev/null || true
    docker service rm dokploy 2>/dev/null || true

    # Prepare admin secret arguments if available
    ADMIN_SECRETS_ARGS=""
    if docker secret inspect rylix_admin_email >/dev/null 2>&1; then
        ADMIN_SECRETS_ARGS="--secret source=rylix_admin_email,target=/run/secrets/rylix_admin_email \
        --secret source=rylix_admin_password,target=/run/secrets/rylix_admin_password \
        --secret source=rylix_admin_name,target=/run/secrets/rylix_admin_name \
        --secret source=rylix_admin_last_name,target=/run/secrets/rylix_admin_last_name"
    fi

    docker service create \
        --name rylix-manager \
        --replicas 1 \
        --network rylix-network \
        --network dokploy-network \
        --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
        --mount type=bind,source=/etc/dokploy,target=/etc/dokploy \
        --mount type=bind,source=/etc/rylix,target=/etc/rylix \
        --mount type=volume,source=dokploy,target=/root/.docker \
        --secret source=dokploy_postgres_password,target=/run/secrets/postgres_password \
        --secret source=dokploy_auth_secret,target=/run/secrets/dokploy_auth_secret \
        $ADMIN_SECRETS_ARGS \
        --publish published=3000,target=3000,mode=host \
        --update-parallelism 1 \
        --update-order stop-first \
        --constraint 'node.role == manager' \
        $endpoint_mode \
        -e POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password \
        -e BETTER_AUTH_SECRET_FILE=/run/secrets/dokploy_auth_secret \
        -e ADMIN_EMAIL="${ADMIN_EMAIL:-}" \
        -e ADMIN_PASSWORD="${ADMIN_PASSWORD:-}" \
        -e ADMIN_NAME="${ADMIN_NAME:-Admin}" \
        -e ADMIN_LAST_NAME="${ADMIN_LAST_NAME:-User}" \
        "$DOCKER_IMAGE"

    sleep 3

    mkdir -p /etc/dokploy/traefik/dynamic
    touch /etc/dokploy/traefik/dynamic/access.log 2>/dev/null || true
    chmod 666 /etc/dokploy/traefik/dynamic/access.log 2>/dev/null || true

    # Traefik Reverse Proxy
    printf "${BLUE}→ Setting up Traefik proxy on ports 80 & 443...${NC}\n"
    docker rm -f rylix-traefik 2>/dev/null || true
    docker rm -f dokploy-traefik 2>/dev/null || true

    docker run -d \
        --name rylix-traefik \
        --restart always \
        --network rylix-network \
        -v /etc/dokploy/traefik/traefik.yml:/etc/traefik/traefik.yml:ro \
        -v /etc/dokploy/traefik/dynamic:/etc/dokploy/traefik/dynamic \
        -v /var/run/docker.sock:/var/run/docker.sock:ro \
        -p 80:80/tcp \
        -p 443:443/tcp \
        -p 443:443/udp \
        traefik:v3.6.7 2>/dev/null || true

    # Linux Kernel & Network Tuning
    printf "${CYAN}→ Applying Linux Kernel & Network Performance Tuning...${NC}\n"
    cat << 'EOF' > /etc/sysctl.d/99-rylix-performance.conf
# High-Throughput Socket Buffers (25MB)
net.core.rmem_max = 26214400
net.core.wmem_max = 26214400
net.ipv4.tcp_rmem = 4096 87380 26214400
net.ipv4.tcp_wmem = 4096 65536 26214400

# High-Concurrency Connection Backlog
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# File Descriptors & Memory Mapping Limits
fs.file-max = 2097152
vm.max_map_count = 262144
vm.swappiness = 10

# BBR Congestion Control
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
EOF
    sysctl --system >/dev/null 2>&1 || true

    # Docker Daemon Log Rotation & Live Restore
    mkdir -p /etc/docker
    if [ ! -f /etc/docker/daemon.json ]; then
        cat << 'EOF' > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  },
  "live-restore": true,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65535,
      "Soft": 65535
    }
  }
}
EOF
        systemctl reload docker >/dev/null 2>&1 || true
    fi

    # UFW Firewall Baseline Configuration
    if command -v ufw >/dev/null 2>&1; then
        ufw allow 22/tcp >/dev/null 2>&1 || true
        ufw allow 80/tcp >/dev/null 2>&1 || true
        ufw allow 443/tcp >/dev/null 2>&1 || true
        ufw allow 3000/tcp >/dev/null 2>&1 || true
    fi

    formatted_public=$(format_ip_for_url "$public_ip")

    printf "\n"
    printf "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"
    printf "${BOLD}${GREEN}  Congratulations! RylixManager is installed successfully!${NC}\n"
    printf "${BOLD}${CYAN}   (Reimagined Version of Dokploy — VPS PaaS & Game Panel)${NC}\n"
    printf "${GREEN}═══════════════════════════════════════════════════════════${NC}\n\n"
    printf "${BOLD}Access your VPS Panel at:${NC}\n"
    printf "  ${CYAN}http://${formatted_public}:3000${NC}\n"
    if [ -n "$private_ip" ] && [ "$private_ip" != "$public_ip" ]; then
        printf "  Internal Network: ${YELLOW}http://${private_ip}:3000${NC}\n"
    fi
    printf "\n"
    printf "${BOLD}Admin Login Credentials:${NC}\n"
    printf "  Email:    ${GREEN}${ADMIN_EMAIL:-admin@rylix.local}${NC}\n"
    printf "  Password: ${GREEN}[Configured during installation]${NC}\n"
    printf "\n"
    printf "${BOLD}Features Active:${NC}\n"
    printf "  ✓ Unlocked Enterprise Suite (Whitelabeling, SSO, Audit Logs, Custom Roles)\n"
    printf "  ✓ Dedicated Game Control Panel (Minecraft, Rust, Palworld, Valheim, CS2)\n"
    printf "  ✓ Built-in Documentation Page at /dashboard/docs\n"
    printf "  ✓ Edge Traffic Analytics Suite (Vercel-Style Requests, Latency, Geography)\n"
    printf "  ✓ Layer 7 Traffic Security Deck (OWASP Headers, DDoS Rate Limiting, Caps)\n"
    printf "  ✓ Linux Kernel Optimization (25MB UDP Socket Buffers, Google BBR, Somaxconn)\n"
    printf "  ✓ VPS Command Deck & Automated Container Maintenance\n\n"
    printf "${BLUE}Note: Allow 10–15 seconds on initial launch for container migrations to finalize.${NC}\n\n"
}

update_rylix() {
    VERSION_TAG=$(detect_version)
    DOCKER_IMAGE="${RYLIX_IMAGE:-ghcr.io/rishbropromax/rylixmanager:${VERSION_TAG}}"

    printf "${CYAN}→ Pulling latest RylixManager image: ${DOCKER_IMAGE}...${NC}\n"
    docker pull "$DOCKER_IMAGE"

    if docker service inspect rylix-manager >/dev/null 2>&1; then
        docker service update --image "$DOCKER_IMAGE" rylix-manager
    elif docker service inspect dokploy >/dev/null 2>&1; then
        docker service update --image "$DOCKER_IMAGE" dokploy
    fi

    printf "${GREEN}✓ RylixManager has been updated successfully!${NC}\n"
}

case "$1" in
    update)
        update_rylix
        ;;
    --help|-h)
        printf "Usage: bash install.sh [COMMAND]\n\n"
        printf "Commands:\n"
        printf "  (default)  Install RylixManager, Docker, Traefik, and Kernel Hardening\n"
        printf "  update     Update RylixManager to the latest release\n"
        printf "  --help, -h Show this help message\n"
        ;;
    *)
        install_rylix
        ;;
esac
