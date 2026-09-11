import type { CompleteTemplate } from "./github";

export interface GameServerDefinition {
	metadata: {
		id: string;
		name: string;
		description: string;
		tags: string[];
		version: string;
		logo: string;
		links: {
			github: string;
			website?: string;
			docs?: string;
		};
	};
	logoSvgDataUri: string;
	variables: Record<string, string>;
	config: {
		isolated?: boolean;
		domains: Array<{
			serviceName: string;
			port: number;
			path?: string;
			host?: string;
		}>;
		env: Record<string, string>;
		mounts?: Array<{
			filePath: string;
			content: string;
		}>;
	};
	dockerCompose: string;
	portMatrix: Array<{
		port: number;
		protocol: "TCP" | "UDP" | "TCP/UDP";
		description: string;
	}>;
	recommendedRam: string;
}

const GAMEPAD_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`;

export const GAME_SERVER_TEMPLATES: Record<string, GameServerDefinition> = {
	minecraft: {
		metadata: {
			id: "minecraft",
			name: "Minecraft (Java Edition)",
			description:
				"High-performance Minecraft Java server powered by itzg/minecraft-server with PaperMC, Spigot, Fabric, or Vanilla support.",
			tags: ["Games", "Game Servers", "Minecraft", "Java", "PaperMC"],
			version: "1.21+",
			logo: "logo.svg",
			links: {
				github: "https://github.com/itzg/docker-minecraft-server",
				website: "https://www.minecraft.net",
				docs: "https://docker-minecraft-server.readthedocs.io",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "4GB - 8GB",
		portMatrix: [
			{ port: 25565, protocol: "TCP", description: "Game Client Connection" },
			{ port: 25575, protocol: "TCP", description: "Remote Console (RCON)" },
		],
		variables: {
			SERVER_NAME: "Rylix Minecraft Server",
			MOTD: "A modern Minecraft server hosted with RylixManager",
			MEMORY: "4G",
			TYPE: "PAPER",
			DIFFICULTY: "normal",
			MAX_PLAYERS: "20",
			RCON_PASSWORD: "${password:16}",
		},
		config: {
			domains: [],
			env: {
				EULA: "TRUE",
				TYPE: "${TYPE}",
				VERSION: "LATEST",
				MEMORY: "${MEMORY}",
				SERVER_NAME: "${SERVER_NAME}",
				MOTD: "${MOTD}",
				DIFFICULTY: "${DIFFICULTY}",
				MAX_PLAYERS: "${MAX_PLAYERS}",
				ONLINE_MODE: "TRUE",
				ENABLE_RCON: "true",
				RCON_PASSWORD: "${RCON_PASSWORD}",
				RCON_PORT: "25575",
				VIEW_DISTANCE: "10",
			},
		},
		dockerCompose: `version: "3.8"
services:
  minecraft:
    image: itzg/minecraft-server:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "25565:25565"
      - "25575:25575"
    environment:
      EULA: "\${EULA:-TRUE}"
      TYPE: "\${TYPE:-PAPER}"
      VERSION: "\${VERSION:-LATEST}"
      MEMORY: "\${MEMORY:-4G}"
      SERVER_NAME: "\${SERVER_NAME:-Rylix Minecraft Server}"
      MOTD: "\${MOTD:-Hosted on RylixManager}"
      DIFFICULTY: "\${DIFFICULTY:-normal}"
      MAX_PLAYERS: "\${MAX_PLAYERS:-20}"
      ONLINE_MODE: "\${ONLINE_MODE:-TRUE}"
      ENABLE_RCON: "\${ENABLE_RCON:-true}"
      RCON_PASSWORD: "\${RCON_PASSWORD}"
      RCON_PORT: "\${RCON_PORT:-25575}"
      VIEW_DISTANCE: "\${VIEW_DISTANCE:-10}"
    volumes:
      - minecraft_data:/data
    tty: true
    stdin_open: true

volumes:
  minecraft_data:
