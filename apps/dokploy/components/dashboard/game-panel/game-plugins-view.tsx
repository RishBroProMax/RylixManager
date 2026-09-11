import {
	Check,
	Download,
	ExternalLink,
	Folder,
	Loader2,
	Package,
	Plus,
	Puzzle,
	RefreshCw,
	Search,
	Sparkles,
	Trash2,
	Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/utils/api";

interface Props {
	containerId: string;
	serverId?: string;
	gameType?: string;
}

export const GamePluginsView: React.FC<Props> = ({
	containerId,
	serverId,
	gameType = "minecraft",
}) => {
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [customUrl, setCustomUrl] = useState("");
	const [customFilename, setCustomFilename] = useState("");
	const [customTargetDir, setCustomTargetDir] = useState("/data/plugins");
	const [isCustomOpen, setIsCustomOpen] = useState(false);
	const [installingId, setInstallingId] = useState<string | null>(null);

	// Queries
	const { data: catalog = [] } = api.gameServer.getPluginCatalog.useQuery();
	const {
		data: installedPlugins = [],
		refetch: refetchInstalled,
		isLoading: isLoadingInstalled,
	} = api.gameServer.listInstalledPlugins.useQuery(
		{ containerId, serverId, targetDir: customTargetDir },
		{ enabled: !!containerId },
	);

	// Mutations
	const installMutation = api.gameServer.installPlugin.useMutation();
	const deleteMutation = api.gameServer.deletePlugin.useMutation();

	// Filtered catalog
	const filteredCatalog = useMemo(() => {
		return catalog.filter((plugin) => {
			const matchesCategory =
				selectedCategory === "all" || plugin.category === selectedCategory;
			const matchesSearch =
				plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesCategory && matchesSearch;
		});
	}, [catalog, selectedCategory, searchQuery]);

	const handleInstall = async (plugin: (typeof catalog)[0]) => {
		setInstallingId(plugin.id);
		try {
			const res = await installMutation.mutateAsync({
				containerId,
				downloadUrl: plugin.downloadUrl,
				filename: plugin.filename,
				targetDir: "/data/plugins",
				serverId,
			});

			if (res.success) {
				toast.success(`Installed ${plugin.name} successfully!`);
				refetchInstalled();
			} else {
				toast.error(res.message || "Failed to install plugin");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Installation error");
		} finally {
			setInstallingId(null);
		}
	};

	const handleCustomInstall = async () => {
		if (!customUrl.trim() || !customFilename.trim()) {
			toast.error("Please provide both a download URL and filename");
			return;
		}

		try {
			const res = await installMutation.mutateAsync({
				containerId,
				downloadUrl: customUrl.trim(),
				filename: customFilename.trim(),
				targetDir: customTargetDir.trim(),
				serverId,
			});

			if (res.success) {
				toast.success(`Installed ${customFilename.trim()} successfully!`);
				setCustomUrl("");
				setCustomFilename("");
				setIsCustomOpen(false);
				refetchInstalled();
			} else {
				toast.error(res.message || "Failed to install custom plugin");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Installation error");
		}
	};

	const handleDelete = async (filename: string) => {
		try {
			const res = await deleteMutation.mutateAsync({
				containerId,
				filename,
				targetDir: customTargetDir,
				serverId,
			});

			if (res.success) {
				toast.success(`Removed ${filename}`);
				refetchInstalled();
			} else {
				toast.error(res.message || "Failed to delete plugin");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Deletion error");
		}
	};

	const categories = [
		{ id: "all", label: "All Items" },
		{ id: "permissions", label: "Permissions" },
		{ id: "utility", label: "Utility & Core" },
		{ id: "crossplay", label: "Crossplay" },
		{ id: "performance", label: "Performance" },
		{ id: "building", label: "Building" },
		{ id: "economy", label: "Economy" },
	];

	return (
		<div className="space-y-6">
			{/* Header with Search and Actions */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h3 className="text-base font-semibold tracking-tight flex items-center gap-2">
						<Puzzle className="size-4" />
						Mod & Plugin Marketplace
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Browse, install, and manage curated server plugins and community mods with 1-click execution.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs gap-1.5"
						onClick={() => refetchInstalled()}
						disabled={isLoadingInstalled}
					>
						<RefreshCw
							className={`size-3.5 ${isLoadingInstalled ? "animate-spin" : ""}`}
						/>
						Sync Plugins
					</Button>

					{/* Custom Plugin / Mod Downloader Dialog */}
					<Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
						<DialogTrigger asChild>
							<Button size="sm" className="h-8 text-xs gap-1.5 font-medium">
								<Plus className="size-3.5" />
								Install Custom URL
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[440px]">
							<DialogHeader>
								<DialogTitle className="text-base">
									Install Custom Mod / Plugin
								</DialogTitle>
								<DialogDescription className="text-xs">
									Download any `.jar` or mod archive directly into your server container via HTTP/HTTPS URL.
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-3 py-2">
								<div className="space-y-1">
									<Label className="text-xs">Direct Download URL (.jar / .zip)</Label>
									<Input
										placeholder="https://example.com/files/plugin.jar"
										value={customUrl}
										onChange={(e) => setCustomUrl(e.target.value)}
										className="h-8 text-xs font-mono"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs">Save As Filename</Label>
									<Input
										placeholder="custom-plugin.jar"
										value={customFilename}
										onChange={(e) => setCustomFilename(e.target.value)}
										className="h-8 text-xs font-mono"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs">Target Container Directory</Label>
									<Input
										value={customTargetDir}
										onChange={(e) => setCustomTargetDir(e.target.value)}
										className="h-8 text-xs font-mono"
									/>
								</div>
							</div>

							<DialogFooter>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsCustomOpen(false)}
									className="text-xs"
								>
									Cancel
								</Button>
								<Button
									size="sm"
									onClick={handleCustomInstall}
									disabled={installMutation.isPending}
									className="text-xs gap-1.5"
								>
									{installMutation.isPending ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<Download className="size-3.5" />
									)}
									{installMutation.isPending ? "Downloading..." : "Download & Install"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Search & Category Filter Pills */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="relative w-full sm:w-72">
					<Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search plugins or mods..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="h-8 pl-8 text-xs"
					/>
				</div>

				<div className="flex flex-wrap gap-1">
					{categories.map((c) => (
						<button
							key={c.id}
							type="button"
							onClick={() => setSelectedCategory(c.id)}
							className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
								selectedCategory === c.id
									? "bg-foreground text-background shadow-sm"
									: "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							{c.label}
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 1. Curated Marketplace Catalog (2 Cols) */}
				<div className="lg:col-span-2 space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{filteredCatalog.map((plugin) => {
							const isInstalled = installedPlugins.some(
								(p) =>
									p.toLowerCase() === plugin.filename.toLowerCase() ||
									p.toLowerCase().startsWith(plugin.id.toLowerCase()),
							);
							const isCurrentlyInstalling = installingId === plugin.id;

							return (
								<Card
									key={plugin.id}
									className="bg-background border-border/70 hover:border-border transition-colors flex flex-col justify-between shadow-xs"
								>
									<CardHeader className="p-4 pb-2">
										<div className="flex items-start justify-between gap-2">
											<div className="flex items-center gap-2.5">
												<div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/80 flex items-center justify-center font-mono font-bold text-xs">
													{plugin.iconText}
												</div>
												<div>
													<CardTitle className="text-sm font-semibold tracking-tight">
														{plugin.name}
													</CardTitle>
													<span className="text-[10px] text-muted-foreground font-mono">
														v{plugin.version} • by {plugin.author}
													</span>
												</div>
											</div>
											<Badge
												variant="secondary"
												className="text-[9px] uppercase font-mono tracking-wider h-5"
											>
												{plugin.category}
											</Badge>
										</div>
										<CardDescription className="text-xs line-clamp-2 mt-2">
											{plugin.description}
										</CardDescription>
									</CardHeader>

									<CardContent className="p-4 pt-2">
										<div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
											<span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
												{plugin.filename}
											</span>

											{isInstalled ? (
												<Badge
													variant="outline"
													className="text-[10px] gap-1 font-mono text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
												>
													<Check className="size-3" />
													Installed
												</Badge>
											) : (
												<Button
													size="sm"
													variant="default"
													className="h-7 text-xs gap-1 font-medium"
													onClick={() => handleInstall(plugin)}
													disabled={isCurrentlyInstalling}
												>
													{isCurrentlyInstalling ? (
														<Loader2 className="size-3 animate-spin" />
													) : (
														<Download className="size-3" />
													)}
													{isCurrentlyInstalling ? "Installing..." : "Install"}
												</Button>
											)}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>

					{filteredCatalog.length === 0 && (
						<div className="py-12 text-center rounded-lg border border-dashed border-border p-6">
							<Package className="size-8 mx-auto text-muted-foreground stroke-1 mb-2" />
							<p className="text-xs text-muted-foreground">
								No plugins found matching "{searchQuery}"
							</p>
						</div>
					)}
				</div>

				{/* 2. Installed Plugins Sidebar (1 Col) */}
				<div className="space-y-4">
					<Card className="bg-background border-border shadow-xs">
						<CardHeader className="p-4 pb-3 border-b border-border/60">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<Folder className="size-4 text-muted-foreground" />
									Installed Plugins ({installedPlugins.length})
								</CardTitle>
								<span className="text-[10px] font-mono text-muted-foreground">
									{customTargetDir}
								</span>
							</div>
						</CardHeader>

						<CardContent className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
							{installedPlugins.length === 0 ? (
								<div className="text-center py-8">
									<Package className="size-6 mx-auto text-muted-foreground stroke-1 mb-2" />
									<p className="text-xs text-muted-foreground">
										No plugins installed yet in {customTargetDir}
									</p>
								</div>
							) : (
								installedPlugins.map((pluginFile) => (
									<div
										key={pluginFile}
										className="group flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/40 border border-transparent hover:border-border/60 transition-colors"
									>
										<div className="flex items-center gap-2 min-w-0">
											<div className="size-2 rounded-full bg-emerald-500 shrink-0" />
											<span className="text-xs font-mono truncate">
												{pluginFile}
											</span>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
											onClick={() => handleDelete(pluginFile)}
											title={`Delete ${pluginFile}`}
										>
											<Trash2 className="size-3" />
										</Button>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};
