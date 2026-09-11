import {
	applyLinuxHardening,
	getAllDomainsWithProtection,
	getLinuxHardeningScript,
	getLinuxHostDiagnostics,
	processVercelAnalytics,
	readMainConfig,
	readMonitoringConfig,
	toggleDomainSecurityMiddleware,
	TRAFFIC_SECURITY_PROFILES,
	writeMainConfig,
} from "@dokploy/server";
import { TRPCError } from "@trpc/server";
import { parse, stringify } from "yaml";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { audit } from "@/server/api/utils/audit";

export const trafficRouter = createTRPCRouter({
	getProfiles: protectedProcedure.query(() => {
		return TRAFFIC_SECURITY_PROFILES;
	}),

	getDomainsProtection: protectedProcedure.query(async () => {
		return await getAllDomainsWithProtection();
	}),

	toggleProtection: protectedProcedure
		.input(
			z.object({
				domainId: z.string().min(1),
				middlewareId: z.string().min(1),
				enable: z.boolean(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await toggleDomainSecurityMiddleware(
				input.domainId,
				input.middlewareId,
				input.enable,
			);

			await audit(ctx, {
				action: "update",
				resourceType: "domain",
				resourceId: input.domainId,
				resourceName: `domain-protection:${input.middlewareId}`,
			});

			return result;
		}),

	getLinuxDiagnostics: protectedProcedure
		.input(
			z.object({
				serverId: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			return await getLinuxHostDiagnostics(input.serverId);
		}),

	getHardeningScript: protectedProcedure.query(() => {
		return getLinuxHardeningScript();
	}),

	applyHardening: protectedProcedure
		.input(
			z.object({
				serverId: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			await applyLinuxHardening(input.serverId);

			await audit(ctx, {
				action: "update",
				resourceType: "server",
				resourceId: input.serverId || "local-host",
				resourceName: "linux-kernel-hardening",
			});

			return { success: true, message: "Linux hardening successfully applied!" };
		}),

	getVercelAnalytics: protectedProcedure
		.input(
			z.object({
				dateRange: z
					.object({
						start: z.string().optional(),
						end: z.string().optional(),
					})
					.optional(),
				host: z.string().optional(),
				search: z.string().optional(),
				serverId: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			const mainConfig = readMainConfig();
			let isLoggingActive = false;
			if (mainConfig) {
				try {
					const parsed = parse(mainConfig) as {
						accessLog?: { filePath?: string };
					};
					isLoggingActive = !!parsed?.accessLog?.filePath;
				} catch {
					// unparseable
				}
			}

			const rawConfig = await readMonitoringConfig(true);
			const analytics = processVercelAnalytics(rawConfig as string, {
				dateRange: input.dateRange,
				host: input.host,
				search: input.search,
			});

			return {
				isLoggingActive,
				...analytics,
			};
		}),

	toggleAccessLogging: protectedProcedure
		.input(
			z.object({
				enable: z.boolean(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const mainConfig = readMainConfig();
			if (!mainConfig) return false;

			const currentConfig = parse(mainConfig) as {
				accessLog?: {
					filePath: string;
					format?: string;
					bufferingSize?: number;
				};
			};

			if (input.enable) {
				currentConfig.accessLog = {
					filePath: "/etc/dokploy/traefik/dynamic/access.log",
					format: "json",
					bufferingSize: 100,
				};
			} else {
				currentConfig.accessLog = undefined;
			}

			writeMainConfig(stringify(currentConfig));

			await audit(ctx, {
				action: "update",
				resourceType: "settings",
				resourceName: "toggle-traffic-analytics",
			});

			return true;
		}),
});
