import fs from "node:fs";
import { db } from "@dokploy/server/db";
import { account, member, organization, user, webServerSettings } from "@dokploy/server/db/schema";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

function readSecret(secretPath: string): string {
	try {
		if (fs.existsSync(secretPath)) {
			return fs.readFileSync(secretPath, "utf8").trim();
		}
	} catch {
		// Ignore read errors
	}
	return "";
}

function resolveCredentials() {
	// 1. Check Docker secrets
	let email = readSecret("/run/secrets/rylix_admin_email") || readSecret("/run/secrets/admin_email");
	let password = readSecret("/run/secrets/rylix_admin_password") || readSecret("/run/secrets/admin_password");
	let firstName = readSecret("/run/secrets/rylix_admin_name") || readSecret("/run/secrets/admin_name");
	let lastName = readSecret("/run/secrets/rylix_admin_last_name") || readSecret("/run/secrets/admin_last_name");

	// 2. Check JSON config file (/etc/rylix/admin-setup.json or /etc/dokploy/admin-setup.json)
	const jsonPaths = [
		"/etc/rylix/admin-setup.json",
		"/etc/dokploy/admin-setup.json",
	];
	for (const p of jsonPaths) {
		if (!email && fs.existsSync(p)) {
			try {
				const content = JSON.parse(fs.readFileSync(p, "utf8"));
				if (content.email && content.password) {
					email = content.email;
					password = content.password;
					firstName = content.firstName || content.name || firstName;
					lastName = content.lastName || lastName;
					break;
				}
			} catch {
				// Ignore JSON parse error
			}
		}
	}

	// 3. Check environment variables
	email = email || process.env.ADMIN_EMAIL || process.env.INITIAL_ADMIN_EMAIL || "";
	password = password || process.env.ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD || "";
	firstName = firstName || process.env.ADMIN_NAME || process.env.ADMIN_FIRST_NAME || "Admin";
	lastName = lastName || process.env.ADMIN_LAST_NAME || "User";

	return {
		email: email.trim().toLowerCase(),
		password: password.trim(),
		firstName: firstName.trim() || "Admin",
		lastName: lastName.trim() || "User",
	};
}

(async () => {
	try {
		const { email, password, firstName, lastName } = resolveCredentials();

		if (!email || !password) {
			console.log("[RylixManager] No initial admin credentials provided, skipping auto-seed.");
			process.exit(0);
		}

		// Check if an admin owner already exists
		const existingAdmin = await db.query.member.findFirst({
			where: eq(member.role, "owner"),
		});

		if (existingAdmin) {
			console.log("[RylixManager] Admin account already present. Skipping auto-seed.");
			process.exit(0);
		}

		// Check if user already exists
		const existingUser = await db.query.user.findFirst({
			where: eq(user.email, email),
		});

		if (existingUser) {
			console.log(`[RylixManager] User with email ${email} already exists. Skipping auto-seed.`);
			process.exit(0);
		}

		const now = new Date();
		const hashedPassword = bcrypt.hashSync(password, 10);

		await db.transaction(async (tx) => {
			const newUser = await tx
				.insert(user)
				.values({
					id: nanoid(),
					email,
					firstName,
					lastName,
					emailVerified: true,
					isRegistered: true,
					role: "admin",
					enablePaidFeatures: true,
					enableEnterpriseFeatures: true,
					createdAt: now,
					updatedAt: now,
				})
				.returning()
				.then((res) => res[0]);

			if (!newUser) {
				throw new Error("Failed to create admin user record");
			}

			await tx.insert(account).values({
				id: nanoid(),
				accountId: nanoid(),
				providerId: "credential",
				userId: newUser.id,
				password: hashedPassword,
				createdAt: now,
				updatedAt: now,
			});

			const newOrg = await tx
				.insert(organization)
				.values({
					id: nanoid(),
					name: "Rylix Organization",
					ownerId: newUser.id,
					createdAt: now,
				})
				.returning()
				.then((res) => res[0]);

			if (!newOrg) {
				throw new Error("Failed to create default organization");
			}

			await tx.insert(member).values({
				id: nanoid(),
				organizationId: newOrg.id,
				userId: newUser.id,
				role: "owner",
				isDefault: true,
				canCreateProjects: true,
				canAccessToSSHKeys: true,
				canCreateServices: true,
				canDeleteProjects: true,
				canDeleteServices: true,
				createdAt: now,
			});

			// Initialize default webServerSettings if none exist
			const existingSettings = await tx.query.webServerSettings.findFirst();
			if (!existingSettings) {
				await tx.insert(webServerSettings).values({
					id: nanoid(),
					createdAt: now.toISOString(),
				});
			}
		});

		console.log(`[RylixManager] ✓ Initial Admin account successfully seeded for: ${email}`);

		// Clean up plain-text JSON credentials if they were written
		const jsonPaths = [
			"/etc/rylix/admin-setup.json",
			"/etc/dokploy/admin-setup.json",
		];
		for (const p of jsonPaths) {
			try {
				if (fs.existsSync(p)) {
					fs.unlinkSync(p);
				}
			} catch {
				// Ignore
			}
		}

		process.exit(0);
	} catch (error) {
		console.error("[RylixManager] Error during admin seed:", error);
		// Do not fail startup if seed encounters non-critical error
		process.exit(0);
	}
})();
