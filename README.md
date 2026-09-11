<div align="center">

# ⚡ RylixManager

### **The Enterprise-Grade Self-Hosted Cloud PaaS, VPS Orchestrator & Pterodactyl-Class Game Server Control Panel**

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20AMD64%20%7C%20ARM64-black?style=for-the-badge&logo=linux" alt="Platform" />
  <img src="https://img.shields.io/badge/Docker-Swarm%20%26%20Engine-black?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Reverse%20Proxy-Traefik%20v3-black?style=for-the-badge&logo=traefik" alt="Traefik" />
  <img src="https://img.shields.io/badge/Enterprise-100%25%20Unlocked-emerald?style=for-the-badge" alt="Enterprise Unlocked" />
  <img src="https://img.shields.io/badge/Node.js-20+-black?style=for-the-badge&logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/License-MIT-black?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>Deploy any application, manage databases, run high-performance game servers, monitor real-time traffic telemetry, and harden Linux infrastructure—all from one unified, sleek dashboard.</strong>
</p>

<p align="center">
  <a href="#-quick-install">Quick Install</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-game-server-control-panel">Game Control Panel</a> •
  <a href="#-vercel-style-traffic-analytics">Traffic Analytics</a> •
  <a href="#-layer-7-traffic-security">Traffic Security</a> •
  <a href="#-linux-host-os-hardening">Host Hardening</a> •
  <a href="#-domain-setup--ssl">Domain & SSL</a> •
  <a href="#-port-matrix">Port Matrix</a> •
  <a href="#-full-troubleshooting--error-fixing-guide">Troubleshooting & Errors</a> •
  <a href="#-backup-restore--migration">Backups & Migration</a> •
  <a href="#-uninstallation">Uninstallation</a>
</p>

</div>

---

## 🌟 What is RylixManager?

**RylixManager** is a modern, open-source Developer Platform as a Service (PaaS) and VPS management control deck that transforms any Linux server or distributed cluster into an automated cloud environment. 

Whether you are hosting web services, managing PostgreSQL/MySQL/Redis clusters, deploying Docker Compose stacks, or running production gaming infrastructure (Minecraft, Rust, Palworld, Counter-Strike 2, Valheim), RylixManager delivers:

1. **Zero-Lock-in Application Orchestration**: Git push deployments, Dockerfile builds, Nixpacks, and Docker Compose with automatic HTTPS.
2. **Pterodactyl-Grade Game Control Panel**: Complete gaming suite with interactive Web TTY terminal, 1-click Mod/Plugin Marketplace, visual MOTD editor, atomic world backup snapshots, and multi-protocol proxy routing.
3. **Vercel-Style Traffic Analytics**: Real-time traffic volume, visitor geography, edge latency percentiles (p75/p95), status code distributions, User-Agent breakdowns, and live request inspector.
4. **Built-in Layer 7 Traffic Manager & Traefik Security Deck**: OWASP strict headers, DDoS rate limiters, connection caps, and response compression for all domains with 1-click toggles.
5. **Linux Host OS & Kernel Tuning**: Automated sysctl network socket optimization (25MB UDP/TCP buffers), Google BBR congestion control, somaxconn listen backlogs, and Docker daemon log rotation safeguards.
6. **100% Unlocked Enterprise Suite**: Whitelabeling, Single Sign-On (SSO), Custom RBAC permissions, audit logging, and multi-server management available out-of-the-box with no license keys required.

---

## 🚀 Quick Install (One-Line Automated Command)

Run this one-line installer on any clean Linux VPS running **Ubuntu 20.04/22.04/24.04, Debian 11/12, Rocky Linux 9, AlmaLinux 9, or Fedora**:

```bash
curl -sSL https://raw.githubusercontent.com/rylixmanager/rylixmanager/main/install.sh | sh
```

