#!/bin/bash
# ==============================================================================
#  RylixManager - Linux VPS Uninstallation & Cleanup Script
#  Usage: bash uninstall.sh [--purge-data] [--force]
# ==============================================================================

set -e

# Terminal colors
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
   UNINSTALLATION & CLEANUP UTILITY
EOF
}

FORCE=false
PURGE_DATA=false
REMOVE_KERNEL_TUNING=false

# Parse command line flags
for arg in "$@"; do
    case "$arg" in
        -f|--force)
            FORCE=true
            ;;
        --purge-data)
            PURGE_DATA=true
            ;;
        --remove-kernel-tuning)
            REMOVE_KERNEL_TUNING=true
            ;;
        --help|-h)
            print_banner
            printf "Usage: bash uninstall.sh [OPTIONS]\n\n"
            printf "Options:\n"
            printf "  -f, --force               Skip confirmation prompts (non-interactive mode)\n"
            printf "  --purge-data              Permanently delete all configuration, database volumes, and game data\n"
            printf "  --remove-kernel-tuning    Remove /etc/sysctl.d/99-rylix-performance.conf\n"
            printf "  -h, --help                Display this help message\n"
            exit 0
            ;;
    esac
done

print_banner

# Require root
if [ "$(id -u)" -ne 0 ]; then
    printf "${RED}Error: This uninstaller must be executed as root (or with sudo).${NC}\n" >&2
    exit 1
fi

if [ "$FORCE" = false ]; then
    printf "${YELLOW}WARNING: This will terminate RylixManager, Traefik proxy, and related platform services.${NC}\n"
    if [ "$PURGE_DATA" = true ]; then
        printf "${RED}CRITICAL: --purge-data is active. All database records and configs in /etc/dokploy will be DELETED.${NC}\n"
    else
        printf "${CYAN}Note: Application configuration and game server data in /etc/dokploy will be PRESERVED.${NC}\n"
    fi
    printf "\n"
    read -p "Are you sure you want to proceed with uninstallation? (y/N): " -r CONFIRM
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

docker network rm rylix-network 2>/dev/null || true
docker network rm dokploy-network 2>/dev/null || true

if [ "$PURGE_DATA" = true ]; then
    printf "${RED}→ Purging /etc/dokploy, /etc/rylix, and database volumes...${NC}\n"
    rm -rf /etc/dokploy
    rm -rf /etc/rylix
    docker volume rm dokploy 2>/dev/null || true
    docker volume rm dokploy-postgres 2>/dev/null || true
    printf "${GREEN}✓ Persistent directories and database volumes removed.${NC}\n"
else
    printf "${YELLOW}→ Preserving configuration and volume data in /etc/dokploy.${NC}\n"
    printf "  (To completely delete data later, run: rm -rf /etc/dokploy /etc/rylix)\n"
fi

if [ "$REMOVE_KERNEL_TUNING" = true ]; then
    printf "${CYAN}→ Removing sysctl kernel performance configuration...${NC}\n"
    rm -f /etc/sysctl.d/99-rylix-performance.conf
    sysctl --system >/dev/null 2>&1 || true
    printf "${GREEN}✓ Kernel settings restored.${NC}\n"
fi

printf "\n"
printf "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"
printf "${BOLD}${GREEN}  RylixManager has been uninstalled successfully.${NC}\n"
printf "${GREEN}═══════════════════════════════════════════════════════════${NC}\n\n"
if [ "$PURGE_DATA" = false ]; then
    printf "Your data remains safely stored at ${CYAN}/etc/dokploy${NC}.\n"
    printf "To reinstall at any time, run:\n"
    printf "  ${YELLOW}curl -sSL https://raw.githubusercontent.com/rylixmanager/rylixmanager/main/install.sh | sh${NC}\n\n"
fi
