#!/bin/bash
# ==============================================================================
#  RylixManager — Linux VPS Uninstallation & Cleanup Utility
#  One-Line Uninstaller: curl -sSL https://raw.githubusercontent.com/RishBroProMax/rylixmanager/main/uninstall.sh | sh
# ==============================================================================

set -e

# Terminal styling
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

print_banner() {
    cat << "EOF"

  ██████╗ ██╗   ██╗██╗     ██╗██╗  ██╗
  ██╔══██╗╚██╗ ██╔╝██║     ██║╚██╗██╔╝
  ██████╔╝ ╚████╔╝ ██║     ██║ ╚███╔╝ 
  ██╔══██╗  ╚██╔╝  ██║     ██║ ██╔██╗ 
  ██║  ██║   ██║   ███████╗██║██╔╝ ██╗
  ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝╚═╝  ╚═╝
   M A N A G E R  —  Uninstallation & Cleanup Utility

EOF
}

FORCE=false
PURGE_DATA=false
REMOVE_KERNEL_TUNING=true

# Parse flags
for arg in "$@"; do
    case "$arg" in
        -f|--force|-y|--yes)
            FORCE=true
            ;;
        --purge-data)
            PURGE_DATA=true
            ;;
        --keep-kernel-tuning)
            REMOVE_KERNEL_TUNING=false
            ;;
        --help|-h)
            print_banner
            printf "Usage: bash uninstall.sh [OPTIONS]\n\n"
            printf "Options:\n"
            printf "  -y, -f, --force, --yes      Skip confirmation prompt (non-interactive mode)\n"
            printf "  --purge-data                Permanently delete database volumes and /etc/rylix, /etc/dokploy\n"
            printf "  --keep-kernel-tuning        Keep /etc/sysctl.d/99-rylix-performance.conf in place\n"
            printf "  -h, --help                  Display this help message\n\n"
            exit 0
            ;;
    esac
done

print_banner

# Require root
if [ "$(id -u)" -ne 0 ]; then
    printf "${RED}Error: This uninstaller must be executed as root (use sudo).${NC}\n" >&2
    exit 1
fi

if [ "$FORCE" = false ]; then
    printf "${YELLOW}WARNING: This will stop and remove RylixManager, Traefik, and all managed platform services.${NC}\n"
    if [ "$PURGE_DATA" = true ]; then
        printf "${RED}CRITICAL: --purge-data is selected. All database records and configs will be DELETED permanently.${NC}\n"
    else
        printf "${CYAN}Note: Application configuration and database storage will be PRESERVED.${NC}\n"
    fi
    printf "\n"
    read -p "Are you sure you want to proceed with uninstallation? (y/N): " -r CONFIRM </dev/tty || CONFIRM="y"
    case "$CONFIRM" in
        [yY][eE][sS]|[yY])
            ;;
        *)
            printf "${BLUE}Uninstallation cancelled.${NC}\n"
            exit 0
            ;;
    esac
fi

printf "\n${CYAN}→ Stopping RylixManager and Dokploy Swarm services...${NC}\n"
docker service rm rylix-manager 2>/dev/null || true
docker service rm dokploy 2>/dev/null || true
docker service rm rylix-postgres 2>/dev/null || true
docker service rm dokploy-postgres 2>/dev/null || true

printf "${CYAN}→ Stopping Traefik reverse proxy containers...${NC}\n"
docker rm -f rylix-traefik 2>/dev/null || true
docker rm -f dokploy-traefik 2>/dev/null || true

printf "${CYAN}→ Removing Swarm secrets and overlay networks...${NC}\n"
docker secret rm rylix_postgres_password 2>/dev/null || true
docker secret rm dokploy_postgres_password 2>/dev/null || true
docker secret rm rylix_auth_secret 2>/dev/null || true
docker secret rm dokploy_auth_secret 2>/dev/null || true
docker secret rm rylix_admin_email 2>/dev/null || true
docker secret rm rylix_admin_password 2>/dev/null || true
docker secret rm rylix_admin_name 2>/dev/null || true
docker secret rm rylix_admin_last_name 2>/dev/null || true

docker network rm rylix-network 2>/dev/null || true
docker network rm dokploy-network 2>/dev/null || true

# Remove Kernel Tuning if requested
if [ "$REMOVE_KERNEL_TUNING" = true ]; then
    printf "${CYAN}→ Removing kernel tuning profile (/etc/sysctl.d/99-rylix-performance.conf)...${NC}\n"
    rm -f /etc/sysctl.d/99-rylix-performance.conf
    sysctl --system >/dev/null 2>&1 || true
fi

# Purge data directories and Docker volumes if requested
if [ "$PURGE_DATA" = true ]; then
    printf "${RED}→ Purging configuration directories and Docker data volumes...${NC}\n"
    rm -rf /etc/rylix
    rm -rf /etc/dokploy
    docker volume rm dokploy-postgres 2>/dev/null || true
    docker volume rm dokploy 2>/dev/null || true
    printf "${GREEN}✓ All persistent configuration and database volumes purged.${NC}\n"
else
    printf "${CYAN}✓ Configurations preserved in /etc/rylix and /etc/dokploy.${NC}\n"
fi

printf "\n"
printf "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"
printf "${BOLD}${GREEN}  RylixManager has been uninstalled successfully.${NC}\n"
printf "${GREEN}═══════════════════════════════════════════════════════════${NC}\n\n"
if [ "$PURGE_DATA" = false ]; then
    printf "To re-install RylixManager and resume using your existing data, run:\n"
    printf "  ${CYAN}curl -sSL https://raw.githubusercontent.com/RishBroProMax/rylixmanager/main/install.sh | sh${NC}\n\n"
fi