`,
	},

	"minecraft-bedrock": {
		metadata: {
			id: "minecraft-bedrock",
			name: "Minecraft (Bedrock Edition)",
			description:
				"Official dedicated server for Minecraft Bedrock (Mobile iOS/Android, Windows, Xbox, PlayStation, Nintendo Switch cross-play).",
			tags: ["Games", "Game Servers", "Minecraft", "Bedrock", "Crossplay"],
			version: "Latest",
			logo: "logo.svg",
			links: {
				github: "https://github.com/itzg/docker-minecraft-bedrock-server",
				website: "https://www.minecraft.net",
				docs: "https://github.com/itzg/docker-minecraft-bedrock-server",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "2GB - 4GB",
		portMatrix: [
			{ port: 19132, protocol: "UDP", description: "Bedrock Client Connection (IPv4)" },
			{ port: 19133, protocol: "UDP", description: "Bedrock Client Connection (IPv6)" },
		],
		variables: {
			SERVER_NAME: "Rylix Bedrock Server",
			GAMEMODE: "survival",
			DIFFICULTY: "normal",
			MAX_PLAYERS: "10",
		},
		config: {
			domains: [],
			env: {
				EULA: "TRUE",
				SERVER_NAME: "${SERVER_NAME}",
				GAMEMODE: "${GAMEMODE}",
				DIFFICULTY: "${DIFFICULTY}",
				MAX_PLAYERS: "${MAX_PLAYERS}",
				ALLOW_CHEATS: "false",
				ONLINE_MODE: "true",
			},
		},
		dockerCompose: `version: "3.8"
services:
  bedrock:
    image: itzg/minecraft-bedrock-server:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "19132:19132/udp"
      - "19133:19133/udp"
    environment:
      EULA: "\${EULA:-TRUE}"
      SERVER_NAME: "\${SERVER_NAME:-Rylix Bedrock Server}"
      GAMEMODE: "\${GAMEMODE:-survival}"
      DIFFICULTY: "\${DIFFICULTY:-normal}"
      MAX_PLAYERS: "\${MAX_PLAYERS:-10}"
      ALLOW_CHEATS: "\${ALLOW_CHEATS:-false}"
      ONLINE_MODE: "\${ONLINE_MODE:-true}"
    volumes:
      - bedrock_data:/data
    stdin_open: true
    tty: true

volumes:
  bedrock_data:
`,
	},

	rust: {
		metadata: {
			id: "rust",
			name: "Rust Dedicated Server",
			description:
				"Production-ready Rust game server with automatic SteamCMD updates, RCON management, and uMod/Oxide plugin support.",
			tags: ["Games", "Game Servers", "Rust", "SteamCMD", "Survival"],
			version: "Latest",
			logo: "logo.svg",
			links: {
				github: "https://github.com/Didstopia/rust-server",
				website: "https://rust.facepunch.com",
				docs: "https://github.com/Didstopia/rust-server#readme",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "8GB - 16GB",
		portMatrix: [
			{ port: 28015, protocol: "UDP", description: "Game Connection" },
			{ port: 28016, protocol: "TCP", description: "RCON Remote Console" },
			{ port: 8080, protocol: "TCP", description: "Rust+ Companion App" },
		],
		variables: {
			RUST_SERVER_NAME: "Rylix Rust Server",
			RUST_SERVER_DESCRIPTION: "High performance Rust server powered by RylixManager",
			RUST_SERVER_WORLDSIZE: "3000",
			RUST_SERVER_MAXPLAYERS: "50",
			RUST_RCON_PASSWORD: "${password:16}",
		},
		config: {
			domains: [],
			env: {
				RUST_SERVER_NAME: "${RUST_SERVER_NAME}",
				RUST_SERVER_DESCRIPTION: "${RUST_SERVER_DESCRIPTION}",
				RUST_SERVER_WORLDSIZE: "${RUST_SERVER_WORLDSIZE}",
				RUST_SERVER_MAXPLAYERS: "${RUST_SERVER_MAXPLAYERS}",
				RUST_RCON_PORT: "28016",
				RUST_RCON_PASSWORD: "${RUST_RCON_PASSWORD}",
				RUST_SERVER_PORT: "28015",
				RUST_APP_PORT: "8080",
				RUST_UPDATE_CHECKING: "1",
				RUST_OXIDE_ENABLED: "0",
			},
		},
		dockerCompose: `version: "3.8"
