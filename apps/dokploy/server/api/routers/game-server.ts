import {
	createGameWorldBackup,
	deleteGamePlugin,
	GAME_PLUGIN_CATALOG,
	GAME_PRESETS,
	getGameServerStats,
	installGamePlugin,
	listGameWorldBackups,
	listInstalledGamePlugins,
	readServerProperties,
	sendGameServerCommand,
	triggerGameSave,
	writeServerProperties,
} from "@dokploy/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { audit } from "@/server/api/utils/audit";

export const gameServerRouter = createTRPCRouter({
	getPresets: protectedProcedure.query(() => {
		return GAME_PRESETS;
	}),

	getStats: protectedProcedure
		.input(
			z.object({
				containerId: z.string().min(1),
				serverId: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			return await getGameServerStats(input.containerId, input.serverId);
		}),

	sendCommand: protectedProcedure
		.input(
			z.object({
				containerId: z.string().min(1),
				command: z.string().min(1),
				serverId: z.string().optional(),
				gameType: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await sendGameServerCommand(
				input.containerId,
				input.command,
				input.serverId,
				input.gameType,
			);

			await audit(ctx, {
				action: "update",
				resourceType: "compose",
				resourceId: input.containerId,
				resourceName: `game-cmd: ${input.command.slice(0, 30)}`,
			});

			return result;
		}),

	saveWorld: protectedProcedure
		.input(
			z.object({
				containerId: z.string().min(1),
				serverId: z.string().optional(),
				gameType: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await triggerGameSave(
				input.containerId,
				input.serverId,
				input.gameType,
			);

			await audit(ctx, {
				action: "update",
				resourceType: "compose",
				resourceId: input.containerId,
				resourceName: "game-save-world",
			});

			return result;
		}),

	createBackup: protectedProcedure
		.input(
			z.object({
				containerId: z.string().min(1),
				serverId: z.string().optional(),
				gameType: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await createGameWorldBackup(
				input.containerId,
				input.serverId,
				input.gameType,
			);

			await audit(ctx, {
				action: "create",
				resourceType: "compose",
				resourceId: input.containerId,
				resourceName: `game-world-backup: ${result.backupFile || "snapshot"}`,
			});

			return result;
		}),

	listBackups: protectedProcedure
		.input(
			z.object({
				containerId: z.string().min(1),
				serverId: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			return await listGameWorldBackups(input.containerId, input.serverId);
		}),

	getPluginCatalog: protectedProcedure.query(() => {
		return GAME_PLUGIN_CATALOG;
	}),

	listInstalledPlugins: protectedProcedure
		.input(
			z.object({
				containerId: z.string().min(1),
				targetDir: z.string().optional(),
				serverId: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			return await listInstalledGamePlugins(
				input.containerId,
				input.targetDir,
				input.serverId,
			);
		}),

	installPlugin: protectedProcedure
		.input(
			z.object({
				containerId: z.string().min(1),
				downloadUrl: z.string().url(),
				filename: z.string().min(1),
				targetDir: z.string().optional(),
				serverId: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await installGamePlugin(
				input.containerId,
				input.downloadUrl,
				input.filename,
				input.targetDir,
				input.serverId,
			);

			await audit(ctx, {
				action: "create",
				resourceType: "compose",
				resourceId: input.containerId,
				resourceName: `game-install-plugin: ${input.filename}`,
			});

			return result;
		}),

	deletePlugin: protectedProcedure
		.input(
			z.object({
				containerId: z.string().min(1),
				filename: z.string().min(1),
				targetDir: z.string().optional(),
				serverId: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await deleteGamePlugin(
				input.containerId,
				input.filename,
				input.targetDir,
				input.serverId,
			);

			await audit(ctx, {
				action: "delete",
				resourceType: "compose",
				resourceId: input.containerId,
				resourceName: `game-delete-plugin: ${input.filename}`,
			});

			return result;
		}),

	readProperties: protectedProcedure
		.input(
			z.object({
				containerId: z.string().min(1),
				filePath: z.string().optional(),
				serverId: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			return await readServerProperties(
				input.containerId,
				input.filePath,
				input.serverId,
			);
		}),

	writeProperties: protectedProcedure
		.input(
			z.object({
				containerId: z.string().min(1),
				properties: z.record(z.string()),
				filePath: z.string().optional(),
				serverId: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await writeServerProperties(
				input.containerId,
				input.properties,
				input.filePath,
				input.serverId,
			);

			await audit(ctx, {
				action: "update",
				resourceType: "compose",
				resourceId: input.containerId,
				resourceName: "game-update-properties",
			});

			return result;
		}),
});
