import {
	Activity,
	Check,
	Copy,
	ExternalLink,
	Gamepad2,
	HelpCircle,
	Info,
	Layers,
	Loader2,
	Search,
	Server,
	ShieldCheck,
	SlidersHorizontal,
	Sparkles,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";

interface Props {
	environmentId?: string;
	projectName?: string;
	customTrigger?: React.ReactNode;
}

interface GameInfo {
	id: string;
	name: string;
	genre: "survival" | "shooter" | "sandbox" | "strategy";
	category: string;
	description: string;
	ports: string;
	protocol: "TCP" | "UDP" | "TCP/UDP";
	recommendedRam: string;
	defaultType?: string;
	firewallCmd: string;
	highlight?: string;
}

const GAME_SERVERS: GameInfo[] = [
	{
		id: "minecraft",
		name: "Minecraft (Java Edition)",
		genre: "sandbox",
		category: "Sandbox / Survival",
		description:
			"The classic Minecraft Java Edition server powered by itzg/minecraft-server. Supports PaperMC, Spigot, Fabric, Forge & Vanilla.",
		ports: "25565 TCP, 25575 RCON",
		protocol: "TCP",
		recommendedRam: "4GB - 8GB",
		defaultType: "PAPER",
		firewallCmd: "ufw allow 25565/tcp",
		highlight: "Most Popular",
	},
	{
		id: "minecraft-bedrock",
		name: "Minecraft (Bedrock Edition)",
		genre: "sandbox",
		category: "Crossplay Sandbox",
		description:
			"Official Bedrock dedicated server for iOS, Android, Windows, Xbox, PlayStation, and Switch players with crossplay.",
		ports: "19132 UDP (IPv4), 19133 UDP (IPv6)",
		protocol: "UDP",
		recommendedRam: "2GB - 4GB",
		firewallCmd: "ufw allow 19132/udp",
		highlight: "Cross-Play",
	},
	{
		id: "rust",
		name: "Rust Dedicated Server",
		genre: "survival",
		category: "PVP Survival",
		description:
			"High-performance Rust server with SteamCMD auto-updates, RCON management, and uMod / Oxide modding capabilities.",
		ports: "28015 UDP (Game), 28016 TCP (RCON)",
		protocol: "TCP/UDP",
		recommendedRam: "8GB - 16GB",
		firewallCmd: "ufw allow 28015/udp && ufw allow 28016/tcp",
		highlight: "SteamCMD",
	},
	{
		id: "palworld",
		name: "Palworld Dedicated Server",
		genre: "survival",
		category: "Multiplayer Survival",
		description:
			"Multiplayer dedicated server for Palworld with automated world backup routines, multi-threaded CPU tuning, and RCON.",
		ports: "8211 UDP (Game), 27015 UDP (Query)",
		protocol: "UDP",
		recommendedRam: "8GB - 16GB",
		firewallCmd: "ufw allow 8211/udp",
		highlight: "Multi-threaded",
	},
	{
		id: "valheim",
		name: "Valheim Dedicated Server",
		genre: "survival",
		category: "Viking Co-op Survival",
		description:
			"Viking survival server with automated world backups, crossplay enabled (PC + Xbox), and Discord webhook status notifications.",
		ports: "2456-2457 UDP",
		protocol: "UDP",
		recommendedRam: "4GB - 8GB",
		firewallCmd: "ufw allow 2456:2457/udp",
		highlight: "Auto-Backup",
	},
	{
		id: "terraria",
		name: "Terraria Dedicated Server (TShock)",
		genre: "sandbox",
		category: "2D Sandbox RPG",
		description:
			"Lightweight, lightning fast Terraria server running TShock for permissions, anti-griefing, and plugin management.",
		ports: "7777 TCP",
		protocol: "TCP",
		recommendedRam: "2GB - 4GB",
		firewallCmd: "ufw allow 7777/tcp",
		highlight: "TShock Plugins",
	},
	{
		id: "cs2",
		name: "Counter-Strike 2 (CS2)",
		genre: "shooter",
		category: "Tactical FPS",
		description:
			"Dedicated competitive CS2 server running Valve Source 2 engine with custom map workshop and tickrate controls.",
		ports: "27015 TCP/UDP",
		protocol: "TCP/UDP",
		recommendedRam: "6GB - 12GB",
		firewallCmd: "ufw allow 27015/tcp && ufw allow 27015/udp",
		highlight: "Valve Source 2",
	},
	{
		id: "ark",
		name: "ARK: Survival Evolved",
		genre: "survival",
		category: "Dinosaur Survival",
		description:
			"Complete ARK server with RCON console management, custom map selection (TheIsland, Ragnarok), and SteamCMD auto-sync.",
		ports: "7777 UDP, 7778 UDP, 27015 UDP",
		protocol: "UDP",
		recommendedRam: "8GB - 16GB",
		firewallCmd: "ufw allow 7777:7778/udp && ufw allow 27015/udp",
		highlight: "SteamCMD",
	},
	{
		id: "factorio",
		name: "Factorio Headless Server",
		genre: "strategy",
		category: "Automation / Co-op",
		description:
			"Headless Factorio server with automatic save retention, mod auto-update on launch, and remote console access.",
		ports: "34197 UDP, 27015 TCP",
		protocol: "UDP",
		recommendedRam: "2GB - 4GB",
		firewallCmd: "ufw allow 34197/udp",
		highlight: "Mod Support",
	},
	{
		id: "satisfactory",
		name: "Satisfactory Dedicated Server",
		genre: "strategy",
		category: "Factory Building",
		description:
			"Official Satisfactory dedicated server with automatic save rotation, auto-pause when players disconnect, and SteamCMD updates.",
		ports: "7777 UDP",
		protocol: "UDP",
		recommendedRam: "8GB - 16GB",
		firewallCmd: "ufw allow 7777/udp",
		highlight: "Auto-Pause",
	},
	{
		id: "zomboid",
		name: "Project Zomboid Server",
		genre: "survival",
		category: "Zombie Survival",
		description:
			"Multiplayer zombie survival server with sandbox modifiers, SteamCMD sync, and persistent player inventory volumes.",
		ports: "16261 UDP, 16262 UDP",
		protocol: "UDP",
		recommendedRam: "4GB - 8GB",
		firewallCmd: "ufw allow 16261:16262/udp",
		highlight: "Persistent World",
	},
	{
		id: "enshrouded",
		name: "Enshrouded Dedicated Server",
		genre: "survival",
		category: "Action RPG Survival",
		description:
			"Dedicated server for the voxel-based action RPG Enshrouded, supporting up to 16 co-op players with persistent cloud saves.",
		ports: "15636 UDP, 15637 UDP",
		protocol: "UDP",
		recommendedRam: "8GB - 16GB",
		firewallCmd: "ufw allow 15636:15637/udp",
		highlight: "16 Co-op",
	},
];

export const AddGameServer = ({
	environmentId,
	projectName,
	customTrigger,
}: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTab, setSelectedTab] = useState<string>("all");
	const [selectedGameId, setSelectedGameId] = useState<string>("minecraft");
	const [serverId, setServerId] = useState<string | undefined>(undefined);
	const [customServerName, setCustomServerName] = useState("");
	const [selectedRam, setSelectedRam] = useState("4G");
	const [copied, setCopied] = useState(false);

	const { data: allProjects } = api.project.all.useQuery();
	const activeEnvironmentId =
		environmentId || allProjects?.[0]?.environments?.[0]?.environmentId || "";

	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: servers } = api.server.withSSHKey.useQuery();
	const utils = api.useUtils();

	const { mutateAsync: deployTemplate, isPending } =
		api.compose.deployTemplate.useMutation();

	const filteredGames = useMemo(() => {
		return GAME_SERVERS.filter((game) => {
			const matchesSearch =
				game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				game.category.toLowerCase().includes(searchQuery.toLowerCase());

			if (!matchesSearch) return false;
			if (selectedTab === "all") return true;
			if (selectedTab === "survival") return game.genre === "survival";
			if (selectedTab === "sandbox") return game.genre === "sandbox";
			if (selectedTab === "other")
				return game.genre === "shooter" || game.genre === "strategy";
			return true;
		});
	}, [searchQuery, selectedTab]);

	const selectedGame = useMemo(() => {
		return (
			GAME_SERVERS.find((g) => g.id === selectedGameId) || GAME_SERVERS[0]
		);
	}, [selectedGameId]);

	const handleCopyFirewall = () => {
		if (!selectedGame?.firewallCmd) return;
		navigator.clipboard.writeText(selectedGame.firewallCmd);
		setCopied(true);
		toast.success("Firewall command copied to clipboard");
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDeploy = async () => {
		if (!selectedGame) return;
		if (!activeEnvironmentId) {
			toast.error("Please create a project first before launching a game server");
			return;
		}

		const displayName = customServerName.trim() || selectedGame.name;
		const promise = deployTemplate({
			serverId: serverId === "dokploy" ? undefined : serverId,
			environmentId: activeEnvironmentId,
			id: selectedGame.id,
			name: displayName,
			customVariables: {
				MEMORY: selectedRam,
				SERVER_NAME: displayName,
				MOTD: `Hosted on RylixManager - ${displayName}`,
			},
			autoDeploy: true,
		});

		toast.promise(promise, {
			loading: `Provisioning & starting ${displayName}...`,
			success: () => {
				utils.environment.one.invalidate({ environmentId: activeEnvironmentId });
				utils.project.all.invalidate();
				utils.overview.services.invalidate();
				setIsOpen(false);
				return `${displayName} deployed & starting up! Ports mapped. Check the Files tab to edit server properties.`;
			},
			error: (err) => {
				return err?.message || `Failed to deploy ${selectedGame.name}`;
			},
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{customTrigger ? (
					customTrigger
				) : (
					<DropdownMenuItem
						className="w-full cursor-pointer space-x-2.5 font-medium"
						onSelect={(e) => {
							e.preventDefault();
							setIsOpen(true);
						}}
					>
						<Gamepad2 className="size-4 text-primary" />
						<div className="flex items-center justify-between w-full">
							<span>Game Server</span>
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0 uppercase tracking-wider text-muted-foreground border-border"
							>
								New
							</Badge>
						</div>
					</DropdownMenuItem>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border">
				<DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-lg border border-border bg-background shadow-xs">
								<Gamepad2 className="size-5 text-foreground" />
							</div>
							<div>
								<DialogTitle className="text-xl font-semibold tracking-tight">
									Deploy Game Server
								</DialogTitle>
								<DialogDescription className="text-xs text-muted-foreground mt-0.5">
									One-click high-performance game hosting for Minecraft, Rust, Palworld, Valheim, and more.
								</DialogDescription>
							</div>
						</div>
						<Badge
							variant="secondary"
							className="hidden sm:flex items-center gap-1.5 py-1 px-2.5 text-xs font-mono"
						>
							<ShieldCheck className="size-3.5 text-foreground" />
							Host Port Passthrough
						</Badge>
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
					{/* Left: Game Catalog */}
					<div className="md:col-span-7 flex flex-col border-r border-border/60 min-h-0">
						<div className="p-4 border-b border-border/60 space-y-3 bg-muted/5">
							<div className="relative">
								<Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search game servers (e.g. Minecraft, Rust, CS2)..."
									className="pl-9 h-9 text-xs bg-background"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>

							<Tabs
								value={selectedTab}
								onValueChange={setSelectedTab}
								className="w-full"
							>
								<TabsList className="grid grid-cols-4 h-8 p-0.5 bg-muted">
									<TabsTrigger value="all" className="text-xs py-1">
										All ({GAME_SERVERS.length})
									</TabsTrigger>
									<TabsTrigger value="survival" className="text-xs py-1">
										Survival
									</TabsTrigger>
									<TabsTrigger value="sandbox" className="text-xs py-1">
										Sandbox
									</TabsTrigger>
									<TabsTrigger value="other" className="text-xs py-1">
										FPS / Factory
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						<ScrollArea className="flex-1 p-4">
							<div className="grid grid-cols-1 gap-2.5">
								{filteredGames.map((game) => {
									const isSelected = game.id === selectedGameId;
									return (
										<div
											key={game.id}
											onClick={() => setSelectedGameId(game.id)}
											className={cn(
												"p-3.5 rounded-lg border text-left cursor-pointer transition-all duration-150 flex flex-col gap-2",
												isSelected
													? "border-foreground bg-foreground/5 shadow-xs"
													: "border-border/70 hover:border-border hover:bg-muted/30",
											)}
										>
											<div className="flex items-start justify-between gap-2">
												<div className="flex items-center gap-2.5">
													<div
														className={cn(
															"size-2 rounded-full",
															isSelected
																? "bg-foreground"
																: "bg-muted-foreground/30",
														)}
													/>
													<span className="font-semibold text-sm">
														{game.name}
													</span>
												</div>
												<div className="flex items-center gap-1.5">
													{game.highlight && (
														<Badge
															variant="secondary"
															className="text-[10px] py-0 px-1.5 font-normal"
														>
															{game.highlight}
														</Badge>
													)}
													<Badge
														variant="outline"
														className="text-[10px] py-0 px-1.5 font-mono"
													>
														{game.protocol}
													</Badge>
												</div>
											</div>

											<p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
												{game.description}
											</p>

											<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
												<span>Port: {game.ports.split(",")[0]}</span>
												<span>RAM: {game.recommendedRam}</span>
											</div>
										</div>
									);
								})}

								{filteredGames.length === 0 && (
									<div className="text-center py-12 text-muted-foreground">
										<p className="text-sm">No game servers match your query.</p>
									</div>
								)}
							</div>
						</ScrollArea>
					</div>

					{/* Right: Launch Configuration & Details */}
					<div className="md:col-span-5 flex flex-col p-5 bg-muted/5 justify-between min-h-0 overflow-y-auto">
						{selectedGame && (
							<div className="space-y-4">
								<div>
									<span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
										Selected Server Blueprint
									</span>
									<h3 className="text-lg font-bold tracking-tight mt-0.5">
										{selectedGame.name}
									</h3>
									<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
										{selectedGame.description}
									</p>
								</div>

								<div className="rounded-lg border border-border bg-background p-3.5 space-y-2.5 shadow-xs">
									<div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
										<span className="text-muted-foreground">Category</span>
										<span className="font-medium">{selectedGame.category}</span>
									</div>
									<div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
										<span className="text-muted-foreground">Target Port</span>
										<span className="font-mono font-medium">
											{selectedGame.ports}
										</span>
									</div>
									<div className="flex items-center justify-between text-xs">
										<span className="text-muted-foreground">Recommended Memory</span>
										<Badge variant="secondary" className="font-mono text-[11px]">
											{selectedGame.recommendedRam}
										</Badge>
									</div>
								</div>

								{/* Server Name Customization */}
								<div className="space-y-1.5">
									<Label className="text-xs font-medium">
										Instance Name
									</Label>
									<Input
										placeholder={selectedGame?.name || "Server Name"}
										value={customServerName}
										onChange={(e) => setCustomServerName(e.target.value)}
										className="h-9 text-xs"
									/>
								</div>

								{/* Server Selection */}
								<div className="space-y-1.5">
									<Label className="text-xs font-medium flex items-center justify-between">
										<span>Deploy Target</span>
										<span className="text-[10px] text-muted-foreground">
											{!isCloud ? "Local or Remote VPS" : "Remote Server"}
										</span>
									</Label>
									<Select
										value={serverId || "dokploy"}
										onValueChange={setServerId}
									>
										<SelectTrigger className="h-9 text-xs">
											<SelectValue placeholder="Select target VPS" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{!isCloud && (
													<SelectItem value="dokploy">
														<span className="flex items-center gap-2">
															<Server className="size-3.5" />
															<span>Rylix Server (Local Host)</span>
														</span>
													</SelectItem>
												)}
												{servers?.map((s) => (
													<SelectItem key={s.serverId} value={s.serverId}>
														<span className="flex items-center gap-2">
															<Server className="size-3.5" />
															<span>{s.name}</span>
															<span className="text-muted-foreground font-mono text-[10px]">
																({s.ipAddress})
															</span>
														</span>
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>

								{/* Memory Allocation */}
								<div className="space-y-1.5">
									<Label className="text-xs font-medium">
										Allocated RAM
									</Label>
									<Select value={selectedRam} onValueChange={setSelectedRam}>
										<SelectTrigger className="h-9 text-xs">
											<SelectValue placeholder="Select memory" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="2G">2 GB RAM (Lightweight)</SelectItem>
											<SelectItem value="4G">4 GB RAM (Standard)</SelectItem>
											<SelectItem value="8G">8 GB RAM (Performance)</SelectItem>
											<SelectItem value="16G">16 GB RAM (High-Tick / Modded)</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Firewall Helper */}
								<div className="rounded-lg border border-border/70 bg-background/50 p-3 space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
											<Info className="size-3 text-muted-foreground" />
											Firewall Quick-Rule (UFW)
										</span>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={handleCopyFirewall}
										>
											{copied ? (
												<Check className="size-3 text-foreground" />
											) : (
												<Copy className="size-3 text-muted-foreground" />
											)}
										</Button>
									</div>
									<code className="block text-[11px] font-mono bg-muted px-2 py-1.5 rounded text-foreground overflow-x-auto whitespace-nowrap">
										{selectedGame.firewallCmd}
									</code>
									<p className="text-[10px] text-muted-foreground">
										Run this on your VPS terminal if incoming player traffic is blocked.
									</p>
								</div>
							</div>
						)}

						<div className="pt-4 border-t border-border/60 mt-4">
							<Button
								className="w-full h-10 text-xs font-semibold gap-2"
								disabled={isPending}
								onClick={handleDeploy}
							>
								{isPending ? (
									<>
										<Loader2 className="size-4 animate-spin" />
										Deploying Server Container...
									</>
								) : (
									<>
										<Gamepad2 className="size-4" />
										Launch {selectedGame?.name.split(" ")[0]} Server
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