### What the installer handles automatically:
- ✅ Installs Docker Engine and activates Docker Swarm mode.
- ✅ Creates the high-performance overlay networks (`rylix-network` & `dokploy-network`).
- ✅ Configures Traefik v3 reverse proxy with Let's Encrypt automated SSL.
- ✅ Applies Linux kernel performance hardening (`99-rylix-performance.conf` with 25MB socket buffers & Google BBR).
- ✅ Configures Docker daemon log rotation (`max-size: 50m`, `max-file: 3`) to prevent disk saturation.
- ✅ Configures UFW firewall baseline rules (Ports 22, 80, 443, 3000).
- ✅ Starts the RylixManager web control deck.

Once the script completes, open your browser and access:
```text
http://<YOUR_SERVER_IP>:3000
```
*(Allow 15–20 seconds on first launch for database migrations and initial service initialization).*

---

## 🎮 Game Server Control Panel & Engine

RylixManager features a dedicated, first-class **Game Server Control Panel** accessible at `/dashboard/game-panel`. It replaces the need for separate Pterodactyl or AMP panels by integrating directly with your container infrastructure.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        🎮 RYLIX GAME CONTROL PANEL                      │
├─────────────────┬─────────────────┬──────────────────┬─────────────────┤
│  Total Servers  │  Online Status  │ Active Protocols │ UDP Net Buffer  │
│      12 Active  │    10 Running   │   TCP/UDP Bound  │  25 MB (Tuned)  │
└─────────────────┴─────────────────┴──────────────────┴─────────────────┘
```

### 1. Interactive Game Console & Live TTY ([game-console-view.tsx](file:///g:/Linux%20Hostble%20thing/dokploy-canary/apps/dokploy/components/dashboard/game-panel/game-console-view.tsx))
- **Real-Time Hardware Telemetry**: Live CPU usage percentage and allocated RAM (MB/GB) counters updated every 4 seconds.
- **Interactive Command Input Bar**: Execute any administrative console command (`op <player>`, `whitelist add <user>`, `say <message>`) with instant feedback.
- **One-Click World Snapshot**: Atomic `tar.gz` data backup created on demand before updating mods or restarting.
- **Pre-Configured Quick Commands**: Instant buttons for `save-all`, `time set day`, `weather clear`, `whitelist on`, and `status`.
- **Dual Console Modes**: Toggle seamlessly between the real-time Docker Log Stream and full interactive TTY terminal.

### 2. Mod & Plugin 1-Click Marketplace ([game-plugins-view.tsx](file:///g:/Linux%20Hostble%20thing/dokploy-canary/apps/dokploy/components/dashboard/game-panel/game-plugins-view.tsx))
- **Curated Plugin Catalog**: Instant 1-click installation of essential plugins:
  - **LuckPerms**: Modern permissions and group management.
  - **EssentialsX**: Teleports, warps, homes, kits, and economy.
  - **ViaVersion**: Multi-version client compatibility.
  - **GeyserMC**: Bedrock Edition (iOS/Android/Console) cross-play onto Java servers.
  - **WorldEdit & FAWE**: Fast in-game terrain builder and brush tools.
  - **Vault**: Universal economy and permission bridge.
  - **Chunky**: Chunk pre-generation to eliminate exploration lag.
  - **spark**: Diagnostic profiler for tick health, CPU, and RAM allocation.
  - **SkinsRestorer**: Skin restoration for hybrid and offline networks.
- **Custom Mod / Plugin Downloader**: Input any direct HTTP/HTTPS URL and target directory to download mods directly into the container.
- **Installed Plugins Manager**: View all `.jar` / `.cs` files with 1-click deletion.

### 3. Visual MOTD & Server Properties Editor ([game-motd-view.tsx](file:///g:/Linux%20Hostble%20thing/dokploy-canary/apps/dokploy/components/dashboard/game-panel/game-motd-view.tsx))
- **Multiplayer Ping Preview**: Realistic in-game Minecraft server list ping card rendering server avatar, formatted color text, ping bars, and player count.
- **Minecraft Color Palette Picker**: Interactive buttons to insert formatting codes (`§0` to `§f`, `§l` Bold, `§o` Italic, `§n` Underline, `§r` Reset).
- **Visual Gameplay Switches**:
  - **Online Mode**: Toggle Mojang authentication or enable offline/cracked clients.
  - **PvP**: Enable or disable player combat.
  - **Whitelist**: Restrict access to approved players.
  - **Hardcore Mode**: Automatically ban players upon death.
  - **Allow Flight**: Allow flying mods and Elytra gliding.
- **Numeric Limits**: Configure Max Players, View Distance (chunks), Simulation Distance, World Difficulty, and Default Gamemode with 1-click apply.

### 4. Game File Manager ([show-compose-files.tsx](file:///g:/Linux%20Hostble%20thing/dokploy-canary/apps/dokploy/components/dashboard/compose/files/show-compose-files.tsx))
- Integrated directory browser directly inside the container volume.
- In-browser code editor with syntax highlighting for `server.properties`, `server.cfg`, `PalWorldSettings.ini`, and YAML files.
- File upload, recursive `mkdir -p` directory creation, and instant download.

### 5. Multi-Protocol Game Proxy Hub ([game-proxy-view.tsx](file:///g:/Linux%20Hostble%20thing/dokploy-canary/apps/dokploy/components/dashboard/game-panel/game-proxy-view.tsx))
- **Direct Connect**: Copyable `IP:Port` address for immediate client connection.
- **DNS SRV Generator**: Automatically generates DNS SRV records (`_minecraft._tcp.play.domain.com`) so players can connect via domain without typing ports.
- **Velocity / BungeeCord Proxy Hub**: Ready-to-copy proxy forwarding configs (`forwarding-secret`, modern BungeeGuard integration).
- **Playit.gg Tunnel Sidecar**: Zero-port-forwarding tunnel generator for servers hosted behind CGNAT or home networks.

### 6. Production Game Blueprints Catalog
Deploy any game server with one click via Docker Compose:
- **Minecraft (Java)**: PaperMC, Purpur, Spigot, Fabric, Forge (`itzg/minecraft-server`, Port `25565`).
- **Minecraft (Bedrock)**: Official dedicated Bedrock server (`itzg/minecraft-bedrock-server`, Port `19132/udp`).
- **Rust**: SteamCMD auto-updating server with Oxide/uMod support (`didstopia/rust-server`, Port `28015/udp`).
- **Palworld**: Multi-threaded dedicated server (`thijsvanloef/palworld-server-docker`, Port `8211/udp`).
- **Counter-Strike 2 (CS2)**: Source 2 engine with custom map support (`joedrumgoole/cs2-server`, Port `27015`).
- **Valheim**: Dedicated world with crossplay (`lloesche/valheim-server`, Port `2456/udp`).
- **Terraria**: TShock server (`ryansheehan/terraria`, Port `7777`).
- **ARK: Survival Evolved**, **Satisfactory**, **Factorio**, **Project Zomboid**, and **Enshrouded**.

---

## 📊 Vercel-Style Traffic Analytics Suite

Accessible at `/dashboard/analytics` (and upgraded `/dashboard/requests`), RylixManager includes an edge-level traffic observability suite powered by Traefik JSON telemetry.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        📈 REAL-TIME TRAFFIC TELEMETRY                  │
├─────────────────┬─────────────────┬──────────────────┬─────────────────┤
│  Total Requests │ Unique Visitors │ Bandwidth Served │ Avg Edge Latency│
│     1,482,910   │    84,219 IPs   │     42.8 GB      │      14.2 ms    │
└─────────────────┴─────────────────┴──────────────────┴─────────────────┘
```

