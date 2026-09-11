import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@dokploy/server/db";
import { domains } from "@dokploy/server/db/schema/domain";
import { execAsync, execAsyncRemote } from "@dokploy/server/utils/process/execAsync";
import { manageDomain } from "@dokploy/server/utils/traefik/domain";
import { addDomainToCompose } from "@dokploy/server/utils/docker/domain";
import { ensureSecurityMiddlewares } from "@dokploy/server/utils/traefik/middleware";
import { eq, inArray } from "drizzle-orm";
import { findApplicationById } from "./application";
import { findComposeById } from "./compose";

export interface SecurityProfileInfo {
	id: string;
	name: string;
	category: "security" | "traffic" | "performance";
	description: string;
	badge: string;
	recommendedFor: string;
}

export const TRAFFIC_SECURITY_PROFILES: SecurityProfileInfo[] = [
	{
		id: "security-headers-strict",
		name: "Strict OWASP Security Headers",
		category: "security",
		description:
			"Enforces HSTS (1 year + preload), X-Frame-Options (DENY), nosniff MIME-type protection, and strict referrer policies to eliminate clickjacking and XSS.",
		badge: "Critical",
		recommendedFor: "All Production Apps & APIs",
	},
	{
		id: "rate-limit-standard",
		name: "DDoS & Brute-Force Rate Limiter (100 req/s)",
		category: "traffic",
		description:
			"Mitigates Layer 7 DDoS and brute force attacks with an average of 100 req/s and 50 burst requests per IP address.",
		badge: "Standard",
		recommendedFor: "Public Web Applications",
	},
	{
		id: "rate-limit-strict",
		name: "High-Security Rate Limiter (20 req/s)",
		category: "traffic",
		description:
			"Aggressive throttling (20 req/s, burst 10) ideal for sensitive endpoints, authentication forms, and payment gateways.",
		badge: "Strict",
		recommendedFor: "Auth / Login / Admin Routes",
	},
	{
		id: "connection-limit-50",
		name: "Connection Flood Shield (50 In-Flight)",
		category: "traffic",
		description:
			"Caps simultaneous concurrent connections to 50 per IP to stop slowloris and HTTP flood connection starvation.",
		badge: "Anti-Flood",
		recommendedFor: "High-Concurrency Services",
	},
	{
		id: "auto-compress",
		name: "Automatic Gzip & Brotli Compression",
		category: "performance",
		description:
			"Compresses HTTP response bodies on-the-fly, reducing bandwidth consumption by up to 70% and dramatically accelerating TTFB.",
		badge: "Speed Boost",
		recommendedFor: "Frontend SPAs & REST APIs",
	},
	{
		id: "request-buffer-100mb",
		name: "Protected In-Memory Buffer (100MB)",
		category: "performance",
		description:
			"Buffers large file uploads with a 100MB limit and automatic network retry logic, preventing memory exhaustion on backend workers.",
		badge: "Buffer Guard",
		recommendedFor: "File Upload & Media Services",
	},
];

export interface LinuxDiagnosticMetric {
	key: string;
	label: string;
	currentValue: string;
	recommendedValue: string;
	status: "optimal" | "warning" | "unconfigured";
	description: string;
}

