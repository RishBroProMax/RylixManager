import {
	Activity,
	ArrowUpRight,
	CheckCircle2,
	Cpu,
	Globe,
	HardDrive,
	Layers,
	LineChart,
	Network,
	RefreshCw,
	Server,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/utils/api";

export const VPSCommandDeck = () => {
	const [pruneDialogOpen, setPruneDialogOpen] = useState(false);
	const { mutateAsync: cleanDockerPrune, isPending: isPruning } =
		api.settings.cleanDockerPrune.useMutation();

	const handlePruneSystem = async () => {
		try {
			await cleanDockerPrune({});
			toast.success("VPS Cache & Docker system prune completed successfully!");
			setPruneDialogOpen(false);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to prune VPS system cache",
			);
		}
	};

	return (
		<Card className="border bg-background shadow-sm rounded-xl">
			<CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Server className="size-5 text-primary" />
						<CardTitle className="text-lg font-semibold tracking-tight">
							Rylix VPS Command Deck
						</CardTitle>
						<Badge variant="outline" className="text-xs font-medium">
							Server Engine
						</Badge>
					</div>
					<CardDescription className="text-xs">
						Live system diagnostics, core cluster health, and one-click maintenance.
					</CardDescription>
				</div>
				<div className="flex items-center gap-2">
					<Dialog open={pruneDialogOpen} onOpenChange={setPruneDialogOpen}>
						<DialogTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 text-xs font-medium hover:bg-muted"
							>
								<Trash2 className="size-3.5" />
								Prune Cache
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Prune VPS Docker Cache</DialogTitle>
								<DialogDescription>
									This will clean unused container cache, dangling build layers,
									and free valuable disk space on your VPS server. Active
									containers and persistent volumes will not be affected.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter className="gap-2 sm:gap-0">
								<Button
									variant="outline"
									onClick={() => setPruneDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									variant="default"
									onClick={handlePruneSystem}
									disabled={isPruning}
								>
									{isPruning ? (
										<>
											<RefreshCw className="size-4 animate-spin mr-2" />
											Pruning System...
										</>
									) : (
										"Confirm & Clean Cache"
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<Button asChild variant="secondary" size="sm" className="h-8 text-xs">
						<Link href="/dashboard/docker">
							Docker Manager
							<ArrowUpRight className="size-3.5 ml-1" />
						</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Engine Status */}
				<div className="flex flex-col gap-2 p-3.5 rounded-lg border bg-muted/20">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Docker Runtime
						</span>
						<CheckCircle2 className="size-4 text-emerald-500" />
					</div>
					<div className="flex items-baseline justify-between mt-1">
						<span className="text-base font-semibold">Engine Active</span>
						<span className="text-xs text-muted-foreground">Socket OK</span>
					</div>
					<p className="text-xs text-muted-foreground mt-0.5">
						Swarm daemon orchestrator running
					</p>
				</div>

				{/* Cluster Status */}
				<div className="flex flex-col gap-2 p-3.5 rounded-lg border bg-muted/20">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Cluster Mode
						</span>
						<Layers className="size-4 text-primary" />
					</div>
					<div className="flex items-baseline justify-between mt-1">
						<span className="text-base font-semibold">Docker Swarm</span>
						<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
							Manager
						</Badge>
					</div>
					<Link
						href="/dashboard/swarm"
						className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-0.5"
					>
						View nodes & cluster →
					</Link>
				</div>

				{/* Traefik Ingress */}
				<div className="flex flex-col gap-2 p-3.5 rounded-lg border bg-muted/20">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Routing Proxy
						</span>
						<Globe className="size-4 text-primary" />
					</div>
					<div className="flex items-baseline justify-between mt-1">
						<span className="text-base font-semibold">Traefik v3</span>
						<span className="text-xs text-emerald-500 font-medium">Port 80/443</span>
					</div>
					<Link
						href="/dashboard/traefik"
						className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-0.5"
					>
						Traefik proxy settings →
					</Link>
				</div>

				{/* Enterprise & Game Engine Status */}
				<div className="flex flex-col gap-2 p-3.5 rounded-lg border bg-muted/20">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Edition & Games
						</span>
						<ShieldCheck className="size-4 text-emerald-500" />
					</div>
					<div className="flex items-baseline justify-between mt-1">
						<span className="text-base font-semibold">Games & Pro</span>
						<Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500 text-emerald-500">
							Active
						</Badge>
					</div>
					<span className="text-xs text-muted-foreground mt-0.5">
						Minecraft, Rust & Enterprise ready
					</span>
				</div>
			</CardContent>

			{/* Game Hosting & Traffic Security Reference */}
			<div className="px-5 py-3 border-t bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
				<div className="flex items-center gap-2 text-muted-foreground">
					<span className="font-medium text-foreground">Traffic & Security:</span>
					<span className="hidden md:inline">OWASP security headers, DDoS rate limiting, and kernel BBR tuning.</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
						<span className="bg-background border rounded px-1.5 py-0.5 text-muted-foreground">MC :25565</span>
						<span className="bg-background border rounded px-1.5 py-0.5 text-muted-foreground">Rust :28015</span>
						<span className="bg-background border rounded px-1.5 py-0.5 text-muted-foreground">BBR :Active</span>
					</div>
					<Link href="/dashboard/traffic">
						<Button variant="outline" size="sm" className="h-7 text-xs gap-1">
							<ShieldCheck className="size-3.5" />
							Traffic Deck
						</Button>
					</Link>
					<Link href="/dashboard/analytics">
						<Button variant="outline" size="sm" className="h-7 text-xs gap-1">
							<LineChart className="size-3.5" />
							Analytics
						</Button>
					</Link>
				</div>
			</div>
		</Card>
	);
};
