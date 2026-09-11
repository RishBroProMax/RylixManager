import {
	Activity,
	AlertCircle,
	ArrowDownRight,
	ArrowUpRight,
	Bot,
	Calendar,
	Check,
	CheckCircle2,
	ChevronRight,
	Clock,
	Copy,
	Cpu,
	Download,
	ExternalLink,
	Eye,
	Filter,
	Globe,
	HardDrive,
	Laptop,
	Layers,
	LineChart as LineChartIcon,
	Monitor,
	Pause,
	Play,
	Radio,
	RefreshCw,
	Server,
	Shield,
	ShieldCheck,
	Smartphone,
	Tablet,
	Terminal,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";
import type { LogEntry } from "@dokploy/server";

interface Props {
	serverId?: string;
}

type TimeRangeOption = "24h" | "7d" | "30d" | "all";
type ChartViewOption = "requests" | "latency";

export const VercelAnalyticsDashboard: React.FC<Props> = ({ serverId }) => {
	const [timeRange, setTimeRange] = useState<TimeRangeOption>("7d");
	const [selectedHost, setSelectedHost] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [chartView, setChartView] = useState<ChartViewOption>("requests");
	const [autoRefresh, setAutoRefresh] = useState(false);
	const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

	const utils = api.useUtils();

	// Calculate start / end dates based on timeRange
	const dateRange = useMemo(() => {
		if (timeRange === "all") return undefined;
		const end = new Date();
		const start = new Date();
		if (timeRange === "24h") {
			start.setHours(start.getHours() - 24);
		} else if (timeRange === "7d") {
			start.setDate(start.getDate() - 7);
		} else if (timeRange === "30d") {
			start.setDate(start.getDate() - 30);
		}
		return {
			start: start.toISOString(),
			end: end.toISOString(),
		};
	}, [timeRange]);

	// Query Vercel Analytics data
	const {
		data: analytics,
		isLoading,
		refetch,
		isRefetching,
	} = api.traffic.getVercelAnalytics.useQuery(
		{
			dateRange,
			host: selectedHost,
			search: searchQuery,
			serverId,
		},
		{
			refetchInterval: autoRefresh ? 5000 : false,
		},
	);

	// Toggle Access Logging Mutation
	const toggleLoggingMutation = api.traffic.toggleAccessLogging.useMutation();

	const handleEnableLogging = async () => {
		try {
			await toggleLoggingMutation.mutateAsync({ enable: true });
			toast.success("Traefik traffic logging enabled successfully!");
			refetch();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to enable traffic logging",
			);
		}
	};

	const handleExportJSON = () => {
		if (!analytics) return;
		const dataStr =
			"data:text/json;charset=utf-8," +
			encodeURIComponent(JSON.stringify(analytics, null, 2));
		const downloadAnchor = document.createElement("a");
		downloadAnchor.setAttribute("href", dataStr);
		downloadAnchor.setAttribute(
			"download",
			`rylix-analytics-${new Date().toISOString().slice(0, 10)}.json`,
		);
		document.body.appendChild(downloadAnchor);
		downloadAnchor.click();
		downloadAnchor.remove();
		toast.success("Analytics JSON exported successfully");
	};

	const handleExportCSV = () => {
		if (!analytics?.recentRequests || analytics.recentRequests.length === 0) {
			toast.error("No recent request logs to export");
			return;
		}
		const headers = [
			"Timestamp",
			"Method",
			"Status",
			"Host",
			"Path",
			"DurationMs",
			"ClientIP",
			"Bytes",
		];
		const rows = analytics.recentRequests.map((r) => [
			`"${r.StartUTC || r.time}"`,
			`"${r.RequestMethod || "GET"}"`,
			r.DownstreamStatus || 200,
			`"${r.RequestHost || ""}"`,
			`"${(r.RequestPath || "").replace(/"/g, '""')}"`,
			Math.round((r.Duration || 0) / 1000000),
			`"${r.ClientAddr || ""}"`,
			r.DownstreamContentSize || 0,
		]);
		const csvContent =
			"data:text/csv;charset=utf-8," +
			[headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute(
			"download",
			`rylix-requests-${new Date().toISOString().slice(0, 10)}.csv`,
		);
		document.body.appendChild(link);
		link.click();
		link.remove();
		toast.success("Requests CSV exported successfully");
	};

	const summary = analytics?.summary;
	const isLoggingActive = analytics?.isLoggingActive;

	// Host list for selector
	const hostOptions = useMemo(() => {
		const hosts = new Set<string>();
		if (analytics?.topHosts) {
			for (const h of analytics.topHosts) {
				if (h.host) hosts.add(h.host);
			}
		}
		return Array.from(hosts);
	}, [analytics?.topHosts]);

	return (
		<div className="space-y-6">
			{/* Top Header Bar */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2.5">
						<div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
							<LineChartIcon className="size-4 text-primary" />
						</div>
						<h1 className="text-2xl font-bold tracking-tight">
							Traffic Analytics
						</h1>
						<Badge
							variant="outline"
							className={`text-[10px] font-mono gap-1 ${
								autoRefresh
									? "text-emerald-500 border-emerald-500/30"
									: "text-muted-foreground"
							}`}
						>
							<span
								className={`size-1.5 rounded-full ${
									autoRefresh
										? "bg-emerald-500 animate-pulse"
										: "bg-muted-foreground"
								}`}
							/>
							{autoRefresh ? "Live Stream (5s)" : "Vercel Mode"}
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Real-time traffic volume, visitor geography, edge latency, and HTTP status telemetry.
					</p>
				</div>

				{/* Controls Bar */}
				<div className="flex flex-wrap items-center gap-2">
					{/* Host Selector */}
					<div className="w-[160px]">
						<Select value={selectedHost} onValueChange={setSelectedHost}>
							<SelectTrigger className="h-8 text-xs font-mono">
								<SelectValue placeholder="All Domains" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all" className="text-xs font-mono">
									All Domains
								</SelectItem>
								{hostOptions.map((h) => (
									<SelectItem key={h} value={h} className="text-xs font-mono">
										{h}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Time Range Filter Buttons */}
					<div className="inline-flex rounded-lg border border-border bg-muted/20 p-0.5">
						{(["24h", "7d", "30d", "all"] as TimeRangeOption[]).map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => setTimeRange(t)}
								className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
									timeRange === t
										? "bg-background text-foreground shadow-sm font-semibold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{t === "24h"
									? "24 Hours"
									: t === "7d"
										? "7 Days"
										: t === "30d"
											? "30 Days"
											: "All Time"}
							</button>
						))}
					</div>

					{/* Auto-Refresh Toggle */}
					<Button
						variant="outline"
						size="sm"
						className={`h-8 text-xs gap-1.5 ${
							autoRefresh
								? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
								: ""
						}`}
						onClick={() => setAutoRefresh(!autoRefresh)}
					>
						{autoRefresh ? (
							<Pause className="size-3.5" />
						) : (
							<Play className="size-3.5" />
						)}
						{autoRefresh ? "Pause Live" : "Live Pulse"}
					</Button>

					{/* Manual Refresh */}
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs gap-1.5"
						onClick={() => refetch()}
						disabled={isRefetching}
					>
						<RefreshCw
							className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>

					<Link href="/dashboard/traffic">
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs gap-1.5"
						>
							<ShieldCheck className="size-3.5" />
							Traffic & Security
						</Button>
					</Link>
				</div>
			</div>

			{/* Logging Disabled Alert Banner */}
			{!isLoggingActive && (
				<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-500">
					<div className="flex items-start gap-3">
						<AlertCircle className="size-5 shrink-0 mt-0.5" />
						<div>
							<h4 className="text-xs font-semibold">
								Traefik Access Logging is currently inactive
							</h4>
							<p className="text-[11px] text-amber-500/80 mt-0.5">
								Enable high-performance JSON logging in Traefik to collect real-time visitor statistics, path analytics, and latency telemetry.
							</p>
						</div>
					</div>
					<Button
						size="sm"
						className="h-8 text-xs font-medium shrink-0 bg-amber-500 text-black hover:bg-amber-400"
						onClick={handleEnableLogging}
						disabled={toggleLoggingMutation.isPending}
					>
						<Zap className="size-3.5 mr-1" />
						{toggleLoggingMutation.isPending
							? "Enabling..."
							: "Enable Traffic Logging"}
					</Button>
				</div>
			)}

			{/* KPI Metric Cards Grid */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
				{/* 1. Total Requests */}
				<Card className="bg-background border-border p-3.5">
					<div className="flex items-center justify-between text-muted-foreground text-xs">
						<span>Total Requests</span>
						<Activity className="size-3.5" />
					</div>
					<p className="text-xl font-bold tracking-tight mt-1.5 font-mono">
						{summary?.totalRequests.toLocaleString() ?? "0"}
					</p>
					<span className="text-[10px] text-muted-foreground">
						Incoming HTTP calls
					</span>
				</Card>

				{/* 2. Unique Visitors */}
				<Card className="bg-background border-border p-3.5">
					<div className="flex items-center justify-between text-muted-foreground text-xs">
						<span>Unique Visitors</span>
						<Users className="size-3.5" />
					</div>
					<p className="text-xl font-bold tracking-tight mt-1.5 font-mono">
						{summary?.uniqueVisitors.toLocaleString() ?? "0"}
					</p>
					<span className="text-[10px] text-muted-foreground">
						Deduplicated client IPs
					</span>
				</Card>

				{/* 3. Data Transfer */}
				<Card className="bg-background border-border p-3.5">
					<div className="flex items-center justify-between text-muted-foreground text-xs">
						<span>Bandwidth</span>
						<HardDrive className="size-3.5" />
					</div>
					<p className="text-xl font-bold tracking-tight mt-1.5 font-mono">
						{summary?.totalBytesFormatted ?? "0 B"}
					</p>
					<span className="text-[10px] text-muted-foreground">
						Outbound data served
					</span>
				</Card>

				{/* 4. Average Latency */}
				<Card className="bg-background border-border p-3.5">
					<div className="flex items-center justify-between text-muted-foreground text-xs">
						<span>Avg Latency</span>
						<Clock className="size-3.5" />
					</div>
					<p className="text-xl font-bold tracking-tight mt-1.5 font-mono">
						{summary?.avgLatencyMs ?? 0} ms
					</p>
					<span className="text-[10px] text-muted-foreground">
						Server response time
					</span>
				</Card>

				{/* 5. p95 Latency */}
				<Card className="bg-background border-border p-3.5">
					<div className="flex items-center justify-between text-muted-foreground text-xs">
						<span>p95 Latency</span>
						<Zap className="size-3.5" />
					</div>
					<p className="text-xl font-bold tracking-tight mt-1.5 font-mono">
						{summary?.p95LatencyMs ?? 0} ms
					</p>
					<span className="text-[10px] text-muted-foreground">
						95th percentile
					</span>
				</Card>

				{/* 6. Success Rate */}
				<Card className="bg-background border-border p-3.5">
					<div className="flex items-center justify-between text-muted-foreground text-xs">
						<span>Success Rate</span>
						<CheckCircle2 className="size-3.5 text-emerald-500" />
					</div>
					<p className="text-xl font-bold tracking-tight mt-1.5 font-mono text-emerald-500">
						{summary?.successRate ?? 100}%
					</p>
					<span className="text-[10px] text-muted-foreground">
						{summary?.errorRate ?? 0}% HTTP error rate
					</span>
				</Card>
			</div>

			{/* Interactive Time Series Chart Card */}
			<Card className="bg-background border-border">
				<CardHeader className="p-5 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<Activity className="size-4 text-primary" />
							Traffic Volume & Telemetry
						</CardTitle>
						<CardDescription className="text-xs">
							Hourly distribution of incoming requests, HTTP status codes, and latency.
						</CardDescription>
					</div>

					{/* View Toggle */}
					<div className="inline-flex rounded-lg border border-border bg-muted/20 p-0.5">
						<button
							type="button"
							onClick={() => setChartView("requests")}
							className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
								chartView === "requests"
									? "bg-background text-foreground shadow-sm font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Requests Breakdown
						</button>
						<button
							type="button"
							onClick={() => setChartView("latency")}
							className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
								chartView === "latency"
									? "bg-background text-foreground shadow-sm font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Latency (ms)
						</button>
					</div>
				</CardHeader>

				<CardContent className="p-5">
					{!analytics?.timeSeries || analytics.timeSeries.length === 0 ? (
						<div className="h-[240px] flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
							<LineChartIcon className="size-8 stroke-1 text-muted-foreground/50" />
							<span>No traffic events recorded in this time range.</span>
						</div>
					) : chartView === "requests" ? (
						<div className="h-[260px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart
									data={analytics.timeSeries}
									margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
								>
									<defs>
										<linearGradient
											id="color2xx"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="#10b981"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="#10b981"
												stopOpacity={0.05}
											/>
										</linearGradient>
										<linearGradient
											id="color4xx"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="#f59e0b"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="#f59e0b"
												stopOpacity={0.05}
											/>
										</linearGradient>
										<linearGradient
											id="color5xx"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="#ef4444"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="#ef4444"
												stopOpacity={0.05}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="rgba(255,255,255,0.06)"
									/>
									<XAxis
										dataKey="displayLabel"
										stroke="rgba(255,255,255,0.4)"
										fontSize={10}
										tickLine={false}
									/>
									<YAxis
										stroke="rgba(255,255,255,0.4)"
										fontSize={10}
										tickLine={false}
									/>
									<Tooltip
										content={({ active, payload, label }) => {
											if (!active || !payload || !payload.length) return null;
											const data = payload[0]?.payload;
											return (
												<div className="rounded-lg border border-border bg-black/95 p-3 text-xs shadow-xl space-y-1 font-mono">
													<p className="font-semibold text-foreground border-b border-border pb-1">
														{label}
													</p>
													<div className="flex items-center justify-between gap-4 text-emerald-400">
														<span>2xx Success:</span>
														<span className="font-bold">{data.status2xx}</span>
													</div>
													<div className="flex items-center justify-between gap-4 text-blue-400">
														<span>3xx Redirect:</span>
														<span className="font-bold">{data.status3xx}</span>
													</div>
													<div className="flex items-center justify-between gap-4 text-amber-400">
														<span>4xx Client Err:</span>
														<span className="font-bold">{data.status4xx}</span>
													</div>
													<div className="flex items-center justify-between gap-4 text-red-400">
														<span>5xx Server Err:</span>
														<span className="font-bold">{data.status5xx}</span>
													</div>
													<div className="border-t border-border/60 pt-1 flex items-center justify-between gap-4 text-muted-foreground">
														<span>Avg Duration:</span>
														<span className="text-foreground">
															{data.avgDurationMs} ms
														</span>
													</div>
												</div>
											);
										}}
									/>
									<Area
										type="monotone"
										dataKey="status2xx"
										stackId="1"
										stroke="#10b981"
										fillOpacity={1}
										fill="url(#color2xx)"
									/>
									<Area
										type="monotone"
										dataKey="status3xx"
										stackId="1"
										stroke="#3b82f6"
										fill="#3b82f6"
										fillOpacity={0.4}
									/>
									<Area
										type="monotone"
										dataKey="status4xx"
										stackId="1"
										stroke="#f59e0b"
										fill="url(#color4xx)"
									/>
									<Area
										type="monotone"
										dataKey="status5xx"
										stackId="1"
										stroke="#ef4444"
										fill="url(#color5xx)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="h-[260px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart
									data={analytics.timeSeries}
									margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="rgba(255,255,255,0.06)"
									/>
									<XAxis
										dataKey="displayLabel"
										stroke="rgba(255,255,255,0.4)"
										fontSize={10}
										tickLine={false}
									/>
									<YAxis
										stroke="rgba(255,255,255,0.4)"
										fontSize={10}
										tickLine={false}
									/>
									<Tooltip
										content={({ active, payload, label }) => {
											if (!active || !payload || !payload.length) return null;
											const data = payload[0]?.payload;
											return (
												<div className="rounded-lg border border-border bg-black/95 p-3 text-xs shadow-xl space-y-1 font-mono">
													<p className="font-semibold text-foreground border-b border-border pb-1">
														{label}
													</p>
													<div className="flex items-center justify-between gap-4 text-emerald-400">
														<span>Average Latency:</span>
														<span className="font-bold">
															{data.avgDurationMs} ms
														</span>
													</div>
													<div className="flex items-center justify-between gap-4 text-muted-foreground">
														<span>Total Requests:</span>
														<span>{data.total}</span>
													</div>
												</div>
											);
										}}
									/>
									<Line
										type="monotone"
										dataKey="avgDurationMs"
										stroke="#10b981"
										strokeWidth={2}
										dot={{ r: 2 }}
										activeDot={{ r: 4 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					)}

					{/* Legend */}
					{chartView === "requests" && (
						<div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-2 border-t border-border/40 font-mono">
							<div className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-emerald-500" />
								<span className="text-muted-foreground">2xx Success</span>
							</div>
							<div className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-blue-500" />
								<span className="text-muted-foreground">3xx Redirect</span>
							</div>
							<div className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-amber-500" />
								<span className="text-muted-foreground">4xx Client Error</span>
							</div>
							<div className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-red-500" />
								<span className="text-muted-foreground">5xx Server Error</span>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Detailed Insight Tabs Breakdown */}
			<Tabs defaultValue="paths" className="w-full">
				<TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
					<TabsTrigger value="paths" className="text-xs">
						Top Paths
					</TabsTrigger>
					<TabsTrigger value="hosts" className="text-xs">
						Domains
					</TabsTrigger>
					<TabsTrigger value="status" className="text-xs">
						Status & Methods
					</TabsTrigger>
					<TabsTrigger value="devices" className="text-xs">
						OS & Browsers
					</TabsTrigger>
					<TabsTrigger value="clients" className="text-xs">
						Top Clients
					</TabsTrigger>
					<TabsTrigger value="stream" className="text-xs">
						Live Stream
					</TabsTrigger>
				</TabsList>

				{/* Tab 1: Top Paths */}
				<TabsContent value="paths" className="pt-4">
					<Card className="bg-background border-border">
						<CardHeader className="p-4 pb-3 border-b border-border">
							<CardTitle className="text-sm font-semibold">
								Top Requested Paths
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow className="text-xs">
										<TableHead>Path</TableHead>
										<TableHead className="w-[140px]">Share</TableHead>
										<TableHead className="text-right">Requests</TableHead>
										<TableHead className="text-right">Avg Latency</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{analytics?.topPaths.map((p) => (
										<TableRow key={p.path} className="text-xs">
											<TableCell className="font-mono text-foreground font-medium">
												{p.path}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Progress
														value={p.percentage}
														className="h-1.5 flex-1"
													/>
													<span className="text-[10px] text-muted-foreground font-mono w-8 text-right">
														{p.percentage}%
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right font-mono">
												{p.count.toLocaleString()}
											</TableCell>
											<TableCell className="text-right font-mono text-muted-foreground">
												{p.avgDurationMs} ms
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 2: Domains */}
				<TabsContent value="hosts" className="pt-4">
					<Card className="bg-background border-border">
						<CardHeader className="p-4 pb-3 border-b border-border">
							<CardTitle className="text-sm font-semibold">
								Top Hostnames
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow className="text-xs">
										<TableHead>Host / Domain</TableHead>
										<TableHead className="w-[140px]">Share</TableHead>
										<TableHead className="text-right">Requests</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{analytics?.topHosts.map((h) => (
										<TableRow key={h.host} className="text-xs">
											<TableCell className="font-mono text-foreground font-medium flex items-center gap-1.5">
												<Globe className="size-3.5 text-muted-foreground" />
												{h.host}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Progress
														value={h.percentage}
														className="h-1.5 flex-1"
													/>
													<span className="text-[10px] text-muted-foreground font-mono w-8 text-right">
														{h.percentage}%
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right font-mono">
												{h.count.toLocaleString()}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 3: Status & Methods */}
				<TabsContent value="status" className="pt-4 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Status Codes */}
						<Card className="bg-background border-border">
							<CardHeader className="p-4 pb-3 border-b border-border">
								<CardTitle className="text-sm font-semibold">
									HTTP Status Codes
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 space-y-3">
								{analytics?.statusCodes.map((s) => (
									<div key={s.code} className="space-y-1">
										<div className="flex items-center justify-between text-xs font-mono">
											<span
												className={`font-semibold ${
													s.category === "2xx"
														? "text-emerald-500"
														: s.category === "3xx"
															? "text-blue-500"
															: s.category === "4xx"
																? "text-amber-500"
																: "text-red-500"
												}`}
											>
												{s.code} Status
											</span>
											<span className="text-muted-foreground">
												{s.count.toLocaleString()} ({s.percentage}%)
											</span>
										</div>
										<Progress value={s.percentage} className="h-1.5" />
									</div>
								))}
							</CardContent>
						</Card>

						{/* HTTP Methods */}
						<Card className="bg-background border-border">
							<CardHeader className="p-4 pb-3 border-b border-border">
								<CardTitle className="text-sm font-semibold">
									HTTP Methods
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 space-y-3">
								{analytics?.methods.map((m) => (
									<div key={m.method} className="space-y-1">
										<div className="flex items-center justify-between text-xs font-mono">
											<Badge variant="outline" className="text-[10px]">
												{m.method}
											</Badge>
											<span className="text-muted-foreground">
												{m.count.toLocaleString()} ({m.percentage}%)
											</span>
										</div>
										<Progress value={m.percentage} className="h-1.5" />
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Tab 4: OS & Browsers */}
				<TabsContent value="devices" className="pt-4 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Devices */}
						<Card className="bg-background border-border">
							<CardHeader className="p-4 pb-3 border-b border-border">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<Laptop className="size-4 text-primary" />
									Device Types
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 space-y-3">
								{analytics?.devices.map((d) => (
									<div key={d.name} className="space-y-1">
										<div className="flex items-center justify-between text-xs capitalize font-medium">
											<span>{d.name}</span>
											<span className="font-mono text-muted-foreground text-[11px]">
												{d.count} ({d.percentage}%)
											</span>
										</div>
										<Progress value={d.percentage} className="h-1.5" />
									</div>
								))}
							</CardContent>
						</Card>

						{/* Operating Systems */}
						<Card className="bg-background border-border">
							<CardHeader className="p-4 pb-3 border-b border-border">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<Monitor className="size-4 text-primary" />
									Operating Systems
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 space-y-3">
								{analytics?.operatingSystems.map((os) => (
									<div key={os.name} className="space-y-1">
										<div className="flex items-center justify-between text-xs font-medium">
											<span>{os.name}</span>
											<span className="font-mono text-muted-foreground text-[11px]">
												{os.count} ({os.percentage}%)
											</span>
										</div>
										<Progress value={os.percentage} className="h-1.5" />
									</div>
								))}
							</CardContent>
						</Card>

						{/* Browsers */}
						<Card className="bg-background border-border">
							<CardHeader className="p-4 pb-3 border-b border-border">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<Globe className="size-4 text-primary" />
									Browsers & Clients
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 space-y-3">
								{analytics?.browsers.map((b) => (
									<div key={b.name} className="space-y-1">
										<div className="flex items-center justify-between text-xs font-medium">
											<span>{b.name}</span>
											<span className="font-mono text-muted-foreground text-[11px]">
												{b.count} ({b.percentage}%)
											</span>
										</div>
										<Progress value={b.percentage} className="h-1.5" />
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Tab 5: Top Clients */}
				<TabsContent value="clients" className="pt-4">
					<Card className="bg-background border-border">
						<CardHeader className="p-4 pb-3 border-b border-border">
							<CardTitle className="text-sm font-semibold">
								Top Client IPs & Traffic Sources
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow className="text-xs">
										<TableHead>Client IP</TableHead>
										<TableHead className="w-[140px]">Traffic Share</TableHead>
										<TableHead className="text-right">Requests</TableHead>
										<TableHead className="text-right">Data Transfer</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{analytics?.topClients.map((c) => (
										<TableRow key={c.clientIp} className="text-xs">
											<TableCell className="font-mono text-foreground font-medium">
												{c.clientIp}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Progress
														value={c.percentage}
														className="h-1.5 flex-1"
													/>
													<span className="text-[10px] text-muted-foreground font-mono w-8 text-right">
														{c.percentage}%
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right font-mono">
												{c.count.toLocaleString()}
											</TableCell>
											<TableCell className="text-right font-mono text-muted-foreground">
												{c.bytesFormatted}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 6: Live Stream */}
				<TabsContent value="stream" className="pt-4">
					<Card className="bg-background border-border">
						<CardHeader className="p-4 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
							<CardTitle className="text-sm font-semibold flex items-center gap-2">
								<Radio className="size-4 text-emerald-500 animate-pulse" />
								Real-Time Request Stream
							</CardTitle>
							<div className="w-[200px]">
								<Input
									placeholder="Search path or IP..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-7 text-xs font-mono"
								/>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow className="text-xs">
										<TableHead>Method & Status</TableHead>
										<TableHead>Host & Path</TableHead>
										<TableHead>Client IP</TableHead>
										<TableHead className="text-right">Duration</TableHead>
										<TableHead className="text-right">Timestamp</TableHead>
										<TableHead className="w-[40px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{analytics?.recentRequests.map((req, idx) => {
										const status = req.DownstreamStatus || 200;
										const statusBadgeColor =
											status < 300
												? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
												: status < 400
													? "bg-blue-500/10 text-blue-500 border-blue-500/30"
													: status < 500
														? "bg-amber-500/10 text-amber-500 border-amber-500/30"
														: "bg-red-500/10 text-red-500 border-red-500/30";

										return (
											<TableRow
												key={`${req.ClientAddr}-${req.StartUTC}-${idx}`}
												className="text-xs cursor-pointer hover:bg-muted/30"
												onClick={() => setSelectedLog(req)}
											>
												<TableCell>
													<div className="flex items-center gap-1.5 font-mono">
														<Badge
															variant="outline"
															className="text-[10px] font-mono px-1.5 py-0"
														>
															{req.RequestMethod || "GET"}
														</Badge>
														<Badge
															variant="outline"
															className={`text-[10px] font-mono px-1.5 py-0 ${statusBadgeColor}`}
														>
															{status}
														</Badge>
													</div>
												</TableCell>
												<TableCell>
													<div className="font-mono text-foreground">
														{req.RequestPath || "/"}
													</div>
													<div className="text-[11px] text-muted-foreground font-mono">
														{req.RequestHost || "localhost"}
													</div>
												</TableCell>
												<TableCell className="font-mono text-muted-foreground text-[11px]">
													{req.ClientAddr}
												</TableCell>
												<TableCell className="text-right font-mono">
													{req.Duration
														? `${Math.round(req.Duration / 1000000)} ms`
														: "0 ms"}
												</TableCell>
												<TableCell className="text-right font-mono text-[11px] text-muted-foreground">
													{new Date(
														req.StartUTC || req.time,
													).toLocaleTimeString()}
												</TableCell>
												<TableCell>
													<ChevronRight className="size-3.5 text-muted-foreground" />
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Request Detail Inspector Dialog */}
			<Dialog
				open={!!selectedLog}
				onOpenChange={(open) => !open && setSelectedLog(null)}
			>
				<DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-sm font-mono flex items-center gap-2">
							<Terminal className="size-4 text-primary" />
							HTTP Request Telemetry
						</DialogTitle>
						<DialogDescription className="text-xs">
							Detailed metadata captured by Traefik edge proxy.
						</DialogDescription>
					</DialogHeader>

					{selectedLog && (
						<div className="space-y-3 text-xs font-mono">
							<div className="grid grid-cols-2 gap-2 p-3 bg-muted/20 border rounded-lg">
								<div>
									<span className="text-muted-foreground text-[11px]">
										Method / Status:
									</span>
									<p className="font-semibold text-foreground">
										{selectedLog.RequestMethod} {selectedLog.DownstreamStatus}
									</p>
								</div>
								<div>
									<span className="text-muted-foreground text-[11px]">
										Duration:
									</span>
									<p className="font-semibold text-foreground">
										{selectedLog.Duration
											? `${(selectedLog.Duration / 1000000).toFixed(2)} ms`
											: "0 ms"}
									</p>
								</div>
								<div>
									<span className="text-muted-foreground text-[11px]">
										Host:
									</span>
									<p className="font-semibold text-foreground">
										{selectedLog.RequestHost}
									</p>
								</div>
								<div>
									<span className="text-muted-foreground text-[11px]">
										Client Address:
									</span>
									<p className="font-semibold text-foreground">
										{selectedLog.ClientAddr}
									</p>
								</div>
							</div>

							<div className="p-3 bg-muted/20 border rounded-lg space-y-1">
								<span className="text-muted-foreground text-[11px]">Path:</span>
								<p className="text-foreground break-all">
									{selectedLog.RequestPath}
								</p>
							</div>

							<div className="p-3 bg-muted/20 border rounded-lg space-y-1">
								<span className="text-muted-foreground text-[11px]">
									User Agent:
								</span>
								<p className="text-foreground break-all text-[11px]">
									{selectedLog.request_User_Agent || "None"}
								</p>
							</div>

							<div className="p-3 bg-muted/20 border rounded-lg space-y-1">
								<span className="text-muted-foreground text-[11px]">
									Router & Service:
								</span>
								<p className="text-foreground">
									{selectedLog.RouterName || "N/A"} →{" "}
									{selectedLog.ServiceName || "N/A"}
								</p>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};