### Telemetry & Analytics Capabilities:
- **KPI Summary**: Total Requests, Deduplicated Unique Client IPs, Total Bandwidth (formatted in MB/GB), Average Latency (ms), p75 and p95 Edge Latency, and Success/Error Rates.
- **Stacked Time-Series Chart**: Hourly and daily request volume visualizer with stacked 2xx (Success), 3xx (Redirect), 4xx (Client Error), and 5xx (Server Error) status codes plus latency trend line.
- **Top Requested Paths**: Ranked endpoints with request share progress bar and average response latency.
- **Domain Breakdown**: Multi-host traffic volume across all registered applications.
- **Hardware & User-Agent Profiling**:
  - **Operating Systems**: macOS, Windows, Linux, iOS, Android, and Other.
  - **Browsers**: Chrome, Safari, Firefox, Edge, Opera, and automated HTTP tools (Curl, Postman).
  - **Device Types**: Desktop, Mobile, Tablet, and Automated Bot / Scraper traffic.
- **Top Client IPs**: Identifies heavy users, web crawlers, or malicious scrapers.
- **Real-Time Request Stream**: Live request stream with click-to-inspect dialog showing HTTP method, host, path, status, latency, client IP, and User-Agent headers.
- **1-Click Data Export**: Download aggregated metrics as JSON or export recent request logs directly to CSV.

