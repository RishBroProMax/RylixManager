import {
	AlertTriangle,
	ArrowRight,
	Check,
	Cloud,
	Copy,
	ExternalLink,
	Globe,
	Info,
	Network,
	Radio,
	Server,
	Shield,
	Terminal,
	Zap,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
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

interface Props {
	serverIp: string;
	gameName: string;
	gameId: string;
	ports: Array<{ port: number; protocol: string; description: string }>;
	containerName?: string;
}

export const GameProxyView: React.FC<Props> = ({
	serverIp,
	gameName,
	gameId,
	ports,
	containerName,
}) => {
	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	const primaryPort = ports[0]?.port || 25565;
	const primaryProtocol = ports[0]?.protocol || "TCP";
	const directConnect = `${serverIp || "127.0.0.1"}:${primaryPort}`;

	const copyToClipboard = (text: string, key: string) => {
		navigator.clipboard.writeText(text);
		setCopiedKey(key);
		toast.success("Copied to clipboard");
		setTimeout(() => setCopiedKey(null), 2000);
	};

	const srvRecordExample = `_minecraft._tcp.play.yourdomain.com. 3600 IN SRV 0 5 ${primaryPort} mc.yourdomain.com.`;

	const velocitySnippet = `[servers]
${(containerName || gameId).toLowerCase()} = "${serverIp || "127.0.0.1"}:${primaryPort}"

# Forwarding secret mode
forwarding-secret = "YOUR_SECURE_VELOCITY_SECRET"
`;

	const playitSnippet = `version: "3.8"
services:
  playit:
    image: playitground/playit:latest
    container_name: rylix-game-tunnel
    restart: unless-stopped
    network_mode: host
    environment:
      - PLAYIT_SECRET_KEY=your_claim_token_here
`;

	return (
		<div className="space-y-6">
			{/* Quick Direct Connect Card */}
			<Card className="bg-background border-border">
				<CardHeader className="p-5 pb-3">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<Radio className="size-4 text-emerald-500 animate-pulse" />
								<CardTitle className="text-base font-semibold">
									Direct Game Connection
								</CardTitle>
								<Badge variant="outline" className="text-[10px] font-mono">
									{primaryProtocol} Passthrough
								</Badge>
							</div>
							<CardDescription className="text-xs">
								Players and game clients connect directly to this endpoint.
							</CardDescription>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => copyToClipboard(directConnect, "direct")}
							className="gap-2 text-xs font-mono"
						>
							{copiedKey === "direct" ? (
								<Check className="size-3.5 text-emerald-500" />
							) : (
								<Copy className="size-3.5" />
							)}
							{directConnect}
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-5 pt-0">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border/60">
						{ports.map((p, idx) => (
							<div
								key={idx}
								className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-1"
							>
								<div className="flex items-center justify-between text-xs font-medium">
									<span className="font-mono text-foreground">
										Port {p.port}
									</span>
									<Badge
										variant="secondary"
										className="text-[10px] px-1.5 py-0 uppercase"
									>
										{p.protocol}
									</Badge>
								</div>
								<p className="text-[11px] text-muted-foreground truncate">
									{p.description}
								</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Game Proxy & Routing Hub Tabs */}
			<Card className="bg-background border-border">
				<CardHeader className="p-5 pb-3 border-b border-border">
					<div className="flex items-center gap-2">
						<Network className="size-4 text-primary" />
						<CardTitle className="text-base font-semibold">
							Game Proxy & Network Gateway
						</CardTitle>
					</div>
					<CardDescription className="text-xs">
						Configure DNS domain routing, anti-DDoS game proxies, and tunnel passthrough for zero port forwarding.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-5">
					<Tabs defaultValue="domain-srv" className="w-full">
						<TabsList className="grid grid-cols-3 w-full sm:w-[480px]">
							<TabsTrigger value="domain-srv" className="text-xs">
								DNS SRV Record
							</TabsTrigger>
							<TabsTrigger value="velocity-proxy" className="text-xs">
								Velocity / Bungee
							</TabsTrigger>
							<TabsTrigger value="tunnel-proxy" className="text-xs">
								Playit.gg Tunnel
							</TabsTrigger>
						</TabsList>

						{/* DNS SRV Records */}
						<TabsContent value="domain-srv" className="space-y-4 pt-4">
							<div className="space-y-2">
								<h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
									<Globe className="size-3.5 text-primary" />
									Custom Domain Setup (Without typing the port)
								</h4>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Configure an SRV record in Cloudflare, Namecheap, or your DNS provider so players can connect using <code className="font-mono text-foreground">play.yourdomain.com</code> without entering <code className="font-mono text-foreground">:{primaryPort}</code>.
								</p>
							</div>

							<div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2.5">
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
									<div>
										<span className="text-muted-foreground block text-[10px] uppercase">
											Service
										</span>
										<span className="font-medium">_minecraft</span>
									</div>
									<div>
										<span className="text-muted-foreground block text-[10px] uppercase">
											Protocol
										</span>
										<span className="font-medium">_tcp</span>
									</div>
									<div>
										<span className="text-muted-foreground block text-[10px] uppercase">
											Port
										</span>
										<span className="font-medium text-emerald-500">
											{primaryPort}
										</span>
									</div>
									<div>
										<span className="text-muted-foreground block text-[10px] uppercase">
											Target Host
										</span>
										<span className="font-medium">{serverIp || "your-vps-ip"}</span>
									</div>
								</div>

								<div className="flex items-center justify-between pt-2 border-t border-border/40">
									<code className="text-[11px] font-mono text-muted-foreground truncate">
										{srvRecordExample}
									</code>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-xs gap-1"
										onClick={() => copyToClipboard(srvRecordExample, "srv")}
									>
										{copiedKey === "srv" ? (
											<Check className="size-3 text-emerald-500" />
										) : (
											<Copy className="size-3" />
										)}
										Copy
									</Button>
								</div>
							</div>
						</TabsContent>

						{/* Velocity / Bungee Proxy */}
						<TabsContent value="velocity-proxy" className="space-y-4 pt-4">
							<div className="space-y-2">
								<h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
									<Shield className="size-3.5 text-primary" />
									BungeeCord / Velocity Proxy Integration
								</h4>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Connect this backend game server to a Velocity or BungeeCord proxy network with modern modern-forwarding secret support.
								</p>
							</div>

							<div className="rounded-lg border border-border bg-black/40 p-3.5 space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-[11px] font-mono text-muted-foreground">
										velocity.toml server configuration
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-xs gap-1"
										onClick={() => copyToClipboard(velocitySnippet, "velocity")}
									>
										{copiedKey === "velocity" ? (
											<Check className="size-3 text-emerald-500" />
										) : (
											<Copy className="size-3" />
										)}
										Copy Snippet
									</Button>
								</div>
								<pre className="text-xs font-mono text-emerald-400 p-2 overflow-x-auto whitespace-pre">
									{velocitySnippet}
								</pre>
							</div>
						</TabsContent>

						{/* Playit Tunnel */}
						<TabsContent value="tunnel-proxy" className="space-y-4 pt-4">
							<div className="space-y-2">
								<h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
									<Zap className="size-3.5 text-primary" />
									Playit.gg Zero-Port-Forward Tunnel
								</h4>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Running RylixManager on a home server, behind a strict NAT or CGNAT? Deploy Playit.gg as a sidecar container to route game traffic with zero firewall ports opened!
								</p>
							</div>

							<div className="rounded-lg border border-border bg-black/40 p-3.5 space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-[11px] font-mono text-muted-foreground">
										docker-compose.yml tunnel sidecar
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-xs gap-1"
										onClick={() => copyToClipboard(playitSnippet, "playit")}
									>
										{copiedKey === "playit" ? (
											<Check className="size-3 text-emerald-500" />
										) : (
											<Copy className="size-3" />
										)}
										Copy Snippet
									</Button>
								</div>
								<pre className="text-xs font-mono text-muted-foreground p-2 overflow-x-auto whitespace-pre">
									{playitSnippet}
								</pre>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};