services:
  rust:
    image: didstopia/rust-server:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "28015:28015/udp"
      - "28016:28016"
      - "8080:8080"
    environment:
      RUST_SERVER_NAME: "\${RUST_SERVER_NAME:-Rylix Rust Server}"
      RUST_SERVER_DESCRIPTION: "\${RUST_SERVER_DESCRIPTION:-Hosted on RylixManager}"
      RUST_SERVER_WORLDSIZE: "\${RUST_SERVER_WORLDSIZE:-3000}"
      RUST_SERVER_MAXPLAYERS: "\${RUST_SERVER_MAXPLAYERS:-50}"
      RUST_RCON_PORT: "\${RUST_RCON_PORT:-28016}"
      RUST_RCON_PASSWORD: "\${RUST_RCON_PASSWORD}"
      RUST_SERVER_PORT: "\${RUST_SERVER_PORT:-28015}"
      RUST_APP_PORT: "\${RUST_APP_PORT:-8080}"
      RUST_UPDATE_CHECKING: "1"
    volumes:
      - rust_data:/steamcmd/rust
    stop_grace_period: 2m

volumes:
  rust_data:
`,
	},

	palworld: {
		metadata: {
			id: "palworld",
			name: "Palworld Dedicated Server",
			description:
				"Dedicated multiplayer server for Palworld with automated backups, multi-threaded CPU acceleration, and SteamCMD updates.",
			tags: ["Games", "Game Servers", "Palworld", "SteamCMD", "Multiplayer"],
			version: "Latest",
			logo: "logo.svg",
			links: {
				github: "https://github.com/thijsvanloef/palworld-server-docker",
				website: "https://www.pocketpair.jp/palworld",
				docs: "https://github.com/thijsvanloef/palworld-server-docker",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "8GB - 16GB",
		portMatrix: [
			{ port: 8211, protocol: "UDP", description: "Game Connection" },
			{ port: 27015, protocol: "UDP", description: "Query Port" },
			{ port: 25575, protocol: "TCP", description: "RCON Remote Console" },
		],
		variables: {
			SERVER_NAME: "Rylix Palworld Server",
			SERVER_DESCRIPTION: "Dedicated Palworld server managed by RylixManager",
			SERVER_PASSWORD: "",
			ADMIN_PASSWORD: "${password:16}",
			MAX_PLAYERS: "32",
		},
		config: {
			domains: [],
			env: {
				SERVER_NAME: "${SERVER_NAME}",
				SERVER_DESCRIPTION: "${SERVER_DESCRIPTION}",
				SERVER_PASSWORD: "${SERVER_PASSWORD}",
				ADMIN_PASSWORD: "${ADMIN_PASSWORD}",
				PLAYERS: "${MAX_PLAYERS}",
				MULTITHREADING: "true",
				COMMUNITY: "false",
				UPDATE_ON_BOOT: "true",
				RCON_ENABLED: "true",
				RCON_PORT: "25575",
			},
		},
		dockerCompose: `version: "3.8"
services:
  palworld:
    image: thijsvanloef/palworld-server-docker:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "8211:8211/udp"
      - "27015:27015/udp"
      - "25575:25575"
    environment:
      SERVER_NAME: "\${SERVER_NAME:-Rylix Palworld Server}"
      SERVER_DESCRIPTION: "\${SERVER_DESCRIPTION:-Managed by RylixManager}"
      SERVER_PASSWORD: "\${SERVER_PASSWORD:-}"
      ADMIN_PASSWORD: "\${ADMIN_PASSWORD}"
      PLAYERS: "\${PLAYERS:-32}"
      MULTITHREADING: "true"
      COMMUNITY: "\${COMMUNITY:-false}"
      UPDATE_ON_BOOT: "true"
      RCON_ENABLED: "true"
      RCON_PORT: "25575"
    volumes:
      - palworld_data:/palworld

