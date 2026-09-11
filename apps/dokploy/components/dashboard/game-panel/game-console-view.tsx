import dynamic from "next/dynamic";
import {
	Activity,
	Check,
	Clock,
	Copy,
	CornerDownLeft,
	Gamepad2,
	HardDrive,
	Play,
	Power,
	RefreshCw,
	Save,
	Send,
	Server,
	Square,
	Terminal,
	XOctagon,
	Zap,
} from "lucide-react";
import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";

const DockerLogsId = dynamic(
	() =>
		import("@/components/dashboard/docker/logs/docker-logs-id").then(
			(e) => e.DockerLogsId,
		),
	{ ssr: false },
);

const DockerTerminal = dynamic(
	() =>
		import("@/components/dashboard/docker/terminal/docker-terminal").then(
			(e) => e.DockerTerminal,
		),
	{ ssr: false },
);

interface Props {
	containerId: string;
	appName: string;
	serverId?: string;
	serviceId?: string;
	gameType?: string;
	status: string;
	onPowerAction?: () => void;
}

export const GameConsoleView: React.FC<Props> = ({
	containerId,
	appName,
	serverId,
	serviceId,
	gameType = "minecraft",
	status,
	onPowerAction,
}) => {
	const [consoleMode, setConsoleMode] = useState<"logs" | "terminal">("logs");
	const [commandInput, setCommandInput] = useState("");
	const [isExecuting, setIsExecuting] = useState(false);
	const [lastResponse, setLastResponse] = useState<string | null>(null);

	const { data: serverStats } = api.gameServer.getStats.useQuery(
		{ containerId, serverId },
		{ refetchInterval: 4000 },
	);

	const sendCommandMutation = api.gameServer.sendCommand.useMutation();
	const saveWorldMutation = api.gameServer.saveWorld.useMutation();
	const createBackupMutation = api.gameServer.createBackup.useMutation();

	const restartMutation = api.docker.restartContainer.useMutation();
	const startMutation = api.docker.startContainer.useMutation();
	const stopMutation = api.docker.stopContainer.useMutation();
	const killMutation = api.docker.killContainer.useMutation();

	const handlePowerAction = async (action: "start" | "restart" | "stop" | "kill") => {
		try {
			if (action === "restart") {
				await restartMutation.mutateAsync({ containerId, serverId });
				toast.success("Game server restarted");
			} else if (action === "start") {
				await startMutation.mutateAsync({ containerId, serverId });
				toast.success("Game server started");
			} else if (action === "stop") {
				await stopMutation.mutateAsync({ containerId, serverId });
				toast.success("Game server stopped");
			} else if (action === "kill") {
				await killMutation.mutateAsync({ containerId, serverId });
				toast.success("Game server terminated");
			}
			onPowerAction?.();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : `Failed to ${action} server`);
		}
	};

	const handleSendCommand = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!commandInput.trim() || isExecuting) return;

		setIsExecuting(true);
		try {
			const res = await sendCommandMutation.mutateAsync({
				containerId,
				command: commandInput.trim(),
				serverId,
				gameType,
			});

			if (res.success) {
				setLastResponse(res.output || "Command executed");
				toast.success(`Executed: ${commandInput.trim()}`);
				setCommandInput("");
			} else {
				toast.error(res.error || "Failed to execute command");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Command execution error");
		} finally {
			setIsExecuting(false);
		}
	};

	const handleSaveWorld = async () => {
		try {
			const res = await saveWorldMutation.mutateAsync({
				containerId,
				serverId,
				gameType,
			});
			if (res.success) {
				toast.success("Game world saved successfully!");
				setLastResponse(res.output || "World save complete");
			} else {
				toast.error(res.error || "Failed to save game world");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		}
	};

	const handleCreateBackup = async () => {
		try {
			const res = await createBackupMutation.mutateAsync({
				containerId,
				serverId,
				gameType,
			});
			if (res.success) {
				toast.success(`World snapshot created: ${res.backupFile}`);
				setLastResponse(`Snapshot saved: ${res.backupFile}`);
			} else {
				toast.error(res.error || "Failed to create snapshot");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Backup failed");
		}
	};

	const executeQuickCommand = async (cmd: string) => {
		setCommandInput(cmd);
		setIsExecuting(true);
		try {
			const res = await sendCommandMutation.mutateAsync({
				containerId,
				command: cmd,
				serverId,
				gameType,
			});
			if (res.success) {
				setLastResponse(res.output || "Command executed");
				toast.success(`Executed: ${cmd}`);
			} else {
				toast.error(res.error || "Failed to execute command");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Execution failed");
		} finally {
			setIsExecuting(false);
		}
	};

	return (
		<div className="space-y-4">
			{/* Power Controls & Mode Bar */}
			<Card className="bg-background border-border">
				<CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div
							className={`size-3 rounded-full ${
								status === "done" || status === "running"
									? "bg-emerald-500 animate-pulse"
									: "bg-red-500"
							}`}
						/>
						<div>
							<h4 className="text-sm font-semibold tracking-tight">
								{appName}
							</h4>
							<div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
								<span>ID: {containerId.slice(0, 12)}</span>
								<span>•</span>
								<span className="text-emerald-500 font-semibold">
									CPU: {serverStats?.cpuPercent ?? 0}%
								</span>
								<span>•</span>
								<span className="text-blue-400 font-semibold">
									RAM: {serverStats?.memoryFormatted ?? "0 MB"}
								</span>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-2">
						<div className="bg-muted/40 p-1 rounded-lg flex items-center border border-border/60">
							<Button
								variant={consoleMode === "logs" ? "secondary" : "ghost"}
								size="sm"
								className="h-7 text-xs"
								onClick={() => setConsoleMode("logs")}
							>
								Live Log Stream
							</Button>
							<Button
								variant={consoleMode === "terminal" ? "secondary" : "ghost"}
								size="sm"
								className="h-7 text-xs"
								onClick={() => setConsoleMode("terminal")}
							>
								Interactive TTY
							</Button>
						</div>

						<div className="h-4 w-px bg-border/60 mx-1" />

						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs gap-1.5"
							onClick={() => handlePowerAction("restart")}
							disabled={restartMutation.isPending}
						>
							<RefreshCw
								className={`size-3.5 ${
									restartMutation.isPending ? "animate-spin" : ""
								}`}
							/>
							Restart
						</Button>

						{status === "done" || status === "running" ? (
							<Button
								variant="outline"
								size="sm"
								className="h-8 text-xs gap-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
								onClick={() => handlePowerAction("stop")}
								disabled={stopMutation.isPending}
							>
								<Square className="size-3.5" />
								Stop
							</Button>
						) : (
							<Button
								size="sm"
								className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
								onClick={() => handlePowerAction("start")}
								disabled={startMutation.isPending}
							>
								<Play className="size-3.5" />
								Start
							</Button>
						)}

						<Button
							variant="ghost"
							size="sm"
							className="h-8 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10"
							onClick={() => handlePowerAction("kill")}
							disabled={killMutation.isPending}
						>
							<XOctagon className="size-3.5" />
							Kill
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Quick Command Toolbar for Game Admins */}
			<div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
				<span className="text-[11px] font-medium text-muted-foreground mr-1">
					Admin Commands:
				</span>
				<Button
					variant="outline"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono"
					onClick={() => executeQuickCommand("say Server restarting in 5 minutes!")}
				>
					say
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono"
					onClick={() => executeQuickCommand("save-all")}
				>
					save-all
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono"
					onClick={() => executeQuickCommand("time set day")}
				>
					time set day
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono"
					onClick={() => executeQuickCommand("weather clear")}
				>
					weather clear
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono"
					onClick={() => executeQuickCommand("whitelist on")}
				>
					whitelist on
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono"
					onClick={() => executeQuickCommand("status")}
				>
					status
				</Button>
			</div>

			{/* Interactive Command Input Form */}
			<form onSubmit={handleSendCommand} className="flex items-center gap-2">
				<div className="relative flex-1">
					<Terminal className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Execute server command (e.g. op player, whitelist add, say Hello)..."
						value={commandInput}
						onChange={(e) => setCommandInput(e.target.value)}
						className="h-8 pl-8 font-mono text-xs"
						disabled={isExecuting}
					/>
				</div>
				<Button
					type="submit"
					size="sm"
					className="h-8 text-xs gap-1.5 font-medium"
					disabled={isExecuting || !commandInput.trim()}
				>
					<Send className="size-3.5" />
					{isExecuting ? "Executing..." : "Send"}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 text-xs gap-1.5"
					onClick={handleSaveWorld}
					disabled={saveWorldMutation.isPending}
				>
					<Save className="size-3.5 text-emerald-500" />
					{saveWorldMutation.isPending ? "Saving..." : "Save World"}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 text-xs gap-1.5"
					onClick={handleCreateBackup}
					disabled={createBackupMutation.isPending}
				>
					<HardDrive className="size-3.5 text-blue-400" />
					{createBackupMutation.isPending ? "Archiving..." : "Snapshot"}
				</Button>
			</form>

			{/* Last Command Response */}
			{lastResponse && (
				<div className="rounded border border-border bg-black/60 px-3 py-1.5 text-xs font-mono text-emerald-400 flex items-center justify-between">
					<span className="truncate">↳ {lastResponse}</span>
					<button
						type="button"
						onClick={() => setLastResponse(null)}
						className="text-muted-foreground hover:text-white text-[10px] ml-2"
					>
						Dismiss
					</button>
				</div>
			)}

			{/* Console Display Screen */}
			<Card className="bg-black/90 border-border text-white overflow-hidden shadow-md">
				<CardContent className="p-0">
					{consoleMode === "logs" ? (
						<div className="h-[60vh] overflow-hidden p-2">
							<DockerLogsId
								containerId={containerId}
								serverId={serverId}
								runType="native"
								serviceId={serviceId}
							/>
						</div>
					) : (
						<div className="h-[60vh] overflow-hidden p-2">
							<DockerTerminal
								id={`term-${containerId}`}
								containerId={containerId}
								serverId={serverId || ""}
								serviceId={serviceId}
							/>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