---

## 🛡️ Layer 7 Traffic Security & Traefik Shield

Accessible at `/dashboard/traffic`, RylixManager includes a built-in reverse proxy security deck that protects your web applications and APIs against Layer 7 attacks, clickjacking, MIME sniffing, and bandwidth abuse.

### Security Middlewares Engine ([traefik-setup.ts](file:///g:/Linux%20Hostble%20thing/dokploy-canary/packages/server/src/setup/traefik-setup.ts)):
1. **Strict OWASP Security Headers** (`security-headers-strict`):
   - `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload` (Enforces 1-year HSTS).
   - `X-Frame-Options: DENY` (Eliminates clickjacking attacks).
   - `X-Content-Type-Options: nosniff` (Prevents MIME-type spoofing).
   - `X-XSS-Protection: 1; mode=block` (Browser-level XSS filter).
   - `Referrer-Policy: strict-origin-when-cross-origin`.
2. **DDoS & Brute-Force Rate Limiter** (`rate-limit-standard` & `rate-limit-strict`):
   - Public Apps: Average 100 req/s, Burst 50 requests per client IP.
   - Strict Auth Routes: Average 20 req/s, Burst 10 requests per client IP.
3. **Connection Flood Shield** (`connection-limit-50`):
   - Caps concurrent in-flight HTTP connections to 50 per IP address to thwart slowloris and exhaustion attacks.
4. **Auto Gzip / Brotli Compression** (`auto-compress`):
   - Dynamically compresses text, JSON, HTML, and CSS assets, reducing bandwidth consumption by up to 70%.
5. **In-Memory Request Buffer** (`request-buffer-100mb`):
   - Absorbs and buffers large client payloads safely up to 100MB before proxying upstream.

---

## 🐧 Linux Host OS & Kernel Hardening

RylixManager includes automated Linux kernel diagnostics and one-click performance tuning specifically designed for high-concurrency web traffic and low-latency gaming:

### Sysctl Network & Memory Hardening (`/etc/sysctl.d/99-rylix-performance.conf`):
```ini
# Max socket receive buffer (25MB) - Prevents UDP packet loss for game servers
net.core.rmem_max = 26214400
net.core.rmem_default = 26214400

# Max socket send buffer (25MB)
net.core.wmem_max = 26214400
net.core.wmem_default = 26214400

# High-concurrency listen backlog (Thwarts SYN floods)
net.core.somaxconn = 65535

# System-wide open file descriptors limit (2 Million)
fs.file-max = 2097152

# Virtual memory mapping count for databases & game engines
vm.max_map_count = 262144

# Prioritizes physical RAM over disk swap thrashing
vm.swappiness = 10

# Google BBR TCP Congestion Control (Superior throughput on high-latency links)
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
```

