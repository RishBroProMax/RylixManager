import type { LogEntry } from "./types";

export interface AnalyticsSummary {
	totalRequests: number;
	uniqueVisitors: number;
	totalBytes: number;
	totalBytesFormatted: string;
	avgLatencyMs: number;
	p75LatencyMs: number;
	p95LatencyMs: number;
	successRate: number;
	errorRate: number;
}

export interface AnalyticsTimeSeriesPoint {
	timestamp: string;
	displayLabel: string;
	total: number;
	status2xx: number;
	status3xx: number;
	status4xx: number;
	status5xx: number;
	avgDurationMs: number;
}

export interface AnalyticsPathMetric {
	path: string;
	count: number;
	percentage: number;
	avgDurationMs: number;
}

export interface AnalyticsHostMetric {
	host: string;
	count: number;
	percentage: number;
}

export interface AnalyticsStatusCodeMetric {
	code: number;
	category: "2xx" | "3xx" | "4xx" | "5xx";
	count: number;
	percentage: number;
}

export interface AnalyticsMethodMetric {
	method: string;
	count: number;
	percentage: number;
}

export interface AnalyticsDimensionMetric {
	name: string;
	count: number;
	percentage: number;
}

export interface AnalyticsClientMetric {
	clientIp: string;
	count: number;
	bytes: number;
	bytesFormatted: string;
	percentage: number;
}

export interface VercelAnalyticsResult {
	summary: AnalyticsSummary;
	timeSeries: AnalyticsTimeSeriesPoint[];
	topPaths: AnalyticsPathMetric[];
	topHosts: AnalyticsHostMetric[];
	statusCodes: AnalyticsStatusCodeMetric[];
	methods: AnalyticsMethodMetric[];
	operatingSystems: AnalyticsDimensionMetric[];
	browsers: AnalyticsDimensionMetric[];
	devices: AnalyticsDimensionMetric[];
	topClients: AnalyticsClientMetric[];
	recentRequests: LogEntry[];
}