volumes:
  palworld_data:
`,
	},

	valheim: {
		metadata: {
			id: "valheim",
			name: "Valheim Dedicated Server",
			description:
				"High performance Valheim Viking survival server with automatic world backups, Crossplay (PC + Xbox), and Discord webhook integration.",
			tags: ["Games", "Game Servers", "Valheim", "Survival", "Crossplay"],
			version: "Latest",
			logo: "logo.svg",
			links: {
				github: "https://github.com/lloesche/valheim-server-docker",
				website: "https://www.valheimgame.com",
				docs: "https://github.com/lloesche/valheim-server-docker#readme",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "4GB - 8GB",
		portMatrix: [
			{ port: 2456, protocol: "UDP", description: "Valheim Main Game Port" },
			{ port: 2457, protocol: "UDP", description: "Steam Query Port" },
		],
		variables: {
			SERVER_NAME: "Rylix Valheim Server",
			WORLD_NAME: "RylixWorld",
			SERVER_PASS: "${password:8}",
		},
		config: {
			domains: [],
			env: {
				SERVER_NAME: "${SERVER_NAME}",
				WORLD_NAME: "${WORLD_NAME}",
				SERVER_PASS: "${SERVER_PASS}",
				SERVER_PUBLIC: "1",
				CROSSPLAY: "true",
				AUTO_UPDATE: "1",
				BACKUPS: "true",
			},
		},
		dockerCompose: `version: "3.8"
services:
  valheim:
    image: lloesche/valheim-server:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "2456:2456/udp"
      - "2457:2457/udp"
    environment:
      SERVER_NAME: "\${SERVER_NAME:-Rylix Valheim Server}"
      WORLD_NAME: "\${WORLD_NAME:-RylixWorld}"
      SERVER_PASS: "\${SERVER_PASS}"
      SERVER_PUBLIC: "1"
      CROSSPLAY: "true"
      AUTO_UPDATE: "1"
      BACKUPS: "true"
    volumes:
      - valheim_data:/config
    stop_grace_period: 2m

volumes:
  valheim_data:
`,
	},

	terraria: {
		metadata: {
			id: "terraria",
			name: "Terraria Dedicated Server (TShock)",
			description:
				"Fast and lightweight Terraria 2D sandbox dedicated server running TShock for plugin management, anti-cheat, and permissions.",
			tags: ["Games", "Game Servers", "Terraria", "Sandbox", "TShock"],
			version: "Latest",
			logo: "logo.svg",
			links: {
				github: "https://github.com/beardedio/terraria",
				website: "https://terraria.org",
				docs: "https://tshock.readme.io",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "2GB - 4GB",
		portMatrix: [
			{ port: 7777, protocol: "TCP", description: "Terraria Game Connection" },
		],
		variables: {
			WORLD_NAME: "RylixWorld",
			SERVER_PASSWORD: "",
			MAX_PLAYERS: "16",
			DIFFICULTY: "1",
		},
		config: {
			domains: [],
			env: {
				WORLD_NAME: "${WORLD_NAME}",
				SERVER_PASSWORD: "${SERVER_PASSWORD}",
				MAX_PLAYERS: "${MAX_PLAYERS}",
				DIFFICULTY: "${DIFFICULTY}",
				AUTOCREATE: "2",
			},
		},
		dockerCompose: `version: "3.8"
services:
  terraria:
    image: beardedio/terraria:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "7777:7777"
    environment:
      WORLD_NAME: "\${WORLD_NAME:-RylixWorld}"
      SERVER_PASSWORD: "\${SERVER_PASSWORD:-}"
      MAX_PLAYERS: "\${MAX_PLAYERS:-16}"
      DIFFICULTY: "\${DIFFICULTY:-1}"
      AUTOCREATE: "2"
    volumes:
      - terraria_data:/root/.local/share/Terraria/Worlds