### Docker Daemon Protection (`/etc/docker/daemon.json`):
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  },
  "live-restore": true
}
```
- **Log Rotation (`max-size: 50m`)**: Eliminates runaway Docker container log files filling 100% of root disk space.
- **Live Restore (`live-restore: true`)**: Ensures running containers stay alive even during Docker daemon updates or restarts.

---

## 🌐 Domain Setup & SSL Configuration

### 1. Pointing Your Domain to RylixManager
1. Create an **A Record** in your DNS provider (e.g. Cloudflare, Namecheap, Route53):
   ```text
   Type: A
   Name: panel (or @ for root domain)
   Value: <YOUR_VPS_PUBLIC_IP>
   TTL: Auto or 300 seconds
   ```
2. Navigate to **Settings → Server Domain** inside RylixManager:
   - Enter your domain (e.g., `panel.yourdomain.com`).
   - Enable **HTTPS (Let's Encrypt)**.
   - Enter your email address for SSL expiration notifications.
   - Click **Save**. Traefik will issue and provision a Let's Encrypt TLS certificate within 30 seconds.

### 2. Cloudflare Proxying Best Practices
If using Cloudflare with the orange cloud (Proxy enabled):
- Set Cloudflare SSL/TLS encryption mode to **Full (Strict)**.
- Under **Network**, ensure **WebSockets** and **gRPC** are enabled.
- For Game Servers: Game ports (25565, 28015, 8211) cannot pass through standard HTTP Cloudflare proxies. Create a separate unproxied (grey cloud) DNS A record (e.g. `play.yourdomain.com`) or use the **DNS SRV Record Generator** under the Proxy tab.

---

## 🔧 Full Troubleshooting & Error Fixing Guide

### ❌ Error 1: Port 80 or 443 already in use
**Symptom**: Traefik container fails to start, or installer prints `port is already allocated`.  
**Root Cause**: A pre-installed web server (Apache, Nginx, or Caddy) or `systemd-resolved` is holding ports 80/443.  
**Fix**:
```bash
# 1. Identify which process is binding the port
sudo lsof -i :80
sudo lsof -i :443

# 2. Stop and disable Apache or Nginx if installed
sudo systemctl stop apache2 2>/dev/null || true
sudo systemctl disable apache2 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl disable nginx 2>/dev/null || true

# 3. Restart Traefik
docker restart rylix-traefik
```

---

### ❌ Error 2: Let's Encrypt ACME Challenge Failed (404 / Timeout)
**Symptom**: Domain does not get an HTTPS certificate, browser warns of invalid certificate.  
**Root Cause**: DNS record has not propagated yet, firewall blocks port 80 (required for ACME challenge), or Cloudflare Flexible SSL is causing a redirect loop.  
**Fix**:
1. Verify DNS propagation: `dig +short yourdomain.com` (Must match your server public IP).
2. Ensure port 80 is open to the internet (Let's Encrypt validates HTTP-01 on port 80):
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```
3. Check Traefik error logs:
   ```bash
   docker logs rylix-traefik --tail 100
   ```
4. If using Cloudflare, change SSL mode from **Flexible** to **Full (Strict)**.

---

### ❌ Error 3: Docker Swarm Node is Not a Manager
**Symptom**: `Error: This node is not a swarm manager. Use "docker swarm init" or "docker swarm join" to connect this node to swarm and try again.`  
**Root Cause**: Docker Swarm state became corrupted or the IP address of the host changed.  
**Fix**:
```bash
# Force leave swarm and reinitialize cleanly
docker swarm leave --force
docker swarm init --advertise-addr $(curl -s https://ifconfig.io)

# Recreate overlay networks
docker network create --driver overlay --attachable rylix-network
docker network create --driver overlay --attachable dokploy-network

# Re-run install script to re-deploy services
bash install.sh
```

---

