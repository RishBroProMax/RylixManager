import {
	Activity,
	AlertCircle,
	ArrowRight,
	Check,
	CheckCircle2,
	Copy,
	Cpu,
	ExternalLink,
	Globe,
	HardDrive,
	Info,
	Layers,
	LineChart,
	Lock,
	Network,
	Play,
	RefreshCw,
	Server,
	Shield,
	ShieldAlert,
	ShieldCheck,
	Sliders,
	Terminal,
	Zap,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
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

interface Props {
	serverId?: string;
}

export const TrafficManagerDeck: React.FC<Props> = ({ serverId }) => {
	const [activeTab, setActiveTab] = useState("services");
	const [copiedScript, setCopiedScript] = useState(false);
	const utils = api.useUtils();

	// Fetch security profiles
	const { data: profiles } = api.traffic.getProfiles.useQuery();

	// Fetch domains protection status
	const {
		data: domains,
		isLoading: loadingDomains,
		refetch: refetchDomains,
		isRefetching: isRefetchingDomains,
	} = api.traffic.getDomainsProtection.useQuery();

	// Fetch Linux system diagnostics
	const {
		data: linuxDiagnostics,
		isLoading: loadingLinux,
		refetch: refetchLinux,
		isRefetching: isRefetchingLinux,
	} = api.traffic.getLinuxDiagnostics.useQuery({ serverId });

	// Fetch hardening script
	const { data: hardeningScript } = api.traffic.getHardeningScript.useQuery();

	// Mutations
	const toggleMutation = api.traffic.toggleProtection.useMutation();
	const applyHardeningMutation = api.traffic.applyHardening.useMutation();

	const handleToggleMiddleware = async (
		domainId: string,
		middlewareId: string,
		currentEnabled: boolean,
	) => {
		try {
			await toggleMutation.mutateAsync({
				domainId,
				middlewareId,
				enable: !currentEnabled,
			});
			toast.success(
				`${!currentEnabled ? "Enabled" : "Disabled"} ${middlewareId}`,
			);
			utils.traffic.getDomainsProtection.invalidate();
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to update domain protection",
			);
		}
	};

	const handleApplyLinuxHardening = async () => {
		try {
			await applyHardeningMutation.mutateAsync({ serverId });
			toast.success("Linux kernel & Docker tuning applied successfully!");
			refetchLinux();
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to apply Linux hardening",
			);
		}
	};

	const handleCopyScript = () => {
		if (!hardeningScript) return;
		navigator.clipboard.writeText(hardeningScript);
		setCopiedScript(true);
		toast.success("Hardening script copied to clipboard");
		setTimeout(() => setCopiedScript(false), 2000);
	};

	// Metrics computation
	const totalDomains = domains?.length || 0;
	const protectedCount =
		domains?.filter((d) => d.hasStrictHeaders || d.hasRateLimit).length || 0;
	const bbrActive = linuxDiagnostics?.bbrEnabled || false;

	return (
		<div className="space-y-6">
			{/* Header Banner */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<ShieldCheck className="size-6 text-primary" />
						<h1 className="text-2xl font-bold tracking-tight">
							Traffic Manager & Security Deck
						</h1>
						<Badge variant="outline" className="text-[10px] font-mono">
							Layer 7 + Kernel Shield
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Built-in DDoS protection, OWASP security headers, rate limiting, and Linux kernel optimization.
					</p>
				</div>

					<Link href="/dashboard/analytics">
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs gap-1.5"
						>
							<LineChart className="size-3.5" />
							Traffic Analytics
						</Button>
					</Link>

					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs gap-1.5"
						onClick={() => {
							refetchDomains();
							refetchLinux();
						}}
						disabled={isRefetchingDomains || isRefetchingLinux}
					>
						<RefreshCw
							className={`size-3.5 ${
								isRefetchingDomains || isRefetchingLinux
									? "animate-spin"
									: ""
							}`}
						/>
						Refresh Status
					</Button>

					<Button
						size="sm"
						className="h-8 text-xs gap-1.5 font-medium"
						onClick={handleApplyLinuxHardening}
						disabled={applyHardeningMutation.isPending}
					>
						<Zap className="size-3.5" />
						{applyHardeningMutation.isPending
							? "Applying..."
							: "Apply Linux Optimization"}
					</Button>
				</div>
			</div>

			{/* KPI Status Tiles */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<Card className="bg-background border-border p-4">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">
							Protected Domains
						</span>
						<Globe className="size-4 text-primary" />
					</div>
					<p className="text-2xl font-bold tracking-tight mt-2">
						{protectedCount} / {totalDomains}
					</p>
					<span className="text-[10px] text-muted-foreground">
						Layer 7 shields active
					</span>
				</Card>

				<Card className="bg-background border-border p-4">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">
							TCP Congestion Control
						</span>
						<Network className="size-4 text-emerald-500" />
					</div>
					<p
						className={`text-2xl font-bold tracking-tight mt-2 ${
							bbrActive ? "text-emerald-500" : "text-amber-500"
						}`}
					>
						{bbrActive ? "Google BBR" : "Standard"}
					</p>
					<span className="text-[10px] text-muted-foreground">
						{bbrActive ? "Optimal packet delivery" : "Can be tuned with 1-click"}
					</span>
				</Card>

				<Card className="bg-background border-border p-4">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">
							Socket Buffers
						</span>
						<Activity className="size-4 text-blue-500" />
					</div>
					<p className="text-2xl font-bold tracking-tight mt-2">25.0 MB</p>
					<span className="text-[10px] text-muted-foreground">
						High-throughput TCP & UDP
					</span>
				</Card>

				<Card className="bg-background border-border p-4">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">
							Security Engine
						</span>
						<Shield className="size-4 text-emerald-500" />
					</div>
					<p className="text-2xl font-bold tracking-tight mt-2 text-emerald-500">
						Active
					</p>
					<span className="text-[10px] text-muted-foreground">
						Traefik Dynamic Middlewares
					</span>
				</Card>
			</div>

			{/* Main Management Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid grid-cols-3 w-full sm:w-[500px]">
					<TabsTrigger value="services" className="text-xs">
						Domain Protection
					</TabsTrigger>
					<TabsTrigger value="linux" className="text-xs">
						Linux Kernel & Host Tuning
					</TabsTrigger>
					<TabsTrigger value="profiles" className="text-xs">
						Security Profiles
					</TabsTrigger>
				</TabsList>

				{/* Tab 1: Domain Protection Matrix */}
				<TabsContent value="services" className="pt-4 space-y-4">
					<Card className="bg-background border-border">
						<CardHeader className="p-5 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
							<div>
								<CardTitle className="text-base font-semibold">
									Live Service Protection Matrix
								</CardTitle>
								<CardDescription className="text-xs">
									Toggle DDoS rate limiting, OWASP strict headers, connection caps, and response compression on any domain.
								</CardDescription>
							</div>
						</CardHeader>

						<CardContent className="p-0">
							{loadingDomains ? (
								<div className="py-16 text-center text-muted-foreground text-xs">
									Scanning domains...
								</div>
							) : !domains || domains.length === 0 ? (
								<div className="py-16 text-center text-muted-foreground text-xs">
									No domains configured yet. Add a domain to any application or compose service to apply protection.
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow className="text-xs">
											<TableHead>Service & Host</TableHead>
											<TableHead className="text-center">
												OWASP Headers
											</TableHead>
											<TableHead className="text-center">
												Rate Limiter
											</TableHead>
											<TableHead className="text-center">
												Connection Cap
											</TableHead>
											<TableHead className="text-center">
												Gzip / Brotli
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{domains.map((d) => (
											<TableRow key={d.domainId} className="text-xs">
												<TableCell>
													<div className="font-semibold text-foreground">
														{d.serviceName}
													</div>
													<div className="font-mono text-muted-foreground text-[11px] flex items-center gap-1">
														<Globe className="size-3" />
														{d.host}
													</div>
												</TableCell>

												{/* OWASP Strict Headers */}
												<TableCell className="text-center">
													<div className="flex justify-center">
														<Switch
															checked={d.hasStrictHeaders}
															onCheckedChange={() =>
																handleToggleMiddleware(
																	d.domainId,
																	"security-headers-strict",
																	d.hasStrictHeaders,
																)
															}
															disabled={toggleMutation.isPending}
														/>
													</div>
												</TableCell>

												{/* Rate Limiting */}
												<TableCell className="text-center">
													<div className="flex justify-center">
														<Switch
															checked={d.hasRateLimit}
															onCheckedChange={() =>
																handleToggleMiddleware(
																	d.domainId,
																	"rate-limit-standard",
																	d.hasRateLimit,
																)
															}
															disabled={toggleMutation.isPending}
														/>
													</div>
												</TableCell>

												{/* Connection Cap */}
												<TableCell className="text-center">
													<div className="flex justify-center">
														<Switch
															checked={d.hasConnectionLimit}
															onCheckedChange={() =>
																handleToggleMiddleware(
																	d.domainId,
																	"connection-limit-50",
																	d.hasConnectionLimit,
																)
															}
															disabled={toggleMutation.isPending}
														/>
													</div>
												</TableCell>

												{/* Compression */}
												<TableCell className="text-center">
													<div className="flex justify-center">
														<Switch
															checked={d.hasCompression}
															onCheckedChange={() =>
																handleToggleMiddleware(
																	d.domainId,
																	"auto-compress",
																	d.hasCompression,
																)
															}
															disabled={toggleMutation.isPending}
														/>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 2: Linux Kernel & Host Tuning */}
				<TabsContent value="linux" className="pt-4 space-y-4">
					<Card className="bg-background border-border">
						<CardHeader className="p-5 pb-3 border-b border-border">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-base font-semibold flex items-center gap-2">
										<Server className="size-4 text-primary" />
										Linux Kernel & Production Diagnostics
									</CardTitle>
									<CardDescription className="text-xs">
										Automated verification of kernel networking, socket allocations, and Docker daemon configurations.
									</CardDescription>
								</div>
								<Badge variant="outline" className="font-mono text-xs">
									{linuxDiagnostics?.osInfo || "Linux Host"}
								</Badge>
							</div>
						</CardHeader>

						<CardContent className="p-5 space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								{linuxDiagnostics?.metrics.map((metric) => (
									<div
										key={metric.key}
										className="rounded-lg border border-border/80 bg-muted/20 p-3.5 space-y-1.5"
									>
										<div className="flex items-center justify-between">
											<span className="text-xs font-semibold text-foreground">
												{metric.label}
											</span>
											<Badge
												variant={
													metric.status === "optimal"
														? "default"
														: "secondary"
												}
												className={`text-[10px] font-mono uppercase ${
													metric.status === "optimal"
														? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
														: "text-amber-500 bg-amber-500/10 border-amber-500/30"
												}`}
											>
												{metric.status}
											</Badge>
										</div>
										<p className="text-[11px] text-muted-foreground leading-relaxed">
											{metric.description}
										</p>
										<div className="flex items-center justify-between text-xs pt-2 border-t border-border/40 font-mono">
											<span className="text-muted-foreground">
												Current:{" "}
												<span className="text-foreground font-semibold">
													{metric.currentValue}
												</span>
											</span>
											<span className="text-muted-foreground">
												Target:{" "}
												<span className="text-emerald-500 font-semibold">
													{metric.recommendedValue}
												</span>
											</span>
										</div>
									</div>
								))}
							</div>

							{/* Bash Hardening Preview */}
							<div className="rounded-lg border border-border bg-black/60 p-4 space-y-2.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Terminal className="size-4 text-emerald-400" />
										<span className="text-xs font-mono font-medium text-emerald-400">
											Automated Linux Hardening Script
										</span>
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-xs gap-1.5"
										onClick={handleCopyScript}
									>
										{copiedScript ? (
											<Check className="size-3.5 text-emerald-400" />
										) : (
											<Copy className="size-3.5 text-muted-foreground" />
										)}
										Copy Script
									</Button>
								</div>
								<pre className="text-[11px] font-mono text-muted-foreground max-h-[160px] overflow-y-auto p-2 bg-black/40 rounded">
									{hardeningScript}
								</pre>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab 3: Security Profiles Catalog */}
				<TabsContent value="profiles" className="pt-4 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{profiles?.map((profile) => (
							<Card
								key={profile.id}
								className="bg-background border-border flex flex-col justify-between"
							>
								<CardHeader className="p-4 pb-2">
									<div className="flex items-start justify-between gap-2">
										<h4 className="text-xs font-bold text-foreground">
											{profile.name}
										</h4>
										<Badge
											variant="outline"
											className="text-[10px] font-mono shrink-0"
										>
											{profile.badge}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="p-4 pt-1 space-y-2">
									<p className="text-xs text-muted-foreground leading-relaxed">
										{profile.description}
									</p>
									<div className="pt-2 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
										Recommended:{" "}
										<span className="text-foreground font-medium">
											{profile.recommendedFor}
										</span>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};