volumes:
  terraria_data:
`,
	},

	cs2: {
		metadata: {
			id: "cs2",
			name: "Counter-Strike 2 (CS2)",
			description:
				"High-tick Counter-Strike 2 dedicated game server with Valve SteamCMD, custom workshop maps, and competitive configuration.",
			tags: ["Games", "Game Servers", "CS2", "Shooter", "FPS", "Valve"],
			version: "Source 2",
			logo: "logo.svg",
			links: {
				github: "https://github.com/joedrumgoole/cs2",
				website: "https://www.counter-strike.net/cs2",
				docs: "https://developer.valvesoftware.com/wiki/Counter-Strike_2/Dedicated_Servers",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "6GB - 12GB",
		portMatrix: [
			{ port: 27015, protocol: "TCP/UDP", description: "Game Traffic & Query" },
		],
		variables: {
			CS2_SERVERNAME: "Rylix CS2 Server",
			CS2_STARTMAP: "de_dust2",
			CS2_MAXPLAYERS: "16",
			CS2_RCON_PW: "${password:16}",
			CS2_PW: "",
		},
		config: {
			domains: [],
			env: {
				CS2_SERVERNAME: "${CS2_SERVERNAME}",
				CS2_STARTMAP: "${CS2_STARTMAP}",
				CS2_MAXPLAYERS: "${CS2_MAXPLAYERS}",
				CS2_RCON_PW: "${CS2_RCON_PW}",
				CS2_PW: "${CS2_PW}",
				CS2_GAME_TYPE: "0",
				CS2_GAME_MODE: "1",
			},
		},
		dockerCompose: `version: "3.8"
services:
  cs2:
    image: joedrumgoole/cs2:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "27015:27015/tcp"
      - "27015:27015/udp"
    environment:
      CS2_SERVERNAME: "\${CS2_SERVERNAME:-Rylix CS2 Server}"
      CS2_STARTMAP: "\${CS2_STARTMAP:-de_dust2}"
      CS2_MAXPLAYERS: "\${CS2_MAXPLAYERS:-16}"
      CS2_RCON_PW: "\${CS2_RCON_PW}"
      CS2_PW: "\${CS2_PW:-}"
      CS2_GAME_TYPE: "0"
      CS2_GAME_MODE: "1"
    volumes:
      - cs2_data:/home/steam/cs2-dedicated

volumes:
  cs2_data:
`,
	},

	ark: {
		metadata: {
			id: "ark",
			name: "ARK: Survival Evolved",
			description:
				"Dedicated ARK dinosaur survival server with RCON console management, custom map selection, and SteamCMD automatic updates.",
			tags: ["Games", "Game Servers", "ARK", "Survival", "SteamCMD"],
			version: "Latest",
			logo: "logo.svg",
			links: {
				github: "https://github.com/Hermsi1337/docker-ark-server",
				website: "https://playark.com",
				docs: "https://ark.wiki.gg/wiki/Dedicated_server_setup",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "8GB - 16GB",
		portMatrix: [
			{ port: 7777, protocol: "UDP", description: "Raw Game Port" },
			{ port: 7778, protocol: "UDP", description: "Raw Game Port + 1" },
			{ port: 27015, protocol: "UDP", description: "Steam Query Port" },
			{ port: 27020, protocol: "TCP", description: "RCON Remote Console" },
		],
		variables: {
			SESSION_NAME: "Rylix ARK Server",
			SERVER_MAP: "TheIsland",
			SERVER_PASSWORD: "",
			ADMIN_PASSWORD: "${password:16}",
			MAX_PLAYERS: "30",
		},
		config: {
			domains: [],
			env: {
				SESSION_NAME: "${SESSION_NAME}",
				SERVER_MAP: "${SERVER_MAP}",
				SERVER_PASSWORD: "${SERVER_PASSWORD}",
				ADMIN_PASSWORD: "${ADMIN_PASSWORD}",
				MAX_PLAYERS: "${MAX_PLAYERS}",
				UPDATE_ON_START: "true",
			},
		},
		dockerCompose: `version: "3.8"