### ❌ Error 4: Database Connection Refused / Port 3000 Timeout
**Symptom**: Web panel loads infinitely or displays `Database error` on initial startup.  
**Root Cause**: PostgreSQL is still running migrations or the container ran out of memory.  
**Fix**:
```bash
# 1. Inspect PostgreSQL service status
docker service ps rylix-postgres
docker service logs rylix-postgres --tail 50

# 2. Inspect RylixManager service status
docker service ps rylix-manager
docker service logs rylix-manager --tail 50

# 3. If Postgres failed to write data, fix permissions:
chmod 777 /etc/dokploy
docker service update --force rylix-postgres
```

---

### ❌ Error 5: Game Server High Ping / Packet Loss
**Symptom**: Players experience teleportation, rubber-banding, or timeout disconnections on Minecraft, Rust, or Palworld.  
**Root Cause**: Default Linux kernel socket buffers are too small (212KB), causing incoming UDP packets to overflow and get dropped.  
**Fix**:
1. Check if Rylix kernel tuning is active:
   ```bash
   sysctl net.core.rmem_max
   # Should return 26214400 (25MB)
   ```
2. If not applied, enforce it manually:
   ```bash
   sudo sysctl -w net.core.rmem_max=26214400
   sudo sysctl -w net.core.wmem_max=26214400
   sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
   ```
3. Ensure the game server's UDP port is open in your cloud provider firewall (e.g. AWS Security Group, Hetzner Firewall).

---

### ❌ Error 6: Disk Space Full (`No space left on device`)
**Symptom**: Deployments fail with `write /var/lib/docker/...: no space left on device`.  
**Root Cause**: Unused Docker build cache, old images, or unrotated container logs.  
**Fix**:
```bash
# 1. Clean all stopped containers, dangling images, and build cache
docker system prune -af --volumes

# 2. Check disk usage per directory
df -h /
du -sh /var/lib/docker/* | sort -hr | head -n 5

# 3. Ensure Docker daemon log rotation is active:
cat /etc/docker/daemon.json
# Should contain "max-size": "50m"
```

---

### ❌ Error 7: Container OOM Killer (Exit Code 137)
**Symptom**: Game server or database container suddenly dies and restarts; logs show `exited with code 137`.  
**Root Cause**: Out Of Memory (OOM). The Linux kernel killed the process to prevent system freeze.  
**Fix**:
1. Add a swap file if your VPS has 2GB–4GB of RAM:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
2. For Minecraft servers, allocate explicit Java memory in the compose environment variables:
   ```yaml
   environment:
     - MEMORY=4G
     - INIT_MEMORY=2G
   ```

---

### ❌ Error 8: Proxmox LXC Container Compatibility
**Symptom**: Docker Swarm fails to initialize inside a Proxmox LXC container.  
**Root Cause**: LXC containers need nesting and keyctl enabled to run Docker Swarm overlay networks.  
**Fix**:
1. On the Proxmox Host: Open LXC container **Options → Features** and enable:
   - ✅ **Nesting**
   - ✅ **keyctl**
2. In the LXC configuration file (`/etc/pve/lxc/<ID>.conf`), add:
   ```text
   lxc.apparmor.profile: unconfined
   lxc.cgroup2.devices.allow: a
   lxc.cap.drop:
   ```
3. RylixManager installer automatically detects Proxmox LXC and applies `--endpoint-mode dnsrr`.

---

## 🔒 Enterprise Features 100% Unlocked

| Enterprise Feature | Proprietary Cloud PaaS | RylixManager Self-Hosted |
| :--- | :---: | :---: |
| **Whitelabeling & Custom Branding** | 🔒 $499/mo | **✅ Included Free** |
| **Audit Logs & Activity Trail** | 🔒 Enterprise Only | **✅ Included Free** |
| **Custom RBAC & Permission Policies** | 🔒 Enterprise Only | **✅ Included Free** |
| **Single Sign-On (SSO / SAML / OIDC)** | 🔒 Enterprise Only | **✅ Included Free** |
| **Multi-Server VPS Orchestration** | 🔒 $29/server | **✅ Unlimited Free** |
| **Automated S3/R2 Database Backups** | 🔒 Paid Addon | **✅ Included Free** |
| **Integrated Game Control Panel** | ❌ Not Supported | **✅ Native Built-In** |
| **Edge Traffic Telemetry & Analytics**| 🔒 $20/domain | **✅ Native Built-In** |

