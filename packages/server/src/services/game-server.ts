import { execAsync, execAsyncRemote } from "@dokploy/server/utils/process/execAsync";
import { getRemoteDocker } from "@dokploy/server/utils/servers/remote-docker";

export interface GameCommandResult {
	success: boolean;
	output: string;
	error?: string;
}

export interface GameServerTelemetry {
	containerId: string;
	status: string;
	cpuPercent: number;
	memoryUsageBytes: number;
	memoryLimitBytes: number;
	memoryFormatted: string;
	uptimeSeconds: number;
	ports: string[];
}

export interface GamePresetInfo {
	gameId: string;
	title: string;
	defaultPort: number;
	protocol: "tcp" | "udp" | "both";
	configFile: string;
	quickCommands: Array<{ label: string; command: string; description: string }>;
	saveCommand: string;
}

export const GAME_PRESETS: Record<string, GamePresetInfo> = {
	minecraft: {
		gameId: "minecraft",
		title: "Minecraft Server (Paper / Purpur / Vanilla)",
		defaultPort: 25565,
		protocol: "tcp",
		configFile: "/data/server.properties",
		saveCommand: "save-all",
		quickCommands: [
			{ label: "Save All", command: "save-all", description: "Force game world save to disk" },
			{ label: "Daytime", command: "time set day", description: "Set game time to morning" },
			{ label: "Clear Weather", command: "weather clear", description: "Clear rain and storms" },
			{ label: "Whitelist On", command: "whitelist on", description: "Enable player whitelist" },
			{ label: "Reload Plugins", command: "reload confirm", description: "Reload Paper/Spigot plugins" },
			{ label: "Tps / Performance", command: "tps", description: "Check server ticks per second" },
		],
	},
	rust: {
		gameId: "rust",
		title: "Rust Dedicated Server",
		defaultPort: 28015,
		protocol: "udp",
		configFile: "/steamcmd/rust/server/identity/cfg/server.cfg",
		saveCommand: "server.save",
		quickCommands: [
			{ label: "Server Save", command: "server.save", description: "Save world data" },
			{ label: "Status", command: "status", description: "List connected players and server FPS" },
			{ label: "Weather Clear", command: "weather.clouds 0", description: "Clear clouds" },
			{ label: "FPS Limit", command: "fps.limit 60", description: "Cap server tick rate" },
		],
	},
	palworld: {
		gameId: "palworld",
		title: "Palworld Dedicated Server",
		defaultPort: 8211,
		protocol: "udp",
		configFile: "/palworld/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini",
		saveCommand: "Save",
		quickCommands: [
			{ label: "Save World", command: "Save", description: "Save world state" },
			{ label: "Show Players", command: "ShowPlayers", description: "Display online players" },
			{ label: "Server Info", command: "Info", description: "Show server version and settings" },
		],
	},
	cs2: {
		gameId: "cs2",
		title: "Counter-Strike 2 Dedicated",
		defaultPort: 27015,
		protocol: "both",
		configFile: "/home/steam/cs2-dedicated/game/csgo/cfg/server.cfg",
		saveCommand: "mp_warmup_end",
		quickCommands: [
			{ label: "Status", command: "status", description: "Show player IDs and server tick rate" },
			{ label: "End Warmup", command: "mp_warmup_end", description: "Instantly begin the match" },
			{ label: "Restart Match", command: "mp_restartgame 1", description: "Restart match" },
			{ label: "Pause Match", command: "mp_pause_match", description: "Pause match" },
		],
	},
	valheim: {
		gameId: "valheim",
		title: "Valheim Dedicated Server",
		defaultPort: 2456,
		protocol: "udp",
		configFile: "/config/adminlist.txt",
		saveCommand: "save",
		quickCommands: [
			{ label: "Save World", command: "save", description: "Trigger world save" },
			{ label: "Ping", command: "ping", description: "Check server heartbeat" },
			{ label: "Player List", command: "players", description: "Show active Vikings" },
		],
	},
};

