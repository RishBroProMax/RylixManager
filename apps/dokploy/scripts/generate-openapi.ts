#!/usr/bin/env tsx

/**
 * Script to generate OpenAPI specification locally
 * This runs in CI/CD to generate the openapi.json file
 * which can then be consumed by the documentation website
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateOpenApiDocument } from "@dokploy/trpc-openapi";
import { appRouter } from "../server/api/root";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateOpenAPI() {
	try {
		console.log("🔄 Generating OpenAPI specification...");

		const openApiDocument = generateOpenApiDocument(appRouter, {
			title: "RylixManager API",
			version: "1.0.0",
			baseUrl: "https://your-rylix-instance.com/api",
			docsUrl: "https://github.com/RishBroProMax/rylixmanager#readme",
			tags: [
				"admin",
				"docker",
				"compose",
				"registry",
				"cluster",
				"user",
				"domain",
				"destination",
				"backup",
				"deployment",
				"mounts",
				"certificates",
				"settings",
				"security",
				"redirects",
				"port",
				"project",
				"application",
				"mysql",
				"postgres",
				"redis",
				"mongo",
				"mariadb",
				"sshRouter",
				"gitProvider",
				"bitbucket",
				"github",
				"gitlab",
				"gitea",
				"server",
				"swarm",
				"ai",
				"organization",
				"schedule",
				"rollback",
				"volumeBackups",
				"environment",
				"traffic",
				"gameServer",
			],
		});

		// Enhance metadata
		openApiDocument.info = {
			title: "RylixManager API",
			description:
				"Complete API documentation for RylixManager (Dokploy Reimagined) - Deploy applications, manage databases, orchestrate game servers, and harden VPS infrastructure.",
			version: "1.0.0",
			contact: {
				name: "RylixManager Team",
				url: "https://github.com/RishBroProMax/rylixmanager",
			},
			license: {
				name: "MIT",
				url: "https://github.com/RishBroProMax/rylixmanager/blob/main/LICENSE",
			},
		};

		// Add security schemes
		openApiDocument.components = {
			...openApiDocument.components,
			securitySchemes: {
				apiKey: {
					type: "apiKey",
					in: "header",
					name: "x-api-key",
					description:
						"API key authentication. Generate an API key from your RylixManager dashboard under Settings > API Keys.",
				},
			},
		};

		// Apply global security
		openApiDocument.security = [
			{
				apiKey: [],
			},
		];

		// Add external docs
		openApiDocument.externalDocs = {
			description: "Full documentation",
			url: "https://github.com/RishBroProMax/rylixmanager#readme",
		};

		// Write to root of repo
		const outputPath = resolve(__dirname, "../../../openapi.json");
		writeFileSync(
			outputPath,
			JSON.stringify(openApiDocument, null, 2),
			"utf-8",
		);

		console.log("✅ OpenAPI specification generated successfully!");
		console.log(`📄 Output: ${outputPath}`);
		console.log(
			`📊 Endpoints: ${Object.keys(openApiDocument.paths || {}).length}`,
		);
		process.exit(0);
	} catch (error) {
		console.error("❌ Error generating OpenAPI specification:", error);
		process.exit(1);
	}
}

generateOpenAPI();
