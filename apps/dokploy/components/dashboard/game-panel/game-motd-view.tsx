import {
	Check,
	Gamepad2,
	HelpCircle,
	Info,
	Layers,
	Loader2,
	Palette,
	RefreshCw,
	Save,
	Server,
	Shield,
	Sparkles,
	Terminal,
	Users,
	Wifi,
	Zap,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/utils/api";

interface Props {
	containerId: string;
	appName: string;
	serverId?: string;
	serverIp?: string;
}

// Minecraft formatting color code mappings
const MC_COLORS: Record<string, string> = {
	"0": "#000000",
	"1": "#0000AA",
	"2": "#00AA00",
	"3": "#00AAAA",
	"4": "#AA0000",
	"5": "#AA00AA",
	"6": "#FFAA00",
	"7": "#AAAAAA",
	"8": "#555555",
	"9": "#5555FF",
	a: "#55FF55",
	b: "#55FFFF",
	c: "#FF5555",
	d: "#FF55FF",
	e: "#FFFF55",
	f: "#FFFFFF",
};

/**
 * Parses Minecraft § color codes into React HTML spans
 */
const renderMinecraftText = (text: string) => {
	if (!text) return <span className="text-muted-foreground">A Minecraft Server</span>;

	const parts: React.ReactNode[] = [];
	const regex = /§([0-9a-fk-or])/gi;
	let currentColor = "#AAAAAA";
	let isBold = false;
	let isItalic = false;
	let isUnderline = false;

	let lastIdx = 0;
	let match: RegExpExecArray | null;

	const fullText = text;
	while ((match = regex.exec(fullText)) !== null) {
		const textBefore = fullText.slice(lastIdx, match.index);
		if (textBefore) {
			parts.push(
				<span
					key={parts.length}
					style={{
						color: currentColor,
						fontWeight: isBold ? "bold" : "normal",
						fontStyle: isItalic ? "italic" : "normal",
						textDecoration: isUnderline ? "underline" : "none",
					}}
				>
					{textBefore}
				</span>,
			);
		}

		const code = match[1]?.toLowerCase();
		if (code && MC_COLORS[code]) {
			currentColor = MC_COLORS[code];
			isBold = false;
			isItalic = false;
			isUnderline = false;
		} else if (code === "l") {
			isBold = true;
		} else if (code === "o") {
			isItalic = true;
		} else if (code === "n") {
			isUnderline = true;
		} else if (code === "r") {
			currentColor = "#AAAAAA";
			isBold = false;
			isItalic = false;
			isUnderline = false;
		}

		lastIdx = regex.lastIndex;
	}

	const remaining = fullText.slice(lastIdx);
	if (remaining) {
		parts.push(
			<span
				key={parts.length}
				style={{
					color: currentColor,
					fontWeight: isBold ? "bold" : "normal",
					fontStyle: isItalic ? "italic" : "normal",
					textDecoration: isUnderline ? "underline" : "none",
				}}
			>
				{remaining}
			</span>,
		);
	}

	return <>{parts}</>;
};

export const GameMotdView: React.FC<Props> = ({
	containerId,
	appName,
	serverId,
	serverIp = "127.0.0.1",
}) => {
	const [motdLine1, setMotdLine1] = useState("§a§lRylixManager §7Dedicated Server");
	const [motdLine2, setMotdLine2] = useState("§eJoin now! §fSurvival & Multiplayer");
	const [maxPlayers, setMaxPlayers] = useState("20");
	const [gamemode, setGamemode] = useState("survival");
	const [difficulty, setDifficulty] = useState("easy");
	const [pvp, setPvp] = useState(true);
	const [onlineMode, setOnlineMode] = useState(true);
	const [whiteList, setWhiteList] = useState(false);
	const [hardcore, setHardcore] = useState(false);
	const [allowFlight, setAllowFlight] = useState(false);
	const [spawnMonsters, setSpawnMonsters] = useState(true);
	const [viewDistance, setViewDistance] = useState("10");

	// Query properties
	const { data: serverProps, refetch, isLoading } = api.gameServer.readProperties.useQuery(
		{ containerId, serverId },
		{ enabled: !!containerId },
	);

	// Sync fetched properties to form state
	useEffect(() => {
		if (serverProps && Object.keys(serverProps).length > 0) {
			const fullMotd = serverProps.motd || "";
			if (fullMotd.includes("\n")) {
				const [l1, l2] = fullMotd.split("\n");
				setMotdLine1(l1 || "");
				setMotdLine2(l2 || "");
			} else {
				setMotdLine1(fullMotd);
			}

			if (serverProps["max-players"]) setMaxPlayers(serverProps["max-players"]);
			if (serverProps.gamemode) setGamemode(serverProps.gamemode);
			if (serverProps.difficulty) setDifficulty(serverProps.difficulty);
			if (serverProps.pvp !== undefined) setPvp(serverProps.pvp === "true");
			if (serverProps["online-mode"] !== undefined)
				setOnlineMode(serverProps["online-mode"] === "true");
			if (serverProps["white-list"] !== undefined)
				setWhiteList(serverProps["white-list"] === "true");
			if (serverProps.hardcore !== undefined)
				setHardcore(serverProps.hardcore === "true");
			if (serverProps["allow-flight"] !== undefined)
				setAllowFlight(serverProps["allow-flight"] === "true");
			if (serverProps["spawn-monsters"] !== undefined)
				setSpawnMonsters(serverProps["spawn-monsters"] === "true");
			if (serverProps["view-distance"])
				setViewDistance(serverProps["view-distance"]);
		}
	}, [serverProps]);

	const writeMutation = api.gameServer.writeProperties.useMutation();

	const handleSave = async () => {
		const combinedMotd = motdLine2.trim()
			? `${motdLine1.trim()}\\n${motdLine2.trim()}`
			: motdLine1.trim();

		const updatedMap: Record<string, string> = {
			motd: combinedMotd,
			"max-players": maxPlayers,
			gamemode,
			difficulty,
			pvp: String(pvp),
			"online-mode": String(onlineMode),
			"white-list": String(whiteList),
			hardcore: String(hardcore),
			"allow-flight": String(allowFlight),
			"spawn-monsters": String(spawnMonsters),
			"view-distance": viewDistance,
		};

		try {
			const res = await writeMutation.mutateAsync({
				containerId,
				properties: updatedMap,
				serverId,
			});

			if (res.success) {
				toast.success("Server properties saved successfully!");
				refetch();
			} else {
				toast.error(res.message || "Failed to update properties");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		}
	};

	const insertColorCode = (code: string) => {
		setMotdLine1((prev) => `${prev}§${code}`);
	};

	const colorPalette = [
		{ code: "0", hex: "#000000", label: "Black" },
		{ code: "1", hex: "#0000AA", label: "Dark Blue" },
		{ code: "2", hex: "#00AA00", label: "Dark Green" },
		{ code: "3", hex: "#00AAAA", label: "Dark Aqua" },
		{ code: "4", hex: "#AA0000", label: "Dark Red" },
		{ code: "5", hex: "#AA00AA", label: "Purple" },
		{ code: "6", hex: "#FFAA00", label: "Gold" },
		{ code: "7", hex: "#AAAAAA", label: "Gray" },
		{ code: "8", hex: "#555555", label: "Dark Gray" },
		{ code: "9", hex: "#5555FF", label: "Blue" },
		{ code: "a", hex: "#55FF55", label: "Green" },
		{ code: "b", hex: "#55FFFF", label: "Aqua" },
		{ code: "c", hex: "#FF5555", label: "Red" },
		{ code: "d", hex: "#FF55FF", label: "Light Purple" },
		{ code: "e", hex: "#FFFF55", label: "Yellow" },
		{ code: "f", hex: "#FFFFFF", label: "White" },
	];

	return (
		<div className="space-y-6">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h3 className="text-base font-semibold tracking-tight flex items-center gap-2">
						<Sparkles className="size-4" />
						Visual MOTD & Server Configuration
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Customize the in-game server ping banner, color styles, gameplay rules, and authentication mode.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs gap-1.5"
						onClick={() => refetch()}
						disabled={isLoading}
					>
						<RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
						Reload Config
					</Button>
					<Button
						size="sm"
						className="h-8 text-xs gap-1.5 font-medium"
						onClick={handleSave}
						disabled={writeMutation.isPending}
					>
						{writeMutation.isPending ? (
							<Loader2 className="size-3.5 animate-spin" />
						) : (
							<Save className="size-3.5" />
						)}
						{writeMutation.isPending ? "Saving..." : "Save & Apply"}
					</Button>
				</div>
			</div>

			{/* Iconic Multiplayer Server List Ping Preview */}
			<Card className="bg-black/95 border-border shadow-md overflow-hidden">
				<CardHeader className="p-3 bg-muted/20 border-b border-border/40">
					<div className="flex items-center justify-between text-xs">
						<span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
							Live In-Game Multiplayer Ping Preview
						</span>
						<span className="font-mono text-muted-foreground text-[10px]">
							{serverIp}:25565
						</span>
					</div>
				</CardHeader>
				<CardContent className="p-4">
					<div className="flex items-center justify-between gap-4 p-3 bg-black/80 rounded-lg border border-border/60 hover:border-border transition-colors">
						<div className="flex items-center gap-3 min-w-0">
							{/* Server 64x64 Icon */}
							<div className="size-14 rounded bg-neutral-900 border border-border/80 flex items-center justify-center shrink-0 shadow-inner font-mono font-bold text-xs text-muted-foreground">
								<Gamepad2 className="size-7 text-emerald-500" />
							</div>

							{/* Two Line MOTD text */}
							<div className="min-w-0 flex flex-col font-mono text-xs leading-relaxed">
								<div className="truncate text-sm font-semibold">
									{renderMinecraftText(motdLine1)}
								</div>
								<div className="truncate text-xs text-muted-foreground mt-0.5">
									{renderMinecraftText(motdLine2)}
								</div>
							</div>
						</div>

						{/* Ping Bars & Player Count */}
						<div className="flex items-center gap-3 shrink-0">
							<span className="font-mono text-xs text-muted-foreground">
								<span className="text-emerald-400 font-semibold">0</span> / {maxPlayers}
							</span>
							<div className="flex items-end gap-0.5 h-4 w-4 justify-end">
								<div className="w-0.5 h-1 bg-emerald-500 rounded-full" />
								<div className="w-0.5 h-2 bg-emerald-500 rounded-full" />
								<div className="w-0.5 h-3 bg-emerald-500 rounded-full" />
								<div className="w-0.5 h-4 bg-emerald-500 rounded-full" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Editor Sections */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* MOTD Inputs & Color Palette */}
				<Card className="bg-background border-border shadow-xs">
					<CardHeader className="p-4 pb-3 border-b border-border/60">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<Palette className="size-4 text-muted-foreground" />
							MOTD Banner Text
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 space-y-4">
						<div className="space-y-1.5">
							<Label className="text-xs">Line 1 (Title / Branding)</Label>
							<Input
								value={motdLine1}
								onChange={(e) => setMotdLine1(e.target.value)}
								placeholder="§a§lRylixManager §7Server"
								className="h-8 text-xs font-mono"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">Line 2 (Subtext / Description)</Label>
							<Input
								value={motdLine2}
								onChange={(e) => setMotdLine2(e.target.value)}
								placeholder="§eSurvival 1.21 • §fJoin Now!"
								className="h-8 text-xs font-mono"
							/>
						</div>

						{/* Quick Color Code Buttons */}
						<div className="space-y-1.5 pt-2">
							<Label className="text-xs text-muted-foreground">
								Quick Color Code Inserts (appends §x):
							</Label>
							<div className="grid grid-cols-8 gap-1">
								{colorPalette.map((c) => (
									<button
										key={c.code}
										type="button"
										onClick={() => insertColorCode(c.code)}
										style={{ backgroundColor: c.hex }}
										title={`§${c.code} (${c.label})`}
										className="h-6 rounded border border-border/40 hover:scale-105 transition-transform flex items-center justify-center font-mono text-[10px] font-bold text-black drop-shadow-sm"
									>
										{c.code}
									</button>
								))}
							</div>
							<div className="flex gap-1 pt-1">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-6 px-2 text-[10px] font-mono"
									onClick={() => insertColorCode("l")}
								>
									§l Bold
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-6 px-2 text-[10px] font-mono"
									onClick={() => insertColorCode("o")}
								>
									§o Italic
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-6 px-2 text-[10px] font-mono"
									onClick={() => insertColorCode("n")}
								>
									§n Underline
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-6 px-2 text-[10px] font-mono"
									onClick={() => insertColorCode("r")}
								>
									§r Reset
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Game Rules & Switches */}
				<Card className="bg-background border-border shadow-xs">
					<CardHeader className="p-4 pb-3 border-b border-border/60">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<Layers className="size-4 text-muted-foreground" />
							Gameplay & Security Switches
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 space-y-4">
						{/* Online Mode / Cracked Mode */}
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs font-semibold">Online Mode (Mojang Auth)</Label>
								<p className="text-[11px] text-muted-foreground">
									Enable for official accounts; disable to allow offline/cracked players.
								</p>
							</div>
							<Switch checked={onlineMode} onCheckedChange={setOnlineMode} />
						</div>

						{/* PvP */}
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs font-semibold">PvP (Player vs Player)</Label>
								<p className="text-[11px] text-muted-foreground">
									Allow players to deal damage to one another.
								</p>
							</div>
							<Switch checked={pvp} onCheckedChange={setPvp} />
						</div>

						{/* Whitelist */}
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs font-semibold">Whitelist Enforcement</Label>
								<p className="text-[11px] text-muted-foreground">
									Restrict server access to players on the whitelist.
								</p>
							</div>
							<Switch checked={whiteList} onCheckedChange={setWhiteList} />
						</div>

						{/* Hardcore Mode */}
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs font-semibold">Hardcore Mode</Label>
								<p className="text-[11px] text-muted-foreground">
									Sets difficulty to Hard and permanently bans players on death.
								</p>
							</div>
							<Switch checked={hardcore} onCheckedChange={setHardcore} />
						</div>

						{/* Allow Flight */}
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs font-semibold">Allow Flight</Label>
								<p className="text-[11px] text-muted-foreground">
									Allows players to fly with mods without getting kicked.
								</p>
							</div>
							<Switch checked={allowFlight} onCheckedChange={setAllowFlight} />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Dropdowns & Numeric Limits */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-background border-border p-4 shadow-xs space-y-2">
					<Label className="text-xs font-medium">Max Players</Label>
					<Input
						type="number"
						value={maxPlayers}
						onChange={(e) => setMaxPlayers(e.target.value)}
						className="h-8 text-xs font-mono"
					/>
				</Card>

				<Card className="bg-background border-border p-4 shadow-xs space-y-2">
					<Label className="text-xs font-medium">Default Gamemode</Label>
					<Select value={gamemode} onValueChange={setGamemode}>
						<SelectTrigger className="h-8 text-xs">
							<SelectValue placeholder="Select Gamemode" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="survival">Survival</SelectItem>
							<SelectItem value="creative">Creative</SelectItem>
							<SelectItem value="adventure">Adventure</SelectItem>
							<SelectItem value="spectator">Spectator</SelectItem>
						</SelectContent>
					</Select>
				</Card>

				<Card className="bg-background border-border p-4 shadow-xs space-y-2">
					<Label className="text-xs font-medium">World Difficulty</Label>
					<Select value={difficulty} onValueChange={setDifficulty}>
						<SelectTrigger className="h-8 text-xs">
							<SelectValue placeholder="Select Difficulty" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="peaceful">Peaceful</SelectItem>
							<SelectItem value="easy">Easy</SelectItem>
							<SelectItem value="normal">Normal</SelectItem>
							<SelectItem value="hard">Hard</SelectItem>
						</SelectContent>
					</Select>
				</Card>

				<Card className="bg-background border-border p-4 shadow-xs space-y-2">
					<Label className="text-xs font-medium">View Distance (Chunks)</Label>
					<Input
						type="number"
						value={viewDistance}
						onChange={(e) => setViewDistance(e.target.value)}
						className="h-8 text-xs font-mono"
					/>
				</Card>
			</div>
		</div>
	);
};