export const getLinuxHostDiagnostics = async (
	serverId?: string,
): Promise<{
	metrics: LinuxDiagnosticMetric[];
	osInfo: string;
	dockerLiveRestore: boolean;
	bbrEnabled: boolean;
}> => {
	const runCmd = async (cmd: string): Promise<string> => {
		try {
			const { stdout } = serverId
				? await execAsyncRemote(serverId, cmd)
				: await execAsync(cmd);
			return stdout.trim();
		} catch {
			return "";
		}
	};

	const [
		rmemMax,
		wmemMax,
		somaxconn,
		fileMax,
		swappiness,
		cc,
		osRelease,
		dockerDaemon,
	] = await Promise.all([
		runCmd("sysctl -n net.core.rmem_max"),
		runCmd("sysctl -n net.core.wmem_max"),
		runCmd("sysctl -n net.core.somaxconn"),
		runCmd("sysctl -n fs.file-max"),
		runCmd("sysctl -n vm.swappiness"),
		runCmd("sysctl -n net.ipv4.tcp_congestion_control"),
		runCmd("uname -srm"),
		runCmd("cat /etc/docker/daemon.json"),
	]);

	const bbrEnabled = cc === "bbr";
	let dockerLiveRestore = false;
	try {
		if (dockerDaemon) {
			const parsed = JSON.parse(dockerDaemon);
			dockerLiveRestore = !!parsed["live-restore"];
		}
	} catch {
		// unparseable
	}

	const rmemNum = parseInt(rmemMax, 10) || 0;
	const wmemNum = parseInt(wmemMax, 10) || 0;
	const somaxNum = parseInt(somaxconn, 10) || 0;
	const fileMaxNum = parseInt(fileMax, 10) || 0;
	const swapNum = parseInt(swappiness, 10) || 60;

	const metrics: LinuxDiagnosticMetric[] = [
		{
			key: "bbr",
			label: "TCP BBR Congestion Control",
			currentValue: cc || "cubic / reno",
			recommendedValue: "bbr",
			status: bbrEnabled ? "optimal" : "warning",
			description:
				"Google BBR dynamically handles packet loss and optimizes throughput for high-concurrency web and game traffic.",
		},
		{
			key: "rmem",
			label: "Socket Receive Buffer (net.core.rmem_max)",
			currentValue: rmemNum > 0 ? `${(rmemNum / 1024 / 1024).toFixed(1)} MB` : "Default (212 KB)",
			recommendedValue: "25.0 MB",
			status: rmemNum >= 16777216 ? "optimal" : "warning",
			description:
				"Prevents socket buffer overflow on heavy TCP traffic and game UDP streams.",
		},
		{
			key: "wmem",
			label: "Socket Send Buffer (net.core.wmem_max)",
			currentValue: wmemNum > 0 ? `${(wmemNum / 1024 / 1024).toFixed(1)} MB` : "Default (212 KB)",
			recommendedValue: "25.0 MB",
			status: wmemNum >= 16777216 ? "optimal" : "warning",
			description:
				"Ensures maximum outbound bandwidth utilization without packet drops.",
		},
		{
			key: "somaxconn",
			label: "Listen Backlog (net.core.somaxconn)",
			currentValue: somaxNum ? somaxNum.toString() : "128 (Default)",
			recommendedValue: "65535",
			status: somaxNum >= 4096 ? "optimal" : "warning",
			description:
				"Maximum connection queue for incoming SYN requests to Traefik and Docker.",
		},
		{
			key: "fileMax",
			label: "Max File Descriptors (fs.file-max)",
			currentValue: fileMaxNum ? fileMaxNum.toLocaleString() : "Default",
			recommendedValue: "2,097,152",
			status: fileMaxNum >= 1000000 ? "optimal" : "warning",
			description:
				"High open-file limit preventing 'Too many open files' socket exhaustion.",
		},
		{
			key: "swappiness",
			label: "Memory Swappiness (vm.swappiness)",
			currentValue: swapNum.toString(),
			recommendedValue: "10",
			status: swapNum <= 15 ? "optimal" : "warning",
			description:
				"Low swappiness prioritizes fast RAM operations over disk page file thrashing.",
		},
	];

	return {
		metrics,
		osInfo: osRelease || "Linux Enterprise Host",
		dockerLiveRestore,
		bbrEnabled,
	};
};

