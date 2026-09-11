import {
	Check,
	Copy,
	ExternalLink,
	Folder,
	Gamepad2,
	HardDrive,
	Play,
	Power,
	RefreshCw,
	Server,
	Square,
	Terminal,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { api } from "@/utils/api";

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
		createdAt: string;
	};
	onSelect: () => void;
}

export const GameServerCard: React.FC<Props> = ({ service, onSelect }) => {
	const [copied, setCopied] = useState(false);
	const utils = api.useUtils();

	// Fetch server IP if available
	const { data: servers } = api.server.withSSHKey.useQuery();
	const server = servers?.find((s) => s.serverId === service.serverId);
	const serverIp = server?.ipAddress || "127.0.0.1";
	const directEndpoint = `${serverIp}:25565`;

	const composeActions = {
		deploy: api.compose.deploy.useMutation(),
		stop: api.compose.stop.useMutation(),
	};

	const isOnline = service.status === "done" || service.status === "running";
	const isActionPending =
		composeActions.deploy.isPending || composeActions.stop.isPending;

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation();
		navigator.clipboard.writeText(directEndpoint);
		setCopied(true);
		toast.success("Game address copied!");
		setTimeout(() => setCopied(false), 2000);
	};

	const handleRestart = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await composeActions.deploy.mutateAsync({ composeId: service.id });
			toast.success("Rebuilding & restarting game server...");
			utils.overview.services.invalidate();
		} catch (err) {
			toast.error("Failed to restart");
		}
	};

	const handleTogglePower = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			if (isOnline) {
				await composeActions.stop.mutateAsync({ composeId: service.id });
				toast.success("Game server stopping...");
			} else {
				await composeActions.deploy.mutateAsync({ composeId: service.id });
				toast.success("Game server starting up...");
			}
			utils.overview.services.invalidate();
		} catch (err) {
			toast.error("Power action failed");
		}
	};

	return (
		<Card
			onClick={onSelect}
			className="group bg-background border-border hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
		>
			<CardHeader className="p-5 pb-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
							<Gamepad2 className="size-5 text-primary" />
						</div>
						<div className="min-w-0">
							<h3 className="text-sm font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
								{service.name}
							</h3>
							<p className="text-[11px] text-muted-foreground truncate">
								{service.projectName}
							</p>
						</div>
					</div>

					<Badge
						variant={isOnline ? "default" : "secondary"}
						className={`text-[10px] font-mono shrink-0 uppercase ${
							isOnline
								? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30"
								: "text-muted-foreground"
						}`}
					>
						{isOnline ? "Online" : "Stopped"}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="p-5 pt-1 space-y-3">
				{/* Direct Connect String */}
				<div
					onClick={handleCopy}
					className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border/60 hover:bg-muted/70 transition-colors text-xs font-mono"
				>
					<span className="text-foreground truncate">{directEndpoint}</span>
					<button className="text-muted-foreground hover:text-foreground">
						{copied ? (
							<Check className="size-3.5 text-emerald-500" />
						) : (
							<Copy className="size-3.5" />
						)}
					</button>
				</div>

				<div className="flex items-center justify-between text-[11px] text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<Server className="size-3" />
						{service.serverName || "Local Host"}
					</span>
					<span className="font-mono">Port: 25565</span>
				</div>
			</CardContent>

			<CardFooter className="p-5 pt-0 border-t border-border/40 flex items-center justify-between gap-2 mt-2">
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-xs px-2.5 gap-1.5"
					onClick={(e) => {
						e.stopPropagation();
						onSelect();
					}}
				>
					Open Panel
				</Button>

				<div className="flex items-center gap-1.5">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={handleRestart}
						disabled={isActionPending}
						title="Restart Server"
					>
						<RefreshCw
							className={`size-3.5 ${isActionPending ? "animate-spin" : ""}`}
						/>
					</Button>

					<Button
						variant="ghost"
						size="icon"
						className={`h-7 w-7 ${
							isOnline
								? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
								: "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
						}`}
						onClick={handleTogglePower}
						disabled={isActionPending}
						title={isOnline ? "Stop Server" : "Start Server"}
					>
						{isOnline ? (
							<Square className="size-3.5" />
						) : (
							<Play className="size-3.5" />
						)}
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
};