/**
 * Execute an administrative command inside a running game container.
 * Intelligently targets rcon-cli (for Minecraft itzg/minecraft-server)
 * or runs standard console input commands.
 */
export const sendGameServerCommand = async (
	containerId: string,
	command: string,
	serverId?: string,
	gameType?: string,
): Promise<GameCommandResult> => {
	const sanitizedCmd = command.replace(/"/g, '\\"');
	const type = (gameType || "minecraft").toLowerCase();

	let shellCommand = "";

	if (type.includes("minecraft")) {
		// itzg/minecraft-server has built-in rcon-cli command wrapper
		shellCommand = `docker exec -i ${containerId} rcon-cli "${sanitizedCmd}" 2>&1 || docker exec -i ${containerId} sh -c "echo '${sanitizedCmd}' > /tmp/rcon_cmd"`;
	} else if (type.includes("rust")) {
		shellCommand = `docker exec -i ${containerId} rcon -a 127.0.0.1:28016 -p "secret" "${sanitizedCmd}" 2>&1 || true`;
	} else {
		// Generic container exec
		shellCommand = `docker exec -i ${containerId} sh -c "${sanitizedCmd}" 2>&1 || true`;
	}

	try {
		const { stdout, stderr } = serverId
			? await execAsyncRemote(serverId, shellCommand)
			: await execAsync(shellCommand);

		return {
			success: true,
			output: (stdout || stderr || "Command executed successfully").trim(),
		};
	} catch (err) {
		return {
			success: false,
			output: "",
			error: err instanceof Error ? err.message : "Failed to execute command",
		};
	}
};

/**
 * Triggers an atomic world save on the game server
 */
export const triggerGameSave = async (
	containerId: string,
	serverId?: string,
	gameType = "minecraft",
): Promise<GameCommandResult> => {
	const preset = GAME_PRESETS[gameType] || GAME_PRESETS.minecraft;
	const saveCmd = preset.saveCommand;
	return await sendGameServerCommand(containerId, saveCmd, serverId, gameType);
};

/**
 * Retrieves live telemetry for a game container (CPU %, RAM, state, uptime)
 */
export const getGameServerStats = async (
	containerId: string,
	serverId?: string,
): Promise<GameServerTelemetry> => {
	const docker = await getRemoteDocker(serverId);
	const container = docker.getContainer(containerId);

	try {
		const [inspectData, statsStream] = await Promise.all([
			container.inspect(),
			new Promise<any>((resolve, reject) => {
				container.stats({ stream: false }, (err, data) => {
					if (err) return reject(err);
					resolve(data);
				});
			}),
		]);

		// Calculate CPU %
		let cpuPercent = 0;
		if (statsStream?.cpu_stats && statsStream?.precpu_stats) {
			const cpuDelta =
				statsStream.cpu_stats.cpu_usage.total_usage -
				statsStream.precpu_stats.cpu_usage.total_usage;
			const systemDelta =
				statsStream.cpu_stats.system_cpu_usage -
				statsStream.precpu_stats.system_cpu_usage;
			const numCpus = statsStream.cpu_stats.online_cpus || 1;

			if (systemDelta > 0 && cpuDelta > 0) {
				cpuPercent =
					Math.round((cpuDelta / systemDelta) * numCpus * 1000) / 10;
			}
		}

		// Memory
		const memoryUsageBytes = statsStream?.memory_stats?.usage || 0;
		const memoryLimitBytes = statsStream?.memory_stats?.limit || 0;
		const mbUsed = Math.round(memoryUsageBytes / 1024 / 1024);
		const mbLimit = Math.round(memoryLimitBytes / 1024 / 1024);
		const memoryFormatted = `${mbUsed} MB / ${mbLimit} MB`;

		// Uptime
		const startedAt = inspectData?.State?.StartedAt;
		const uptimeSeconds = startedAt
			? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
			: 0;

		// Ports
		const ports: string[] = [];
		const portBindings = inspectData?.NetworkSettings?.Ports || {};
		for (const [containerPort, hostBindings] of Object.entries(portBindings)) {
			if (Array.isArray(hostBindings) && hostBindings.length > 0) {
				ports.push(`${hostBindings[0].HostPort} → ${containerPort}`);
			}
		}

		return {
			containerId,
			status: inspectData?.State?.Status || "unknown",
			cpuPercent,
			memoryUsageBytes,
			memoryLimitBytes,
			memoryFormatted,
			uptimeSeconds,
			ports,
		};
	} catch (err) {
		return {
			containerId,
			status: "stopped",
			cpuPercent: 0,
			memoryUsageBytes: 0,
			memoryLimitBytes: 0,
			memoryFormatted: "0 MB",
			uptimeSeconds: 0,
			ports: [],
		};
	}
};

export interface GameWorldBackupItem {
	filename: string;
	sizeFormatted: string;
	createdAt: string;
	path: string;
}

/**
 * Creates an atomic compressed snapshot (.tar.gz) of the game container data volume
 */
export const createGameWorldBackup = async (
	containerId: string,
	serverId?: string,
	gameType = "minecraft",
): Promise<{ success: boolean; backupFile?: string; error?: string }> => {
	// First trigger save to flush all memory writes to disk
	await triggerGameSave(containerId, serverId, gameType);

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const backupDir = `/etc/dokploy/game-backups/${containerId.slice(0, 12)}`;
	const backupFileName = `${gameType}-backup-${timestamp}.tar.gz`;
	const fullPath = `${backupDir}/${backupFileName}`;

	let sourcePath = "/data";
	if (gameType === "rust") sourcePath = "/steamcmd/rust/server";
	else if (gameType === "palworld") sourcePath = "/palworld/Pal/Saved";

	const command = `mkdir -p ${backupDir} && docker exec ${containerId} tar -czf - ${sourcePath} > ${fullPath}`;

	try {
		if (serverId) {
			await execAsyncRemote(serverId, command);
		} else {
			await execAsync(command);
		}
		return { success: true, backupFile: backupFileName };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : "Failed to create backup",
		};
	}
};