---

## 🌐 Port Matrix & Firewall Reference

### Core Platform Ports:
| Port | Protocol | Purpose | Access Level |
| :--- | :---: | :--- | :--- |
| `3000` | TCP | RylixManager Web Control Deck | Public / Admin |
| `80` | TCP | Traefik Reverse Proxy (HTTP & ACME Challenge) | Public |
| `443` | TCP / UDP | Traefik Reverse Proxy (HTTPS & HTTP/3 QUIC) | Public |
| `22` | TCP | SSH Server Access | Admin Only |

### Gaming Ports:
| Port | Protocol | Purpose | Game / Engine |
| :--- | :---: | :--- | :--- |
| `25565` | TCP | Primary Client Connection | Minecraft Java Edition |
| `25575` | TCP | Remote Console (RCON) | Minecraft Java Edition |
| `19132` | UDP | Primary Client Connection | Minecraft Bedrock Edition |
| `28015` | UDP | Game Traffic & Queries | Rust Dedicated Server |
| `28016` | TCP | Remote Console (RCON) | Rust Dedicated Server |
| `8211` | UDP | Dedicated Server Port | Palworld Dedicated Server |
| `27015` | TCP / UDP | Game Traffic & Query Port | Counter-Strike 2 (CS2) |
| `2456`–`2457` | UDP | Game Traffic & Queries | Valheim Dedicated Server |
| `7777` | TCP | Game Port | Terraria (TShock) |
| `27015`–`27020` | UDP | Game Traffic | ARK: Survival Evolved |
| `16261` | UDP | Game Client Port | Project Zomboid |

---

## 💾 Backup, Restore & Disaster Recovery

### 1. Manual Backup
All persistent state (database, secrets, Traefik dynamic configs, and game volumes) is stored in `/etc/dokploy`. To create a complete backup archive:

```bash
sudo tar -czvf rylix-full-backup-$(date +%F).tar.gz /etc/dokploy
```

### 2. Restoring to a New Server
1. Transfer the backup file to your new server:
   ```bash
   scp rylix-full-backup-*.tar.gz root@<NEW_SERVER_IP>:/root/
   ```
2. On the new server, extract the archive before running the installer:
   ```bash
   sudo tar -xzvf /root/rylix-full-backup-*.tar.gz -C /
   ```
3. Run the installer to reconnect services:
   ```bash
   curl -sSL https://raw.githubusercontent.com/rylixmanager/rylixmanager/main/install.sh | sh
   ```
All configurations, users, and game volumes will be restored seamlessly.

---

## 🗑️ Uninstallation

To safely uninstall RylixManager, Traefik, and associated services:

### 1. Interactive Uninstallation (Preserves Configuration & Data)
```bash
sudo bash uninstall.sh
```
*Stops all services and containers while keeping `/etc/dokploy` intact for future reinstallation.*

### 2. Complete Purge (Deletes All Data, Databases, and Volumes)
```bash
sudo bash uninstall.sh --purge-data --remove-kernel-tuning --force
```

---

## 🔄 Updating RylixManager

To update your RylixManager installation to the latest stable release:

```bash
bash install.sh update
```

Or execute directly through Docker Swarm:
```bash
docker service update --image rylixmanager/rylixmanager:latest --force rylix-manager
```

---

## 📄 License

RylixManager is open-source software licensed under the **MIT License**. All enterprise and proprietary modules are permanently unlocked for self-hosted community operators.