export const getLinuxHardeningScript = (): string => {
	return `#!/usr/bin/env bash
set -e

echo "🚀 [RylixManager] Applying Enterprise Linux System & Kernel Hardening..."

# 1. Sysctl Network & Memory Optimization
cat << 'EOF' > /etc/sysctl.d/99-rylix-performance.conf
# High-Throughput Socket Buffers (25MB)
net.core.rmem_max = 26214400
net.core.wmem_max = 26214400
net.ipv4.tcp_rmem = 4096 87380 26214400
net.ipv4.tcp_wmem = 4096 65536 26214400

# High-Concurrency Connection Backlog
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# File Descriptors & Database Limits
fs.file-max = 2097152
vm.max_map_count = 262144
vm.swappiness = 10

# BBR Congestion Control
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
EOF

# Load sysctl rules
sysctl --system > /dev/null 2>&1 || true

# 2. Docker Daemon Hardening (Log Rotation & Live Restore)
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
systemctl reload docker > /dev/null 2>&1 || true
fi

# 3. UFW Firewall Baseline
if command -v ufw > /dev/null 2>&1; then
    ufw allow 22/tcp > /dev/null 2>&1 || true
    ufw allow 80/tcp > /dev/null 2>&1 || true
    ufw allow 443/tcp > /dev/null 2>&1 || true
    ufw allow 3000/tcp > /dev/null 2>&1 || true
fi

echo "✅ [RylixManager] Linux Host Tuning successfully applied!"
`;
};

export const applyLinuxHardening = async (serverId?: string): Promise<boolean> => {
	const script = getLinuxHardeningScript();
	const base64Script = Buffer.from(script, "utf8").toString("base64");
	const command = `echo "${base64Script}" | base64 -d | bash`;

	if (serverId) {
		await execAsyncRemote(serverId, command);
	} else {
		await execAsync(command);
	}
	return true;
};

export const getAllDomainsWithProtection = async () => {
	const allDomains = await db.query.domains.findMany({
		with: {
			application: {
				columns: {
					applicationId: true,
					name: true,
					appName: true,
					serverId: true,
				},
			},
			compose: {
				columns: {
					composeId: true,
					name: true,
					appName: true,
					serverId: true,
				},
			},
		},
	});

	return allDomains.map((d) => {
		const serviceName = d.application?.name || d.compose?.name || "Service";
		const serviceType = d.applicationId ? "application" : "compose";
		const activeMiddlewares = d.middlewares || [];

		return {
			domainId: d.domainId,
			host: d.host,
			https: d.https,
			serviceName,
			serviceType,
			serviceId: d.applicationId || d.composeId || "",
			serverId: d.application?.serverId || d.compose?.serverId || null,
			middlewares: activeMiddlewares,
			hasStrictHeaders: activeMiddlewares.includes("security-headers-strict"),
			hasRateLimit:
				activeMiddlewares.includes("rate-limit-standard") ||
				activeMiddlewares.includes("rate-limit-strict"),
			hasCompression: activeMiddlewares.includes("auto-compress"),
			hasConnectionLimit: activeMiddlewares.includes("connection-limit-50"),
		};
	});
};

export const toggleDomainSecurityMiddleware = async (
	domainId: string,
	middlewareId: string,
	enable: boolean,
) => {
	const domain = await db.query.domains.findFirst({
		where: eq(domains.domainId, domainId),
		with: {
			application: true,
			compose: true,
		},
	});

	if (!domain) {
		throw new Error("Domain not found");
	}

	const serverId =
		domain.application?.serverId || domain.compose?.serverId || undefined;

	// Ensure standard middlewares exist in Traefik
	await ensureSecurityMiddlewares(serverId);

	const currentMiddlewares = new Set(domain.middlewares || []);

	if (enable) {
		currentMiddlewares.add(middlewareId);
	} else {
		currentMiddlewares.delete(middlewareId);
	}

	const updatedList = Array.from(currentMiddlewares);

	await db
		.update(domains)
		.set({ middlewares: updatedList })
		.where(eq(domains.domainId, domainId));

	// Re-apply Traefik router config
	if (domain.application) {
		await manageDomain(domain.application as any, {
			...domain,
			middlewares: updatedList,
		} as any);
	} else if (domain.compose) {
		await addDomainToCompose(domain.compose as any, [
			{
				...domain,
				middlewares: updatedList,
			} as any,
		]);
	}

	return { success: true, middlewares: updatedList };
};