/**
 * Lists available world backup snapshots for a game container
 */
export const listGameWorldBackups = async (
	containerId: string,
	serverId?: string,
): Promise<GameWorldBackupItem[]> => {
	const backupDir = `/etc/dokploy/game-backups/${containerId.slice(0, 12)}`;
	const command = `ls -lh --time-style=+"%Y-%m-%d %H:%M" ${backupDir} 2>/dev/null || true`;

	try {
		const { stdout } = serverId
			? await execAsyncRemote(serverId, command)
			: await execAsync(command);

		if (!stdout) return [];

		const lines = stdout.trim().split("\n");
		const items: GameWorldBackupItem[] = [];

		for (const line of lines) {
			const parts = line.trim().split(/\s+/);
			if (parts.length >= 7 && !parts[0].startsWith("total")) {
				const size = parts[4];
				const date = `${parts[5]} ${parts[6]}`;
				const filename = parts.slice(7).join(" ");
				if (filename.endsWith(".tar.gz")) {
					items.push({
						filename,
						sizeFormatted: size,
						createdAt: date,
						path: `${backupDir}/${filename}`,
					});
				}
			}
		}

		return items.reverse();
	} catch {
		return [];
	}
};

export interface PluginCatalogItem {
	id: string;
	name: string;
	category: "permissions" | "utility" | "crossplay" | "performance" | "building" | "economy";
	description: string;
	filename: string;
	downloadUrl: string;
	version: string;
	author: string;
	iconText: string;
}