services:
  ark:
    image: hermsi/ark-server:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "7777:7777/udp"
      - "7778:7778/udp"
      - "27015:27015/udp"
      - "27020:27020"
    environment:
      SESSION_NAME: "\${SESSION_NAME:-Rylix ARK Server}"
      SERVER_MAP: "\${SERVER_MAP:-TheIsland}"
      SERVER_PASSWORD: "\${SERVER_PASSWORD:-}"
      ADMIN_PASSWORD: "\${ADMIN_PASSWORD}"
      MAX_PLAYERS: "\${MAX_PLAYERS:-30}"
      UPDATE_ON_START: "true"
    volumes:
      - ark_data:/app

volumes:
  ark_data:
`,
	},

	factorio: {
		metadata: {
			id: "factorio",
			name: "Factorio Headless Server",
			description:
				"Autonomous headless Factorio factory automation game server with auto-save retention, pause-when-empty, and mod management.",
			tags: ["Games", "Game Servers", "Factorio", "Automation", "Co-op"],
			version: "Stable",
			logo: "logo.svg",
			links: {
				github: "https://github.com/factoriotools/factorio-docker",
				website: "https://factorio.com",
				docs: "https://wiki.factorio.com/Multiplayer",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "2GB - 4GB",
		portMatrix: [
			{ port: 34197, protocol: "UDP", description: "Game Traffic" },
			{ port: 27015, protocol: "TCP", description: "RCON Management" },
		],
		variables: {
			UPDATE_MODS_ON_START: "true",
			RCON_PASSWORD: "${password:16}",
		},
		config: {
			domains: [],
			env: {
				UPDATE_MODS_ON_START: "${UPDATE_MODS_ON_START}",
				RCON_PASSWORD: "${RCON_PASSWORD}",
			},
		},
		dockerCompose: `version: "3.8"
services:
  factorio:
    image: factoriotools/factorio:stable
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "34197:34197/udp"
      - "27015:27015"
    environment:
      UPDATE_MODS_ON_START: "\${UPDATE_MODS_ON_START:-true}"
      RCON_PASSWORD: "\${RCON_PASSWORD}"
    volumes:
      - factorio_data:/factorio

volumes:
  factorio_data:
`,
	},

	satisfactory: {
		metadata: {
			id: "satisfactory",
			name: "Satisfactory Dedicated Server",
			description:
				"Official Satisfactory dedicated server with automatic save backups, auto-pause when players disconnect, and SteamCMD sync.",
			tags: ["Games", "Game Servers", "Satisfactory", "Automation", "Co-op"],
			version: "Latest",
			logo: "logo.svg",
			links: {
				github: "https://github.com/wolveix/satisfactory-server",
				website: "https://www.satisfactorygame.com",
				docs: "https://satisfactory.wiki.gg/wiki/Dedicated_servers",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "8GB - 16GB",
		portMatrix: [
			{ port: 7777, protocol: "UDP", description: "Game & Query Port" },
		],
		variables: {
			MAXPLAYERS: "8",
			AUTOPAUSE: "true",
			AUTOSAVENUM: "5",
		},
		config: {
			domains: [],
			env: {
				MAXPLAYERS: "${MAXPLAYERS}",
				AUTOPAUSE: "${AUTOPAUSE}",
				AUTOSAVENUM: "${AUTOSAVENUM}",
			},
		},
		dockerCompose: `version: "3.8"
services:
  satisfactory:
    image: wolveix/satisfactory-server:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "7777:7777/udp"
    environment:
      MAXPLAYERS: "\${MAXPLAYERS:-8}"
      AUTOPAUSE: "\${AUTOPAUSE:-true}"
      AUTOSAVENUM: "\${AUTOSAVENUM:-5}"
    volumes:
      - satisfactory_data:/config