export const formatBytes = (bytes: number): string => {
	if (!bytes || bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const parseDurationToMs = (duration: number): number => {
	if (!duration) return 0;
	// Traefik logs duration in nanoseconds if > 1000000, otherwise in ms/ns
	if (duration > 1_000_000) {
		return Math.round((duration / 1_000_000) * 10) / 10;
	}
	if (duration > 1_000) {
		return Math.round((duration / 1_000) * 10) / 10;
	}
	return Math.round(duration * 10) / 10;
};

export const detectOS = (ua: string): string => {
	if (!ua) return "Unknown";
	if (/bot|crawler|spider|curl|wget/i.test(ua)) return "Bot / Crawler";
	if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
	if (/Android/i.test(ua)) return "Android";
	if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
	if (/Windows NT/i.test(ua)) return "Windows";
	if (/Linux/i.test(ua)) return "Linux";
	if (/CrOS/i.test(ua)) return "ChromeOS";
	return "Other";
};

export const detectBrowser = (ua: string): string => {
	if (!ua) return "Unknown";
	if (/bot|crawler|spider/i.test(ua)) return "Bot";
	if (/curl/i.test(ua)) return "cURL";
	if (/PostmanRuntime/i.test(ua)) return "Postman";
	if (/Edg/i.test(ua)) return "Edge";
	if (/OPR|Opera/i.test(ua)) return "Opera";
	if (/Chrome/i.test(ua)) return "Chrome";
	if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
	if (/Firefox/i.test(ua)) return "Firefox";
	return "Other";
};

export const detectDevice = (ua: string): "desktop" | "mobile" | "tablet" | "bot" => {
	if (!ua) return "desktop";
	if (/bot|crawler|spider|curl|wget/i.test(ua)) return "bot";
	if (/iPad|Tablet|PlayBook/i.test(ua)) return "tablet";
	if (/Mobile|iPhone|Android/i.test(ua)) return "mobile";
	return "desktop";
};

export const cleanClientIp = (addr: string): string => {
	if (!addr) return "127.0.0.1";
	// Remove port from e.g. "1.2.3.4:56789" or "[::1]:56789"
	const lastColon = addr.lastIndexOf(":");
	if (lastColon > 0) {
		return addr.substring(0, lastColon).replace(/[[\]]/g, "");
	}
	return addr;
};

export function processVercelAnalytics(
	rawLogString: string,
	filters?: {
		dateRange?: { start?: string; end?: string };
		host?: string;
		search?: string;
	},
): VercelAnalyticsResult {
	if (!rawLogString || rawLogString.trim() === "") {
		return getEmptyAnalyticsResult();
	}

	const startTime = filters?.dateRange?.start
		? new Date(filters.dateRange.start).getTime()
		: 0;
	const endTime = filters?.dateRange?.end
		? new Date(filters.dateRange.end).getTime()
		: Number.POSITIVE_INFINITY;
	const targetHost = filters?.host?.trim().toLowerCase();
	const searchQuery = filters?.search?.trim().toLowerCase();

	const lines = rawLogString.split("\n");
	const parsedEntries: LogEntry[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || !trimmed.startsWith("{") || !trimmed.endsWith("}")) {
			continue;
		}

		try {
			const entry = JSON.parse(trimmed) as LogEntry;
			if (entry.ServiceName === "dokploy-service-app@file") {
				continue;
			}

			const entryTime = new Date(entry.StartUTC || entry.time).getTime();
			if (entryTime < startTime || entryTime > endTime) {
				continue;
			}

			const entryHost = (entry.RequestHost || "").toLowerCase();
			if (targetHost && targetHost !== "all" && entryHost !== targetHost) {
				continue;
			}

			if (searchQuery) {
				const path = (entry.RequestPath || "").toLowerCase();
				const ip = (entry.ClientAddr || "").toLowerCase();
				if (!path.includes(searchQuery) && !ip.includes(searchQuery)) {
					continue;
				}
			}

			parsedEntries.push(entry);
		} catch {
			// Ignore malformed lines
		}
	}

	const totalRequests = parsedEntries.length;
	if (totalRequests === 0) {
		return getEmptyAnalyticsResult();
	}

	// 1. Calculations for Summary
	const uniqueIPs = new Set<string>();
	let totalBytes = 0;
	const durationsMs: number[] = [];
	let successCount = 0;
	let errorCount = 0;

	// Dimensions accumulators
	const timeBuckets: Record<
		string,
		{
			total: number;
			status2xx: number;
			status3xx: number;
			status4xx: number;
			status5xx: number;
			durations: number[];
		}
	> = {};

	const pathCounts: Record<string, { count: number; durations: number[] }> = {};
	const hostCounts: Record<string, number> = {};
	const statusCodeCounts: Record<number, number> = {};
	const methodCounts: Record<string, number> = {};
	const osCounts: Record<string, number> = {};
	const browserCounts: Record<string, number> = {};
	const deviceCounts: Record<string, number> = {};
	const clientMap: Record<string, { count: number; bytes: number }> = {};

	for (const entry of parsedEntries) {
		const ip = cleanClientIp(entry.ClientAddr);
		uniqueIPs.add(ip);

		const bytes = entry.DownstreamContentSize || 0;
		totalBytes += bytes;

		const durMs = parseDurationToMs(entry.Duration);
		durationsMs.push(durMs);

		const status = entry.DownstreamStatus || 200;
		if (status < 400) {
			successCount++;
		} else {
			errorCount++;
		}

		// Status codes
		statusCodeCounts[status] = (statusCodeCounts[status] || 0) + 1;

		// Methods
		const method = (entry.RequestMethod || "GET").toUpperCase();
		methodCounts[method] = (methodCounts[method] || 0) + 1;

		// Hosts
		const host = entry.RequestHost || "localhost";
		hostCounts[host] = (hostCounts[host] || 0) + 1;

		// Paths (normalize query params for grouping)
		const rawPath = entry.RequestPath || "/";
		const cleanPath = rawPath.split("?")[0] || "/";
		let pathData = pathCounts[cleanPath];
		if (!pathData) {
			pathData = { count: 0, durations: [] };
			pathCounts[cleanPath] = pathData;
		}
		pathData.count++;
		pathData.durations.push(durMs);

		// User agent analytics
		const ua = entry.request_User_Agent || "";
		const os = detectOS(ua);
		osCounts[os] = (osCounts[os] || 0) + 1;

		const browser = detectBrowser(ua);
		browserCounts[browser] = (browserCounts[browser] || 0) + 1;

		const device = detectDevice(ua);
		deviceCounts[device] = (deviceCounts[device] || 0) + 1;

		// Clients
		let clientData = clientMap[ip];
		if (!clientData) {
			clientData = { count: 0, bytes: 0 };
			clientMap[ip] = clientData;
		}
		clientData.count++;
		clientData.bytes += bytes;

		// Time Bucket (hourly)
		const entryDate = new Date(entry.StartUTC || entry.time);
		const bucketKey = `${entryDate.toISOString().slice(0, 13)}:00:00Z`;
		let bucketData = timeBuckets[bucketKey];
		if (!bucketData) {
			bucketData = {
				total: 0,
				status2xx: 0,
				status3xx: 0,
				status4xx: 0,
				status5xx: 0,
				durations: [],
			};
			timeBuckets[bucketKey] = bucketData;
		}

		bucketData.total++;
		bucketData.durations.push(durMs);
		if (status >= 200 && status < 300) bucketData.status2xx++;
		else if (status >= 300 && status < 400) bucketData.status3xx++;
		else if (status >= 400 && status < 500) bucketData.status4xx++;
		else if (status >= 500) bucketData.status5xx++;
	}

	// Percentiles
	durationsMs.sort((a, b) => a - b);
	const avgLatencyMs =
		durationsMs.length > 0
			? Math.round(
					(durationsMs.reduce((acc, cur) => acc + cur, 0) / durationsMs.length) * 10,
				) / 10
			: 0;
	const p75LatencyMs =
		durationsMs.length > 0
			? (durationsMs[Math.floor(durationsMs.length * 0.75)] ?? 0)
			: 0;
	const p95LatencyMs =
		durationsMs.length > 0
			? (durationsMs[Math.floor(durationsMs.length * 0.95)] ?? 0)
			: 0;

	// Summary
	const summary: AnalyticsSummary = {
		totalRequests,
		uniqueVisitors: uniqueIPs.size,
		totalBytes,
		totalBytesFormatted: formatBytes(totalBytes),
		avgLatencyMs,
		p75LatencyMs,
		p95LatencyMs,
		successRate: Math.round((successCount / totalRequests) * 1000) / 10,
		errorRate: Math.round((errorCount / totalRequests) * 1000) / 10,
	};

	// Time Series
	const sortedBucketKeys = Object.keys(timeBuckets).sort(
		(a, b) => new Date(a).getTime() - new Date(b).getTime(),
	);
	const timeSeries: AnalyticsTimeSeriesPoint[] = sortedBucketKeys.map((key) => {
		const b = timeBuckets[key];
		if (!b) {
			return {
				timestamp: key,
				displayLabel: "",
				total: 0,
				status2xx: 0,
				status3xx: 0,
				status4xx: 0,
				status5xx: 0,
				avgDurationMs: 0,
			};
		}
		const avg =
			b.durations.length > 0
				? Math.round(
						(b.durations.reduce((acc, c) => acc + c, 0) / b.durations.length) * 10,
					) / 10
				: 0;
		const d = new Date(key);
		const displayLabel = `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d.getUTCHours()}:00`;

		return {
			timestamp: key,
			displayLabel,
			total: b.total,
			status2xx: b.status2xx,
			status3xx: b.status3xx,
			status4xx: b.status4xx,
			status5xx: b.status5xx,
			avgDurationMs: avg,
		};
	});

	// Top Paths
	const topPaths: AnalyticsPathMetric[] = Object.entries(pathCounts)
		.map(([path, data]) => {
			const avg =
				data.durations.length > 0
					? Math.round(
							(data.durations.reduce((acc, c) => acc + c, 0) /
								data.durations.length) *
								10,
						) / 10
					: 0;
			return {
				path,
				count: data.count,
				percentage: Math.round((data.count / totalRequests) * 1000) / 10,
				avgDurationMs: avg,
			};
		})
		.sort((a, b) => b.count - a.count)
		.slice(0, 15);

	// Top Hosts
	const topHosts: AnalyticsHostMetric[] = Object.entries(hostCounts)
		.map(([host, count]) => ({
			host,
			count,
			percentage: Math.round((count / totalRequests) * 1000) / 10,
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	// Status Codes
	const statusCodes: AnalyticsStatusCodeMetric[] = Object.entries(statusCodeCounts)
		.map(([codeStr, count]) => {
			const code = parseInt(codeStr, 10);
			let category: "2xx" | "3xx" | "4xx" | "5xx" = "2xx";
			if (code >= 300 && code < 400) category = "3xx";
			else if (code >= 400 && code < 500) category = "4xx";
			else if (code >= 500) category = "5xx";

			return {
				code,
				category,
				count,
				percentage: Math.round((count / totalRequests) * 1000) / 10,
			};
		})
		.sort((a, b) => b.count - a.count);

	// Methods
	const methods: AnalyticsMethodMetric[] = Object.entries(methodCounts)
		.map(([method, count]) => ({
			method,
			count,
			percentage: Math.round((count / totalRequests) * 1000) / 10,
		}))
		.sort((a, b) => b.count - a.count);

	// OS
	const operatingSystems: AnalyticsDimensionMetric[] = Object.entries(osCounts)
		.map(([name, count]) => ({
			name,
			count,
			percentage: Math.round((count / totalRequests) * 1000) / 10,
		}))
		.sort((a, b) => b.count - a.count);

	// Browsers
	const browsers: AnalyticsDimensionMetric[] = Object.entries(browserCounts)
		.map(([name, count]) => ({
			name,
			count,
			percentage: Math.round((count / totalRequests) * 1000) / 10,
		}))
		.sort((a, b) => b.count - a.count);

	// Devices
	const devices: AnalyticsDimensionMetric[] = Object.entries(deviceCounts)
		.map(([name, count]) => ({
			name,
			count,
			percentage: Math.round((count / totalRequests) * 1000) / 10,
		}))
		.sort((a, b) => b.count - a.count);

	// Top Clients
	const topClients: AnalyticsClientMetric[] = Object.entries(clientMap)
		.map(([clientIp, data]) => ({
			clientIp,
			count: data.count,
			bytes: data.bytes,
			bytesFormatted: formatBytes(data.bytes),
			percentage: Math.round((data.count / totalRequests) * 1000) / 10,
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	// Recent Requests (last 50, sorted descending)
	const recentRequests = parsedEntries
		.slice(-50)
		.reverse();

	return {
		summary,
		timeSeries,
		topPaths,
		topHosts,
		statusCodes,
		methods,
		operatingSystems,
		browsers,
		devices,
		topClients,
		recentRequests,
	};
}

export function getEmptyAnalyticsResult(): VercelAnalyticsResult {
	return {
		summary: {
			totalRequests: 0,
			uniqueVisitors: 0,
			totalBytes: 0,
			totalBytesFormatted: "0 B",
			avgLatencyMs: 0,
			p75LatencyMs: 0,
			p95LatencyMs: 0,
			successRate: 100,
			errorRate: 0,
		},
		timeSeries: [],
		topPaths: [],
		topHosts: [],
		statusCodes: [],
		methods: [],
		operatingSystems: [],
		browsers: [],
		devices: [],
		topClients: [],
		recentRequests: [],
	};
}