export const GAME_PLUGIN_CATALOG: PluginCatalogItem[] = [
	{
		id: "luckperms",
		name: "LuckPerms",
		category: "permissions",
		description: "An advanced permissions plugin for Minecraft servers. Manage ranks, prefixes, and per-group permissions.",
		filename: "LuckPerms-Bukkit-5.4.145.jar",
		downloadUrl: "https://download.luckperms.net/1556/bukkit/loader/LuckPerms-Bukkit-5.4.145.jar",
		version: "5.4.145",
		author: "Luck",
		iconText: "LP",
	},
	{
		id: "essentialsx",
		name: "EssentialsX",
		category: "utility",
		description: "Essential suite providing teleports (/spawn, /home, /tpa), warps, kits, economy, and player moderation.",
		filename: "EssentialsX-2.20.1.jar",
		downloadUrl: "https://github.com/EssentialsX/Essentials/releases/download/2.20.1/EssentialsX-2.20.1.jar",
		version: "2.20.1",
		author: "EssentialsX Team",
		iconText: "EX",
	},
	{
		id: "viaversion",
		name: "ViaVersion",
		category: "crossplay",
		description: "Allows newer Minecraft client versions to connect to an older server version seamlessly.",
		filename: "ViaVersion-5.2.1.jar",
		downloadUrl: "https://github.com/ViaVersion/ViaVersion/releases/download/5.2.1/ViaVersion-5.2.1.jar",
		version: "5.2.1",
		author: "MylesMc",
		iconText: "VV",
	},
	{
		id: "geyser",
		name: "GeyserMC (Bedrock Cross-Play)",
		category: "crossplay",
		description: "Enables Minecraft: Bedrock Edition players (iOS, Android, Xbox, PlayStation, Windows) to join Java Edition servers.",
		filename: "Geyser-Spigot.jar",
		downloadUrl: "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot",
		version: "Latest",
		author: "GeyserMC",
		iconText: "GM",
	},
	{
		id: "chunky",
		name: "Chunky (World Pre-Generator)",
		category: "performance",
		description: "Pre-generates chunks in advance to eliminate rubber-banding and server tick lag caused by world exploration.",
		filename: "Chunky-Bukkit-1.4.19.jar",
		downloadUrl: "https://github.com/pop4959/Chunky/releases/download/1.4.19/Chunky-Bukkit-1.4.19.jar",
		version: "1.4.19",
		author: "pop4959",
		iconText: "CK",
	},
	{
		id: "worldedit",
		name: "WorldEdit",
		category: "building",
		description: "Fast in-game Minecraft map editor. Quickly build, copy, paste, brush, and manipulate thousands of blocks.",
		filename: "worldedit-bukkit-7.3.9.jar",
		downloadUrl: "https://mediafilez.forgecdn.net/files/5829/302/worldedit-bukkit-7.3.9.jar",
		version: "7.3.9",
		author: "EngineHub",
		iconText: "WE",
	},
	{
		id: "vault",
		name: "Vault",
		category: "economy",
		description: "Standard permissions, chat, and economy bridge API required by hundreds of gameplay and shop plugins.",
		filename: "Vault.jar",
		downloadUrl: "https://github.com/MilkBowl/Vault/releases/download/1.7.3/Vault.jar",
		version: "1.7.3",
		author: "MilkBowl",
		iconText: "VT",
	},
	{
		id: "spark",
		name: "spark (Profiler)",
		category: "performance",
		description: "High-performance diagnostic profiler for CPU usage, memory leaks, garbage collection, and tick health.",
		filename: "spark-1.10.119-bukkit.jar",
		downloadUrl: "https://ci.lucko.me/job/spark/lastSuccessfulBuild/artifact/spark-bukkit/build/libs/spark-1.10.119-bukkit.jar",
		version: "1.10.119",
		author: "Luck",
		iconText: "SP",
	},
	{
		id: "skinsrestorer",
		name: "SkinsRestorer",
		category: "utility",
		description: "Restores player skins for servers running in offline or BungeeCord / Velocity hybrid networks.",
		filename: "SkinsRestorer.jar",
		downloadUrl: "https://github.com/SkinsRestorer/SkinsRestorerX/releases/download/15.4.1/SkinsRestorer.jar",
		version: "15.4.1",
		author: "SkinsRestorer Team",
		iconText: "SR",
	},
];

/**
 * Installs a plugin into the game server container
 */
