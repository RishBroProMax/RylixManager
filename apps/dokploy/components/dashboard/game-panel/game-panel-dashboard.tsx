import {
	Activity,
	Boxes,
	CheckCircle2,
	Cpu,
	Filter,
	Gamepad2,
	HardDrive,
	Layers,
	Loader2,
	Network,
	Plus,
	Radio,
	RefreshCw,
	Search,
	Server,
	ShieldAlert,
	Zap,
} from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { AddGameServer } from "@/components/dashboard/project/add-game-server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/utils/api";
import { GameServerCard } from "./game-server-card";
import { GameServerDetail } from "./game-server-detail";

const GAME_IDENTIFIERS = [
	"minecraft",
	"rust",
	"palworld",
	"valheim",
	"terraria",
	"cs2",
	"csgo",
	"satisfactory",
	"factorio",
	"enshrouded",
	"zomboid",
	"ark",
	"game",
];

export const GamePanelDashboard: React.FC = () => {
	const router = useRouter();
	const { data: services, isLoading, refetch, isRefetching } =
		api.overview.services.useQuery();
	const { data: allProjects } = api.project.all.useQuery();

	const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
		typeof router.query.server === "string" ? router.query.server : null,
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [showAllServices, setShowAllServices] = useState(false);

	useEffect(() => {
		if (typeof router.query.server === "string") {
			setSelectedServiceId(router.query.server);
		}
	}, [router.query.server]);

	const handleSelectService = (id: string | null) => {
		setSelectedServiceId(id);
		if (id) {
			router.replace(
				{ pathname: router.pathname, query: { server: id } },
				undefined,
				{ shallow: true },
			);
		} else {
			const { server: _server, ...query } = router.query;
			router.replace({ pathname: router.pathname, query }, undefined, {
				shallow: true,
			});
		}
	};

	// Filter game servers from all compose services
	const gameServices = useMemo(() => {
		if (!services) return [];
		return services.filter((s) => {
			if (s.type !== "compose") return false;
			if (showAllServices) return true;

			const nameLower = (s.name || "").toLowerCase();
			const appLower = (s.appName || "").toLowerCase();
			return GAME_IDENTIFIERS.some(
				(kw) => nameLower.includes(kw) || appLower.includes(kw),
			);
		});
	}, [services, showAllServices]);

	// Filter by search and status
	const filteredServices = useMemo(() => {
		return gameServices.filter((s) => {
			const matchesSearch =
				s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.projectName.toLowerCase().includes(searchQuery.toLowerCase());
			if (!matchesSearch) return false;

			if (statusFilter === "all") return true;
			if (statusFilter === "online")
				return s.status === "done" || s.status === "running";
			if (statusFilter === "stopped") return s.status !== "done";
			return true;
		});
	}, [gameServices, searchQuery, statusFilter]);

	// Calculate fleet metrics
	const totalServers = gameServices.length;
	const onlineServers = gameServices.filter(
		(s) => s.status === "done" || s.status === "running",
	).length;

	// Active selected service for detail view
	const selectedService = useMemo(() => {
		if (!selectedServiceId) return null;
		return services?.find((s) => s.id === selectedServiceId) || null;
	}, [selectedServiceId, services]);

	if (selectedService) {
		return (
			<GameServerDetail
				service={selectedService}
				onBack={() => handleSelectService(null)}
			/>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header Banner */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<Gamepad2 className="size-6 text-primary" />
						<h1 className="text-2xl font-bold tracking-tight">
							Game Control Panel
						</h1>
						<Badge variant="outline" className="text-[10px] font-mono">
							Rylix Engine
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Enterprise-grade game server management, live consoles, file management, and game proxies.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs gap-1.5"
						onClick={() => refetch()}
						disabled={isRefetching}
					>
						<RefreshCw
							className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`}
						/>
						Sync Fleet
					</Button>

					<AddGameServer
						customTrigger={
							<Button size="sm" className="h-8 text-xs gap-1.5 font-medium">
								<Plus className="size-3.5" />
								Deploy Game Server
							</Button>
						}
					/>
				</div>
			</div>

			{/* KPI Metric Tiles */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<Card className="bg-background border-border p-4">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">
							Total Game Servers
						</span>
						<Boxes className="size-4 text-primary" />
					</div>
					<p className="text-2xl font-bold tracking-tight mt-2">
						{totalServers}
					</p>
					<span className="text-[10px] text-muted-foreground">
						Dedicated game instances
					</span>
				</Card>

				<Card className="bg-background border-border p-4">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">
							Active / Online
						</span>
						<CheckCircle2 className="size-4 text-emerald-500" />
					</div>
					<p className="text-2xl font-bold tracking-tight mt-2 text-emerald-500">
						{onlineServers}
					</p>
					<span className="text-[10px] text-muted-foreground">
						Handling live players
					</span>
				</Card>

				<Card className="bg-background border-border p-4">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">
							Game Protocols
						</span>
						<Network className="size-4 text-blue-500" />
					</div>
					<p className="text-2xl font-bold tracking-tight mt-2">TCP & UDP</p>
					<span className="text-[10px] text-muted-foreground">
						Direct host port passthrough
					</span>
				</Card>

				<Card className="bg-background border-border p-4">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">
							Engine Status
						</span>
						<Zap className="size-4 text-amber-500" />
					</div>
					<p className="text-2xl font-bold tracking-tight mt-2 text-amber-500">
						Optimal
					</p>
					<span className="text-[10px] text-muted-foreground">
						UDP buffers tuned & ready
					</span>
				</Card>
			</div>

			{/* Filter Controls Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/10 border border-border/70 rounded-lg">
				<div className="flex items-center gap-2 flex-1 max-w-sm">
					<div className="relative w-full">
						<Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search servers by name or project..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-8 pl-8 text-xs bg-background"
						/>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="h-8 text-xs w-[120px] bg-background">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="online">Online</SelectItem>
							<SelectItem value="stopped">Stopped</SelectItem>
						</SelectContent>
					</Select>

					<Button
						variant={showAllServices ? "secondary" : "ghost"}
						size="sm"
						className="h-8 text-xs text-muted-foreground"
						onClick={() => setShowAllServices(!showAllServices)}
					>
						{showAllServices ? "Showing All" : "Games Only"}
					</Button>
				</div>
			</div>

			{/* Server Fleet Grid */}
			{isLoading ? (
				<div className="flex items-center justify-center py-24">
					<Loader2 className="size-8 animate-spin text-muted-foreground" />
				</div>
			) : filteredServices.length === 0 ? (
				<Card className="bg-background border-border">
					<CardContent className="py-20 text-center space-y-4">
						<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
							<Gamepad2 className="size-6" />
						</div>
						<div className="space-y-1">
							<h3 className="text-base font-semibold">No Game Servers Found</h3>
							<p className="text-xs text-muted-foreground max-w-sm mx-auto">
								You don't have any game servers running yet. Launch Minecraft, Rust, Palworld, Valheim, or CS2 with one click.
							</p>
						</div>
						<div className="pt-2">
							<AddGameServer
								customTrigger={
									<Button size="sm" className="h-8 text-xs gap-1.5">
										<Plus className="size-3.5" />
										Deploy Your First Game Server
									</Button>
								}
							/>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredServices.map((service) => (
						<GameServerCard
							key={service.id}
							service={service}
							onSelect={() => handleSelectService(service.id)}
						/>
					))}
				</div>
			)}
		</div>
	);
};
