import { parse } from "toml";
import { GAME_SERVER_TEMPLATES } from "./game-servers";

/**
 * Complete template interface that includes both metadata and configuration
 */
export interface CompleteTemplate {
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
	variables: {
		[key: string]: string;
	};
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
}

interface TemplateMetadata {
	id: string;
	name: string;
	description: string;
	version: string;
	logo: string;
	links: {
		github: string;
		website?: string;
		docs?: string;
	};
	tags: string[];
}

/**
 * Fetches the list of available templates from meta.json and merges built-in game server blueprints
 */
export async function fetchTemplatesList(
	baseUrl = "https://templates.dokploy.com",
): Promise<TemplateMetadata[]> {
	const gameTemplates: TemplateMetadata[] = Object.values(
		GAME_SERVER_TEMPLATES,
	).map((g) => ({
		id: g.metadata.id,
		name: g.metadata.name,
		description: g.metadata.description,
		version: g.metadata.version,
		logo: g.metadata.logo,
		links: g.metadata.links,
		tags: g.metadata.tags,
	}));

	try {
		const response = await fetch(`${baseUrl}/meta.json`, {
			signal: AbortSignal.timeout(8000),
		});
		if (response.ok) {
			const remoteTemplates = (await response.json()) as TemplateMetadata[];
			const mappedRemote = remoteTemplates.map((template) => ({
				id: template.id,
				name: template.name,
				description: template.description,
				version: template.version,
				logo: template.logo,
				links: template.links,
				tags: template.tags,
			}));
			return [...gameTemplates, ...mappedRemote];
		}
	} catch (err) {
		console.warn("Using built-in game server blueprints and local templates:", err);
	}

	return gameTemplates;
}

const LOGO_MIME_TYPES: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	svg: "image/svg+xml",
	webp: "image/webp",
	gif: "image/gif",
};

export async function fetchTemplateLogo(
	templateId: string,
	baseUrl = "https://templates.dokploy.com",
): Promise<string | null> {
	if (GAME_SERVER_TEMPLATES[templateId]) {
		return GAME_SERVER_TEMPLATES[templateId].logoSvgDataUri;
	}

	try {
		const templates = await fetchTemplatesList(baseUrl);
		const template = templates.find((t) => t.id === templateId);
		if (!template?.logo) return null;

		const response = await fetch(
			`${baseUrl}/blueprints/${templateId}/${template.logo}`,
			{ signal: AbortSignal.timeout(10000) },
		);
		if (!response.ok) return null;

		const buffer = Buffer.from(await response.arrayBuffer());
		if (buffer.length === 0) return null;

		const contentType = response.headers.get("content-type")?.split(";")[0];
		const extension = template.logo.split(".").pop()?.toLowerCase() ?? "";
		const mimeType = contentType?.startsWith("image/")
			? contentType
			: LOGO_MIME_TYPES[extension];
		if (!mimeType) return null;

		const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
		if (dataUrl.length > 2 * 1024 * 1024) return null;

		return dataUrl;
	} catch {
		return null;
	}
}

/**
 * Fetches a specific template's files (returns built-in Game Server blueprint if matched)
 */
export async function fetchTemplateFiles(
	templateId: string,
	baseUrl = "https://templates.dokploy.com",
): Promise<{ config: CompleteTemplate; dockerCompose: string }> {
	if (GAME_SERVER_TEMPLATES[templateId]) {
		const server = GAME_SERVER_TEMPLATES[templateId];
		const config: CompleteTemplate = {
			metadata: server.metadata,
			variables: server.variables,
			config: server.config,
		};
		return { config, dockerCompose: server.dockerCompose };
	}

	const timeout = AbortSignal.timeout(10000);
	const [templateYmlResponse, dockerComposeResponse] = await Promise.all([
		fetch(`${baseUrl}/blueprints/${templateId}/template.toml`, {
			signal: timeout,
		}),
		fetch(`${baseUrl}/blueprints/${templateId}/docker-compose.yml`, {
			signal: timeout,
		}),
	]);

	if (!templateYmlResponse.ok || !dockerComposeResponse.ok) {
		throw new Error("Template files not found");
	}

	const [templateYml, dockerCompose] = await Promise.all([
		templateYmlResponse.text(),
		dockerComposeResponse.text(),
	]);

	const config = parse(templateYml) as CompleteTemplate;

	return { config, dockerCompose };
}