export const installGamePlugin = async (
	containerId: string,
	downloadUrl: string,
	filename: string,
	targetDir = "/data/plugins",
	serverId?: string,
): Promise<{ success: boolean; message: string }> => {
	const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "");
	const command = `docker exec -i ${containerId} sh -c "mkdir -p ${targetDir} && (curl -sSL -o '${targetDir}/${sanitizedFilename}' '${downloadUrl}' || wget -q -O '${targetDir}/${sanitizedFilename}' '${downloadUrl}')"`;

	try {
		if (serverId) {
			await execAsyncRemote(serverId, command);
		} else {
			await execAsync(command);
		}
		return { success: true, message: `Successfully installed ${sanitizedFilename}` };
	} catch (err) {
		return {
			success: false,
			message: err instanceof Error ? err.message : "Installation failed",
		};
	}
};

/**
 * Lists installed plugin filenames in the container
 */
export const listInstalledGamePlugins = async (
	containerId: string,
	targetDir = "/data/plugins",
	serverId?: string,
): Promise<string[]> => {
	const command = `docker exec -i ${containerId} sh -c "ls -1 ${targetDir} 2>/dev/null || true"`;

	try {
		const { stdout } = serverId
			? await execAsyncRemote(serverId, command)
			: await execAsync(command);

		if (!stdout) return [];
		return stdout
			.trim()
			.split("\n")
			.map((s) => s.trim())
			.filter((s) => s.endsWith(".jar") || s.endsWith(".cs") || s.endsWith(".lua"));
	} catch {
		return [];
	}
};

/**
 * Deletes an installed plugin from the container
 */
export const deleteGamePlugin = async (
	containerId: string,
	filename: string,
	targetDir = "/data/plugins",
	serverId?: string,
): Promise<{ success: boolean; message: string }> => {
	const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "");
	const command = `docker exec -i ${containerId} sh -c "rm -f '${targetDir}/${sanitizedFilename}'"`;

	try {
		if (serverId) {
			await execAsyncRemote(serverId, command);
		} else {
			await execAsync(command);
		}
		return { success: true, message: `Removed ${sanitizedFilename}` };
	} catch (err) {
		return {
			success: false,
			message: err instanceof Error ? err.message : "Deletion failed",
		};
	}
};

/**
 * Reads and parses /data/server.properties
 */
export const readServerProperties = async (
	containerId: string,
	filePath = "/data/server.properties",
	serverId?: string,
): Promise<Record<string, string>> => {
	const command = `docker exec -i ${containerId} cat "${filePath}" 2>/dev/null || true`;

	try {
		const { stdout } = serverId
			? await execAsyncRemote(serverId, command)
			: await execAsync(command);

		if (!stdout) return {};

		const props: Record<string, string> = {};
		const lines = stdout.split("\n");

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const idx = trimmed.indexOf("=");
			if (idx > 0) {
				const key = trimmed.slice(0, idx).trim();
				const val = trimmed.slice(idx + 1).trim();
				props[key] = val;
			}
		}

		return props;
	} catch {
		return {};
	}
};

/**
 * Writes updated properties to /data/server.properties
 */
export const writeServerProperties = async (
	containerId: string,
	properties: Record<string, string>,
	filePath = "/data/server.properties",
	serverId?: string,
): Promise<{ success: boolean; message: string }> => {
	// Read existing file to preserve comments if possible
	const existing = await readServerProperties(containerId, filePath, serverId);
	const merged = { ...existing, ...properties };

	let output = "# Minecraft server properties generated by RylixManager\n";
	for (const [key, val] of Object.entries(merged)) {
		output += `${key}=${val}\n`;
	}

	const base64Content = Buffer.from(output, "utf8").toString("base64");
	const command = `docker exec -i ${containerId} sh -c "echo '${base64Content}' | base64 -d > '${filePath}'"`;

	try {
		if (serverId) {
			await execAsyncRemote(serverId, command);
		} else {
			await execAsync(command);
		}
		return { success: true, message: "Server properties updated successfully" };
	} catch (err) {
		return {
			success: false,
			message: err instanceof Error ? err.message : "Failed to write properties",
		};
	}
};
