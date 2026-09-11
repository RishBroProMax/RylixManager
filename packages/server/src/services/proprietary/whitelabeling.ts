import { IS_CLOUD } from "@dokploy/server/constants";
import { db } from "@dokploy/server/db";
import { hasValidLicense } from "@dokploy/server/services/proprietary/license-key";
import { getWebServerSettings } from "@dokploy/server/services/web-server-settings";

export interface PublicWhitelabelingConfig {
	appName: string | null;
	appDescription: string | null;
	logoUrl: string | null;
	loginLogoUrl: string | null;
	faviconUrl: string | null;
	customCss: string | null;
	metaTitle: string | null;
	errorPageTitle: string | null;
	errorPageDescription: string | null;
	footerText: string | null;
}

// Self-hosted is single-tenant; gate on the oldest organization's license,
// mirroring resolveLocalConcurrency in server/queues/concurrency.ts. Used only
// for unauthenticated requests (no active organization in session).
const hasAnyValidLicense = async (): Promise<boolean> => {
	const org = await db.query.organization.findFirst({
		columns: { id: true },
		orderBy: (organization, { asc }) => [asc(organization.createdAt)],
	});
	return org ? await hasValidLicense(org.id) : false;
};

/**
 * Public whitelabeling config for unauthenticated contexts (login page, SSR
 * document shell). No active organization/session is available here.
 */
export const getPublicWhitelabelingConfig =
	async (): Promise<PublicWhitelabelingConfig | null> => {
		if (IS_CLOUD) {
			return null;
		}
		if (!(await hasAnyValidLicense())) {
			return null;
		}
		const settings = await getWebServerSettings();
		const config = settings?.whitelabelingConfig;

		return {
			appName: config?.appName || "RylixManager",
			appDescription: config?.appDescription || "Modern VPS & Container Management Platform",
			logoUrl: config?.logoUrl || null,
			loginLogoUrl: config?.loginLogoUrl || null,
			faviconUrl: config?.faviconUrl || null,
			customCss: config?.customCss || null,
			metaTitle: config?.metaTitle || "RylixManager",
			errorPageTitle: config?.errorPageTitle || "RylixManager",
			errorPageDescription: config?.errorPageDescription || null,
			footerText: config?.footerText || null,
		};
	};
