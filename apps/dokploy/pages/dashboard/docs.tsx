import { validateRequest } from "@dokploy/server/lib/auth";
import type { GetServerSidePropsContext } from "next";
import { type ReactElement, useState } from "react";
import {
	Activity,
	BookOpen,
	Check,
	Code2,
	Copy,
	Database,
	ExternalLink,
	Gamepad2,
	Globe,
	HardDrive,
	HelpCircle,
	Lock,
	Rocket,
	Server,
	Shield,
	Terminal,
	Trash2,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CodeBlock = ({ code }: { code: string }) => {
	const [copied, setCopied] = useState(false);

	const onCopy = () => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		toast.success("Command copied to clipboard!");
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="relative group rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-100 dark:bg-zinc-900 border border-border/50">
			<div className="overflow-x-auto pr-10">{code}</div>
			<Button
				size="icon"
				variant="ghost"
				className="absolute right-2 top-2 h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
				onClick={onCopy}
			>
				{copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
			</Button>
		</div>
	);
};

const DocsPage = () => {
	const [activeTab, setActiveTab] = useState("overview");

	return (
		<div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full pb-20">
			{/* Hero Banner */}
			<div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 shadow-sm">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<div className="space-y-2">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-primary/20 p-2.5 text-primary border border-primary/30">
								<BookOpen className="h-7 w-7" />
							</div>
							<div>
								<h1 className="text-3xl font-bold tracking-tight">RylixManager Documentation</h1>
								<p className="text-muted-foreground text-sm font-medium">
									Next-Gen VPS Orchestrator, PaaS & Game Server Control Deck — Reimagined from Dokploy
								</p>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="px-3 py-1 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
							100% Open-Source
						</Badge>
						<Badge variant="secondary" className="px-3 py-1 text-xs font-mono">
							v0.29.5-reimagined
						</Badge>
					</div>
				</div>
			</div>

			{/* Navigation Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto p-1 gap-1 bg-muted/50 rounded-xl">
					<TabsTrigger value="overview" className="gap-1.5 py-2 text-xs">
						<Zap className="h-3.5 w-3.5" /> Overview
					</TabsTrigger>
					<TabsTrigger value="quickstart" className="gap-1.5 py-2 text-xs">
						<Rocket className="h-3.5 w-3.5" /> Quick Start
					</TabsTrigger>
					<TabsTrigger value="apps" className="gap-1.5 py-2 text-xs">
						<Globe className="h-3.5 w-3.5" /> Applications
					</TabsTrigger>
					<TabsTrigger value="gamepanel" className="gap-1.5 py-2 text-xs">
						<Gamepad2 className="h-3.5 w-3.5" /> Game Panel
					</TabsTrigger>
					<TabsTrigger value="traefik" className="gap-1.5 py-2 text-xs">
						<Server className="h-3.5 w-3.5" /> Traefik & SSL
					</TabsTrigger>
					<TabsTrigger value="databases" className="gap-1.5 py-2 text-xs">
						<Database className="h-3.5 w-3.5" /> Databases
					</TabsTrigger>
					<TabsTrigger value="security" className="gap-1.5 py-2 text-xs">
						<Shield className="h-3.5 w-3.5" /> Layer 7 Security
					</TabsTrigger>
					<TabsTrigger value="troubleshoot" className="gap-1.5 py-2 text-xs">
						<Terminal className="h-3.5 w-3.5" /> Maintenance
					</TabsTrigger>
				</TabsList>

				{/* Tab 1: Overview */}
				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card className="border-border/60">
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<Zap className="h-4 w-4 text-amber-500" /> Reimagined Architecture
								</CardTitle>
								<CardDescription>Built on Docker Swarm & Traefik v3</CardDescription>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground space-y-2">
								<p>
									RylixManager takes the beloved PaaS workflow of Dokploy and unlocks the entire enterprise suite, game server orchestration, and Linux kernel hardening without any paywalls.
								</p>
							</CardContent>
						</Card>

						<Card className="border-border/60">
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<Gamepad2 className="h-4 w-4 text-purple-500" /> Dedicated Gaming Suite
								</CardTitle>
								<CardDescription>Pterodactyl & AMP Alternative</CardDescription>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground space-y-2">
								<p>
									Host Minecraft, Rust, Palworld, CS2, and Valheim with interactive Web TTY, 1-click mod marketplace, automated backups, and 25MB UDP socket kernel tuning.
								</p>
							</CardContent>
						</Card>

						<Card className="border-border/60">
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<Shield className="h-4 w-4 text-emerald-500" /> Layer 7 Edge Defense
								</CardTitle>
								<CardDescription>Vercel-style telemetry & DDoS protection</CardDescription>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground space-y-2">
								<p>
									Inspect requests in real time, monitor latency percentiles (p75/p95), and enforce strict OWASP security headers and IP rate-limiting per domain.
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>What Makes RylixManager Different?</CardTitle>
							<CardDescription>A direct comparison of platform capabilities</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm text-left border-collapse">
									<thead>
										<tr className="border-b text-muted-foreground">
											<th className="py-2.5 font-medium">Capability</th>
											<th className="py-2.5 font-medium">Standard Dokploy</th>
											<th className="py-2.5 font-medium text-primary">RylixManager (Reimagined)</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border/40">
										<tr>
											<td className="py-2.5 font-medium">Game Server Control Deck</td>
											<td className="py-2.5 text-muted-foreground">None (Manual Compose only)</td>
											<td className="py-2.5 text-emerald-500 font-medium">✓ First-Class Dedicated Game Panel + Web TTY</td>
										</tr>
										<tr>
											<td className="py-2.5 font-medium">Linux OS Kernel Socket Tuning</td>
											<td className="py-2.5 text-muted-foreground">Manual host config</td>
											<td className="py-2.5 text-emerald-500 font-medium">✓ Automated 25MB Buffers + Google BBR</td>
										</tr>
										<tr>
											<td className="py-2.5 font-medium">Terminal Admin Setup on Install</td>
											<td className="py-2.5 text-muted-foreground">Browser onboarding only</td>
											<td className="py-2.5 text-emerald-500 font-medium">✓ Instant Terminal Admin Account Setup</td>
										</tr>
										<tr>
											<td className="py-2.5 font-medium">Enterprise Features (RBAC, SSO, Audit)</td>
											<td className="py-2.5 text-muted-foreground">License key required</td>
											<td className="py-2.5 text-emerald-500 font-medium">✓ 100% Unlocked & Open-Source</td>
										</tr>
										<tr>
											<td className="py-2.5 font-medium">Built-in Documentation Deck</td>
											<td className="py-2.5 text-muted-foreground">External website only</td>
											<td className="py-2.5 text-emerald-500 font-medium">✓ Integrated /dashboard/docs</td>
										</tr>
										<tr>
											<td className="py-2.5 font-medium">Automated Clean Uninstaller</td>
											<td className="py-2.5 text-muted-foreground">Manual docker cleanup</td>
											<td className="py-2.5 text-emerald-500 font-medium">✓ 1-Click Interactive uninstall.sh</td>
										</tr>
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 2: Quick Start */}
				<TabsContent value="quickstart" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Rocket className="h-5 w-5 text-primary" /> Automated One-Line Installation
							</CardTitle>
							<CardDescription>
								Run on any clean Linux VPS (Ubuntu 20.04/22.04/24.04, Debian 11/12, Rocky 9, AlmaLinux 9)
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								The installation script checks dependencies, sets up Docker Engine, configures Docker Swarm, prompts for your master admin credentials in the terminal, applies kernel tuning, and launches RylixManager in seconds:
							</p>
							<CodeBlock code="curl -sSL https://raw.githubusercontent.com/RishBroProMax/rylixmanager/main/install.sh | sh" />

							<div className="rounded-lg bg-muted/40 p-4 border text-sm space-y-2">
								<div className="font-semibold text-foreground">Interactive Terminal Prompt:</div>
								<p className="text-muted-foreground">
									During setup, the installer will ask for your <strong>Name</strong>, <strong>Email</strong>, and <strong>Password</strong>. These details immediately become your login credentials once the panel is live!
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Trash2 className="h-5 w-5 text-destructive" /> One-Line Uninstallation
							</CardTitle>
							<CardDescription>Safely and completely remove RylixManager and all related Swarm services</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								To clean up all services, networks, and secrets with interactive confirmation:
							</p>
							<CodeBlock code="curl -sSL https://raw.githubusercontent.com/RishBroProMax/rylixmanager/main/uninstall.sh | sh" />
							<p className="text-xs text-muted-foreground">
								Add <code className="text-primary font-mono">--purge-data</code> if you wish to permanently delete database volumes as well.
							</p>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 3: Applications */}
				<TabsContent value="apps" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Globe className="h-5 w-5 text-blue-500" /> Deploying Any Web Application
							</CardTitle>
							<CardDescription>Git Push, Dockerfile, Nixpacks, Railpacks & Docker Compose</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm text-muted-foreground">
							<p>
								RylixManager supports automated builds for virtually any technology stack without requiring complex CI/CD configuration:
							</p>
							<ul className="list-disc pl-5 space-y-2">
								<li>
									<strong className="text-foreground">Git Provider Integration</strong>: Connect GitHub, GitLab, Bitbucket, or any generic Git repository with automatic webhook triggers on push.
								</li>
								<li>
									<strong className="text-foreground">Nixpacks & Railpack Engine</strong>: Automatically detects Node.js, Python, Go, Rust, Ruby, PHP, Java, or Elixir code and creates optimized lightweight production containers.
								</li>
								<li>
									<strong className="text-foreground">Dockerfile Deployments</strong>: Bring your own custom multi-stage Dockerfile for complete runtime control.
								</li>
								<li>
									<strong className="text-foreground">Docker Compose Stacks</strong>: Deploy multi-tier applications directly from a single compose file.
								</li>
								<li>
									<strong className="text-foreground">Zero-Downtime Rolling Updates</strong>: Docker Swarm automatically tests health checks before switching traffic over to new container replicas.
								</li>
							</ul>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 4: Game Panel */}
				<TabsContent value="gamepanel" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Gamepad2 className="h-5 w-5 text-purple-500" /> Dedicated Game Server Control Panel
							</CardTitle>
							<CardDescription>Navigate to /dashboard/game-panel in the sidebar</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm text-muted-foreground">
							<p>
								RylixManager includes native gaming server management designed to replace resource-heavy external panels:
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
								<div className="p-3 rounded-lg border bg-card">
									<div className="font-semibold text-foreground">Minecraft (Java & Bedrock)</div>
									<div className="text-xs text-muted-foreground mt-1">Paper, Purpur, Fabric, Forge with 1-click Modrinth & Spigot integration.</div>
								</div>
								<div className="p-3 rounded-lg border bg-card">
									<div className="font-semibold text-foreground">Palworld</div>
									<div className="text-xs text-muted-foreground mt-1">Dedicated server with high-tickrate optimization and memory-leak auto-restarts.</div>
								</div>
								<div className="p-3 rounded-lg border bg-card">
									<div className="font-semibold text-foreground">Rust</div>
									<div className="text-xs text-muted-foreground mt-1">Oxide/uMod plugins, wipe scheduling, and automated RCON management.</div>
								</div>
								<div className="p-3 rounded-lg border bg-card">
									<div className="font-semibold text-foreground">Counter-Strike 2</div>
									<div className="text-xs text-muted-foreground mt-1">CS2 dedicated server with tickrate enforcement and Workshop map downloads.</div>
								</div>
								<div className="p-3 rounded-lg border bg-card">
									<div className="font-semibold text-foreground">Valheim & Terraria</div>
									<div className="text-xs text-muted-foreground mt-1">World backup snapshots, crossplay support, and BepInEx modding.</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 5: Traefik & SSL */}
				<TabsContent value="traefik" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Server className="h-5 w-5 text-cyan-500" /> Traefik v3 Reverse Proxy & Automatic SSL
							</CardTitle>
							<CardDescription>Automatic Let's Encrypt certificates with HTTP-01 & DNS-01 challenges</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm text-muted-foreground">
							<p>
								Traefik v3 dynamically detects running services on the <code className="text-primary font-mono">rylix-network</code> overlay network without requiring manual configuration reloads.
							</p>
							<div className="space-y-2">
								<div className="font-semibold text-foreground">To point a custom domain:</div>
								<ol className="list-decimal pl-5 space-y-1">
									<li>Create an <code className="text-foreground font-mono">A</code> record in your DNS provider (e.g. Cloudflare) pointing to your server's Public IP.</li>
									<li>In RylixManager, open your application or service and go to <strong>Domains</strong>.</li>
									<li>Enter your domain (e.g. <code className="text-foreground font-mono">app.yourdomain.com</code>) and enable <strong>HTTPS</strong>.</li>
									<li>RylixManager automatically requests and renews the SSL certificate via Let's Encrypt.</li>
								</ol>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 6: Databases */}
				<TabsContent value="databases" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Database className="h-5 w-5 text-emerald-500" /> One-Click Managed Databases
							</CardTitle>
							<CardDescription>PostgreSQL, MySQL, MariaDB, MongoDB & Redis</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm text-muted-foreground">
							<p>
								Deploy enterprise-ready database instances with persistent volume storage, internal DNS resolution, and automated S3 backups:
							</p>
							<ul className="list-disc pl-5 space-y-2">
								<li><strong className="text-foreground">Internal Network Access</strong>: Connect services inside the cluster without exposing database ports to the public internet.</li>
								<li><strong className="text-foreground">External Access</strong>: Publish secure ports with password protection for external database GUI tools (DBeaver, TablePlus).</li>
								<li><strong className="text-foreground">Automated Backups</strong>: Configure cron schedules to stream database dumps to AWS S3, Cloudflare R2, or MinIO.</li>
							</ul>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 7: Security */}
				<TabsContent value="security" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5 text-rose-500" /> Layer 7 Edge Security & Host Hardening
							</CardTitle>
							<CardDescription>OWASP Strict Headers, DDoS Rate Limiting & Linux Kernel Tuning</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm text-muted-foreground">
							<p>
								RylixManager applies security at both the network edge and the Linux kernel level:
							</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="rounded-lg border p-4 bg-muted/20 space-y-2">
									<div className="font-semibold text-foreground flex items-center gap-2">
										<Lock className="h-4 w-4 text-primary" /> OWASP Edge Middleware
									</div>
									<ul className="list-disc pl-5 text-xs space-y-1">
										<li>Strict-Transport-Security (HSTS) with preload</li>
										<li>X-Frame-Options: DENY to prevent clickjacking</li>
										<li>X-Content-Type-Options: nosniff</li>
										<li>Content-Security-Policy baseline enforcement</li>
									</ul>
								</div>

								<div className="rounded-lg border p-4 bg-muted/20 space-y-2">
									<div className="font-semibold text-foreground flex items-center gap-2">
										<Zap className="h-4 w-4 text-amber-500" /> Kernel Performance Tuning
									</div>
									<ul className="list-disc pl-5 text-xs space-y-1">
										<li>25MB High-throughput UDP & TCP socket buffers</li>
										<li>Google BBR congestion control algorithm</li>
										<li>somaxconn set to 65,535 for high concurrency</li>
										<li>Automatic Docker daemon log rotation safeguards</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 8: Maintenance & Troubleshooting */}
				<TabsContent value="troubleshoot" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Terminal className="h-5 w-5 text-primary" /> VPS Terminal & Service Diagnostics
							</CardTitle>
							<CardDescription>Useful commands to inspect and manage your RylixManager instance</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<div className="text-sm font-semibold text-foreground">Check Panel Service Status:</div>
								<CodeBlock code="docker service ps rylix-manager --no-trunc" />
							</div>

							<div className="space-y-2">
								<div className="text-sm font-semibold text-foreground">View Real-time Application Logs:</div>
								<CodeBlock code="docker service logs -f rylix-manager" />
							</div>

							<div className="space-y-2">
								<div className="text-sm font-semibold text-foreground">Restart RylixManager Service:</div>
								<CodeBlock code="docker service update --force rylix-manager" />
							</div>

							<div className="space-y-2">
								<div className="text-sm font-semibold text-foreground">Reset Admin Password via Terminal:</div>
								<CodeBlock code="docker exec -it $(docker ps -q -f name=rylix-manager) node dist/reset-password.mjs" />
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default DocsPage;

DocsPage.getLayout = (page: ReactElement) => {
	return (
		<DashboardLayout metaName="Documentation">
			{page}
		</DashboardLayout>
	);
};

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const { user } = await validateRequest(ctx.req);
	if (!user) {
		return {
			redirect: {
				permanent: false,
				destination: "/",
			},
		};
	}

	return {
		props: {},
	};
}