volumes:
  satisfactory_data:
`,
	},

	zomboid: {
		metadata: {
			id: "zomboid",
			name: "Project Zomboid Server",
			description:
				"Multiplayer zombie apocalypse survival server for Project Zomboid with customizable sandbox settings and SteamCMD integration.",
			tags: ["Games", "Game Servers", "Project Zomboid", "Survival", "Zombies"],
			version: "Latest",
			logo: "logo.svg",
			links: {
				github: "https://github.com/Renegade-Master/zomboid-dedicated-server",
				website: "https://projectzomboid.com",
				docs: "https://pzwiki.net/wiki/Dedicated_Server",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "4GB - 8GB",
		portMatrix: [
			{ port: 16261, protocol: "UDP", description: "Default Game Port" },
			{ port: 16262, protocol: "UDP", description: "Direct Connection Port" },
		],
		variables: {
			SERVER_NAME: "RylixZomboid",
			SERVER_PASSWORD: "",
			ADMIN_PASSWORD: "${password:16}",
		},
		config: {
			domains: [],
			env: {
				SERVER_NAME: "${SERVER_NAME}",
				SERVER_PASSWORD: "${SERVER_PASSWORD}",
				ADMIN_PASSWORD: "${ADMIN_PASSWORD}",
			},
		},
		dockerCompose: `version: "3.8"
services:
  zomboid:
    image: renegademaster/zomboid-dedicated-server:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "16261:16261/udp"
      - "16262:16262/udp"
    environment:
      SERVER_NAME: "\${SERVER_NAME:-RylixZomboid}"
      SERVER_PASSWORD: "\${SERVER_PASSWORD:-}"
      ADMIN_PASSWORD: "\${ADMIN_PASSWORD}"
    volumes:
      - zomboid_data:/home/steam/Zomboid

volumes:
  zomboid_data:
`,
	},

	enshrouded: {
		metadata: {
			id: "enshrouded",
			name: "Enshrouded Dedicated Server",
			description:
				"Dedicated server for Enshrouded, the action RPG survival crafting game, with automatic updates and custom world persistence.",
			tags: ["Games", "Game Servers", "Enshrouded", "RPG", "Survival"],
			version: "Latest",
			logo: "logo.svg",
			links: {
				github: "https://github.com/mizuka-wu/enshrouded-server-docker",
				website: "https://enshrouded.com",
				docs: "https://enshrouded.zendesk.com/hc/en-001/articles/16055531950237",
			},
		},
		logoSvgDataUri: GAMEPAD_SVG,
		recommendedRam: "8GB - 16GB",
		portMatrix: [
			{ port: 15636, protocol: "UDP", description: "Game Connection Port" },
			{ port: 15637, protocol: "UDP", description: "Steam Query Port" },
		],
		variables: {
			SERVER_NAME: "Rylix Enshrouded Server",
			SERVER_PASSWORD: "",
			MAX_PLAYERS: "16",
		},
		config: {
			domains: [],
			env: {
				SERVER_NAME: "${SERVER_NAME}",
				SERVER_PASSWORD: "${SERVER_PASSWORD}",
				GAME_PORT: "15636",
				QUERY_PORT: "15637",
				MAX_PLAYERS: "${MAX_PLAYERS}",
			},
		},
		dockerCompose: `version: "3.8"
services:
  enshrouded:
    image: skaronator/enshrouded-server:latest
    container_name: \${APP_NAME}
    restart: unless-stopped
    ports:
      - "15636:15636/udp"
      - "15637:15637/udp"
    environment:
      SERVER_NAME: "\${SERVER_NAME:-Rylix Enshrouded Server}"
      SERVER_PASSWORD: "\${SERVER_PASSWORD:-}"
      GAME_PORT: "15636"
      QUERY_PORT: "15637"
      MAX_PLAYERS: "\${MAX_PLAYERS:-16}"
    volumes:
      - enshrouded_data:/home/steam/enshrouded-dedicated

volumes:
  enshrouded_data:
`,
	},
};
