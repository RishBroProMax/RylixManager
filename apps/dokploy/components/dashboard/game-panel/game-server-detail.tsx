import {
	ArrowLeft,
	Cpu,
	Folder,
	Gamepad2,
	HardDrive,
	Network,
	Puzzle,
	Radio,
	RefreshCw,
	Server,
	Settings,
	Shield,
	Sparkles,
	Terminal,
	Zap,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { ShowComposeFiles } from "@/components/dashboard/compose/files/show-compose-files";
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
import { api } from "@/utils/api";
import { GameConsoleView } from "./game-console-view";
import { GameMotdView } from "./game-motd-view";
import { GamePluginsView } from "./game-plugins-view";
import { GameProxyView } from "./game-proxy-view";

interface Props {
	service: {
		id: string;
		name: string;
		appName: string;
		type: string;
		status: string;
		projectId: string;
		projectName: string;
		environmentId: string;
		serverId?: string;
		serverName?: string;
	};
	onBack: () => void;
}

export const GameServerDetail: React.FC<Props> = ({ service, onBack }) => {
	const [activeTab, setActiveTab] = useState<string>("console");

	// Fetch compose details
	const { data: composeData, refetch: refetchCompose } =
		api.compose.one.useQuery(
			{ composeId: service.id },
			{ enabled: !!service.id },
		);

	// Fetch server IP if remote
	const { data: servers } = api.server.withSSHKey.useQuery();
	const server = servers?.find((s) => s.serverId === service.serverId);
	const serverIp = server?.ipAddress || "127.0.0.1";

	// Fetch container ID
	const { data: containers, refetch: refetchContainers } =
		api.docker.getContainersByAppNameMatch.useQuery(
			{
				appName: service.appName,
				appType: "docker-compose",
				serverId: service.serverId,
			},
			{ enabled: !!service.appName },
		);

	const primaryContainer = containers?.[0];
	const containerId = primaryContainer?.containerId || "";

	const detectedGameType = useMemo(() => {
		const name = `${service.name} ${service.appName}`.toLowerCase();
		if (name.includes("rust")) return "rust";
		if (name.includes("palworld")) return "palworld";
		if (name.includes("cs2") || name.includes("counter")) return "cs2";
		if (name.includes("valheim")) return "valheim";
		return "minecraft";
	}, [service.name, service.appName]);

	// Detect ports
	const ports = [
		{
			port: 25565,
			protocol: "TCP",
			description: "Primary Game Port (Direct Connect / SRV)",
		},
		{
			port: 25575,
			protocol: "TCP",
			description: "RCON Remote Console Port",
		},
	];

	return (
		<div className="space-y-6">
			{/* Top Header Navigation */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="icon"
						onClick={onBack}
						className="h-8 w-8 rounded-lg"
					>
						<ArrowLeft className="size-4" />
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-xl font-bold tracking-tight">
								{service.name}
							</h2>
							<Badge
								variant={
									service.status === "done" || service.status === "running"
										? "default"
										: "secondary"
								}
								className="text-[10px] uppercase font-mono"
							>
								{service.status === "done" ? "Online" : service.status}
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground font-mono">
							Project: {service.projectName} • {serverIp}:25565
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs gap-1.5"
						onClick={() => {
							refetchCompose();
							refetchContainers();
						}}
					>
						<RefreshCw className="size-3.5" />
						Sync Status
					</Button>
					<Link
						href={`/dashboard/project/${service.projectId}/environment/${service.environmentId}/services/compose/${service.id}`}
					>
						<Button variant="secondary" size="sm" className="h-8 text-xs gap-1.5">
							<Settings className="size-3.5" />
							Service Advanced
						</Button>
					</Link>
				</div>
			</div>

			{/* Main Game Panel Navigation Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full sm:w-[760px]">
					<TabsTrigger value="console" className="gap-1.5 text-xs">
						<Terminal className="size-3.5" />
						Console
					</TabsTrigger>
					<TabsTrigger value="files" className="gap-1.5 text-xs">
						<Folder className="size-3.5" />
						Files
					</TabsTrigger>
					<TabsTrigger value="plugins" className="gap-1.5 text-xs">
						<Puzzle className="size-3.5" />
						Mods & Plugins
					</TabsTrigger>
					<TabsTrigger value="motd" className="gap-1.5 text-xs">
						<Sparkles className="size-3.5" />
						MOTD & Config
					</TabsTrigger>
					<TabsTrigger value="proxy" className="gap-1.5 text-xs">
						<Network className="size-3.5" />
						Proxy Hub
					</TabsTrigger>
					<TabsTrigger value="settings" className="gap-1.5 text-xs">
						<Settings className="size-3.5" />
						Host Ports
					</TabsTrigger>
				</TabsList>

				{/* 1. Live Game Console */}
				<TabsContent value="console" className="pt-4">
					{containerId ? (
						<GameConsoleView
							containerId={containerId}
							appName={service.appName}
							serverId={service.serverId}
							serviceId={service.id}
							status={service.status}
							gameType={detectedGameType}
							onPowerAction={() => {
								refetchCompose();
								refetchContainers();
							}}
						/>
					) : (
						<Card className="bg-background border-border">
							<CardContent className="py-16 text-center space-y-3">
								<Terminal className="size-10 mx-auto text-muted-foreground stroke-1" />
								<h3 className="text-base font-semibold">
									No Active Container Connected
								</h3>
								<p className="text-xs text-muted-foreground max-w-sm mx-auto">
									The game server is currently offline or stopped. Start the service to connect to the live console stream.
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* 2. File Manager (Directly inside Game Panel) */}
				<TabsContent value="files" className="pt-4">
					<ShowComposeFiles
						serverId={service.serverId}
						appName={service.appName}
						appType="docker-compose"
						serviceId={service.id}
					/>
				</TabsContent>

				{/* 3. Mods & Plugins Marketplace */}
				<TabsContent value="plugins" className="pt-4">
					{containerId ? (
						<GamePluginsView
							containerId={containerId}
							serverId={service.serverId}
							gameType={detectedGameType}
						/>
					) : (
						<Card className="bg-background border-border">
							<CardContent className="py-12 text-center text-xs text-muted-foreground">
								Server must be running to install or manage plugins.
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* 4. Visual MOTD & Properties */}
				<TabsContent value="motd" className="pt-4">
					{containerId ? (
						<GameMotdView
							containerId={containerId}
							appName={service.appName}
							serverId={service.serverId}
							serverIp={serverIp}
						/>
					) : (
						<Card className="bg-background border-border">
							<CardContent className="py-12 text-center text-xs text-muted-foreground">
								Server must be deployed to manage MOTD and properties.
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* 5. Game Proxy & Network */}
				<TabsContent value="proxy" className="pt-4">
					<GameProxyView
						serverIp={serverIp}
						gameName={service.name}
						gameId="minecraft"
						ports={ports}
						containerName={service.appName}
					/>
				</TabsContent>

				{/* 4. Configuration & Ports */}
				<TabsContent value="settings" className="pt-4 space-y-4">
					<Card className="bg-background border-border">
						<CardHeader className="p-5 pb-3">
							<CardTitle className="text-base font-semibold">
								Game Host Port Bindings
							</CardTitle>
							<CardDescription className="text-xs">
								Host-level ports mapped directly through Docker engine for real-time game traffic.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-5 pt-0 space-y-4">
							<div className="divide-y divide-border/60">
								<div className="py-3 flex items-center justify-between text-xs">
									<div>
										<span className="font-semibold text-foreground">
											Direct Game Client Port
										</span>
										<p className="text-muted-foreground text-[11px]">
											Port clients and consoles connect to.
										</p>
									</div>
									<Badge variant="outline" className="font-mono text-xs">
										25565 : 25565 / TCP
									</Badge>
								</div>
								<div className="py-3 flex items-center justify-between text-xs">
									<div>
										<span className="font-semibold text-foreground">
											Remote Console (RCON)
										</span>
										<p className="text-muted-foreground text-[11px]">
											Encrypted administrative socket.
										</p>
									</div>
									<Badge variant="outline" className="font-mono text-xs">
										25575 : 25575 / TCP
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};
