import {
	ArrowLeft,
	ChevronRight,
	Code2,
	CornerDownLeft,
	Download,
	Eye,
	File,
	FileArchive,
	FileCode2,
	FileEdit,
	FileJson,
	FileText,
	Folder,
	FolderPlus,
	Gamepad2,
	Home,
	Loader2,
	Plus,
	RefreshCw,
	Save,
	Search,
	Server,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
import { CodeEditor } from "@/components/shared/code-editor";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";

interface Props {
	appName: string;
	serverId?: string;
	appType: "stack" | "docker-compose";
	serviceId?: string;
}

const decodeBase64 = (base64: string) => {
	try {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	} catch {
		return new Uint8Array();
	}
};

const joinPath = (base: string, name: string) => {
	if (base === "/") return `/${name}`;
	return `${base.replace(/\/+$/, "")}/${name}`;
};

const getParentPath = (current: string) => {
	if (current === "/" || !current) return "/";
	const parts = current.split("/").filter(Boolean);
	parts.pop();
	return parts.length === 0 ? "/" : `/${parts.join("/")}`;
};

const getFileIcon = (filename: string) => {
	const ext = filename.split(".").pop()?.toLowerCase() || "";
	if (["properties", "cfg", "ini", "toml", "conf"].includes(ext)) {
		return <FileEdit className="size-4 text-emerald-500" />;
	}
	if (["json", "yaml", "yml"].includes(ext)) {
		return <FileJson className="size-4 text-amber-500" />;
	}
	if (["jar", "zip", "tar", "gz"].includes(ext)) {
		return <FileArchive className="size-4 text-purple-500" />;
	}
	if (["txt", "log"].includes(ext)) {
		return <FileText className="size-4 text-blue-500" />;
	}
	return <File className="size-4 text-muted-foreground" />;
};

export const ShowComposeFiles = ({
	appName,
	appType,
	serverId,
	serviceId,
}: Props) => {
	const [currentPath, setCurrentPath] = useState("/");
	const [selectedContainerId, setSelectedContainerId] = useState<string>("");
	const [activeEditingFile, setActiveEditingFile] = useState<string | null>(null);
	const [editorContent, setEditorContent] = useState("");
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [searchFilter, setSearchFilter] = useState("");

	// Modals
	const [newFolderOpen, setNewFolderOpen] = useState(false);
	const [newFolderName, setNewFolderName] = useState("");
	const [newFileOpen, setNewFileOpen] = useState(false);
	const [newFileName, setNewFileName] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
	const [uploadOpen, setUploadOpen] = useState(false);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const utils = api.useUtils();

	// Fetch containers for this service
	const { data: containers, isLoading: loadingContainers } =
		api.docker.getContainersByAppNameMatch.useQuery(
			{ appName, appType, serverId },
			{ enabled: !!appName },
		);

	// Select primary container once loaded
	useEffect(() => {
		if (containers && containers.length > 0 && !selectedContainerId) {
			setSelectedContainerId(containers[0].containerId);
		}
	}, [containers, selectedContainerId]);

	// Fetch files in directory
	const {
		data: rawEntries,
		isLoading: loadingEntries,
		error: entriesError,
		refetch: refetchEntries,
		isRefetching,
	} = api.docker.listContainerFiles.useQuery(
		{
			containerId: selectedContainerId,
			path: currentPath,
			serverId,
		},
		{
			enabled: !!selectedContainerId,
			retry: false,
		},
	);

	// Fetch file content if editing
	const {
		data: fileData,
		isLoading: loadingFile,
		error: fileError,
	} = api.docker.readContainerFile.useQuery(
		{
			containerId: selectedContainerId,
			path: activeEditingFile || "/",
			serverId,
		},
		{
			enabled: !!selectedContainerId && !!activeEditingFile,
			retry: false,
		},
	);

	useEffect(() => {
		if (fileData?.content) {
			const bytes = decodeBase64(fileData.content);
			const text = new TextDecoder().decode(bytes);
			setEditorContent(text);
			setHasUnsavedChanges(false);
		}
	}, [fileData]);

	// Mutations
	const writeMutation = api.docker.writeContainerFile.useMutation();
	const deleteMutation = api.docker.deleteContainerFile.useMutation();
	const mkdirMutation = api.docker.createContainerDirectory.useMutation();

	// Filter entries
	const entries = useMemo(() => {
		if (!rawEntries) return [];
		if (!searchFilter.trim()) return rawEntries;
		return rawEntries.filter((item) =>
			item.name.toLowerCase().includes(searchFilter.toLowerCase()),
		);
	}, [rawEntries, searchFilter]);

	// Save file content
	const handleSaveFile = async () => {
		if (!selectedContainerId || !activeEditingFile) return;

		try {
			await writeMutation.mutateAsync({
				containerId: selectedContainerId,
				path: activeEditingFile,
				content: editorContent,
				serverId,
			});
			setHasUnsavedChanges(false);
			toast.success(`Saved ${activeEditingFile.split("/").pop()}`);
			await utils.docker.readContainerFile.invalidate();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to save file",
			);
		}
	};

	// Create directory
	const handleCreateFolder = async () => {
		if (!selectedContainerId || !newFolderName.trim()) return;
		const targetDir = joinPath(currentPath, newFolderName.trim());

		try {
			await mkdirMutation.mutateAsync({
				containerId: selectedContainerId,
				path: targetDir,
				serverId,
			});
			toast.success(`Folder created: ${newFolderName}`);
			setNewFolderName("");
			setNewFolderOpen(false);
			refetchEntries();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to create folder",
			);
		}
	};

	// Create new empty file
	const handleCreateFile = async () => {
		if (!selectedContainerId || !newFileName.trim()) return;
		const targetFile = joinPath(currentPath, newFileName.trim());

		try {
			await writeMutation.mutateAsync({
				containerId: selectedContainerId,
				path: targetFile,
				content: "",
				serverId,
			});
			toast.success(`File created: ${newFileName}`);
			setNewFileName("");
			setNewFileOpen(false);
			refetchEntries();
			setActiveEditingFile(targetFile);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to create file",
			);
		}
	};

	// Delete file or folder
	const handleDelete = async () => {
		if (!selectedContainerId || !deleteTarget) return;

		try {
			await deleteMutation.mutateAsync({
				containerId: selectedContainerId,
				path: deleteTarget,
				serverId,
			});
			toast.success("Deleted successfully");
			setDeleteTarget(null);
			if (activeEditingFile === deleteTarget) {
				setActiveEditingFile(null);
			}
			refetchEntries();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete item",
			);
		}
	};

	// Download file
	const handleDownloadFile = (filePath: string) => {
		if (!fileData?.content) return;
		const bytes = decodeBase64(fileData.content);
		const blob = new Blob([bytes], { type: "application/octet-stream" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filePath.split("/").pop() || "download";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	// Handle file upload
	const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0 || !selectedContainerId) return;

		setUploading(true);
		let successCount = 0;

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const content = await file.text();
				const target = joinPath(currentPath, file.name);

				await writeMutation.mutateAsync({
					containerId: selectedContainerId,
					path: target,
					content,
					serverId,
				});
				successCount++;
			}
			toast.success(`Uploaded ${successCount} file(s)`);
			refetchEntries();
			setUploadOpen(false);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Error uploading file",
			);
		} finally {
			setUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	// Breadcrumb elements
	const pathSegments = useMemo(() => {
		if (currentPath === "/") return [];
		return currentPath.split("/").filter(Boolean);
	}, [currentPath]);

	if (loadingContainers) {
		return (
			<div className="flex items-center justify-center min-h-[300px]">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!containers || containers.length === 0) {
		return (
			<Card className="bg-background border-border">
				<CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
					<Gamepad2 className="size-10 text-muted-foreground stroke-1" />
					<h3 className="text-base font-semibold">No Running Container Found</h3>
					<p className="text-xs text-muted-foreground max-w-sm">
						Deploy or start your game server or compose service to browse, edit, and upload server configuration files.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="bg-background border-border shadow-xs">
			<CardHeader className="p-5 pb-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Gamepad2 className="size-5 text-primary" />
						<CardTitle className="text-lg font-semibold tracking-tight">
							Game & Server File Manager
						</CardTitle>
						<Badge variant="outline" className="text-[10px] font-mono">
							Live Container
						</Badge>
					</div>
					<CardDescription className="text-xs">
						Live file browser, configuration editor, and plugin manager for game servers and containers.
					</CardDescription>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{containers.length > 1 && (
						<Select
							value={selectedContainerId}
							onValueChange={setSelectedContainerId}
						>
							<SelectTrigger className="h-8 text-xs w-[180px]">
								<SelectValue placeholder="Select Container" />
							</SelectTrigger>
							<SelectContent>
								{containers.map((c) => (
									<SelectItem key={c.containerId} value={c.containerId}>
										<span className="font-mono text-xs">{c.name}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}

					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs gap-1.5"
						onClick={() => refetchEntries()}
						disabled={isRefetching}
					>
						<RefreshCw
							className={cn("size-3.5", isRefetching && "animate-spin")}
						/>
						Refresh
					</Button>

					<Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
						<DialogTrigger asChild>
							<Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
								<FolderPlus className="size-3.5" />
								New Folder
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Create New Folder</DialogTitle>
								<DialogDescription>
									Create a folder inside <code className="font-mono text-xs">{currentPath}</code>
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-2 py-2">
								<Label className="text-xs">Folder Name</Label>
								<Input
									placeholder="e.g. plugins or mods"
									value={newFolderName}
									onChange={(e) => setNewFolderName(e.target.value)}
									className="h-9 text-xs"
								/>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setNewFolderOpen(false)}
								>
									Cancel
								</Button>
								<Button onClick={handleCreateFolder}>Create Folder</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					<Dialog open={newFileOpen} onOpenChange={setNewFileOpen}>
						<DialogTrigger asChild>
							<Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
								<Plus className="size-3.5" />
								New File
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Create New File</DialogTitle>
								<DialogDescription>
									Create a file in <code className="font-mono text-xs">{currentPath}</code>
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-2 py-2">
								<Label className="text-xs">Filename</Label>
								<Input
									placeholder="e.g. ops.json or whitelist.json"
									value={newFileName}
									onChange={(e) => setNewFileName(e.target.value)}
									className="h-9 text-xs"
								/>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setNewFileOpen(false)}
								>
									Cancel
								</Button>
								<Button onClick={handleCreateFile}>Create File</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					<Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
						<DialogTrigger asChild>
							<Button size="sm" className="h-8 text-xs gap-1.5">
								<Upload className="size-3.5" />
								Upload
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Upload File to Server</DialogTitle>
								<DialogDescription>
									Upload configs, plugins (.jar), or world files to{" "}
									<code className="font-mono text-xs">{currentPath}</code>
								</DialogDescription>
							</DialogHeader>
							<div className="py-4 space-y-3">
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleUploadFiles}
									className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
								/>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</CardHeader>

			{/* Quick Jump Bar for Common Game Server Configs */}
			<div className="px-5 py-2.5 bg-muted/20 border-b border-border/60 flex flex-wrap items-center gap-2 text-xs">
				<span className="text-muted-foreground text-[11px] font-medium">
					Game Presets:
				</span>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono hover:bg-background"
					onClick={() => {
						setCurrentPath("/data");
						setActiveEditingFile("/data/server.properties");
					}}
				>
					MC: server.properties
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono hover:bg-background"
					onClick={() => {
						setCurrentPath("/data");
						setActiveEditingFile("/data/ops.json");
					}}
				>
					MC: ops.json
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono hover:bg-background"
					onClick={() => {
						setCurrentPath("/data/plugins");
						setActiveEditingFile(null);
					}}
				>
					MC: /plugins/
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono hover:bg-background"
					onClick={() => {
						setCurrentPath("/steamcmd/rust");
						setActiveEditingFile(null);
					}}
				>
					Rust: /steamcmd/rust
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono hover:bg-background"
					onClick={() => {
						setCurrentPath("/config");
						setActiveEditingFile(null);
					}}
				>
					Valheim: /config
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-2 text-[11px] font-mono hover:bg-background"
					onClick={() => {
						setCurrentPath("/palworld");
						setActiveEditingFile(null);
					}}
				>
					Palworld: /palworld
				</Button>
			</div>

			<CardContent className="p-0">
				{activeEditingFile ? (
					/* Editor View */
					<div className="flex flex-col h-[65vh]">
						<div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/10">
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 gap-1 text-xs"
									onClick={() => {
										if (
											hasUnsavedChanges &&
											!confirm("You have unsaved changes. Discard?")
										) {
											return;
										}
										setActiveEditingFile(null);
									}}
								>
									<ArrowLeft className="size-3.5" />
									Back to Files
								</Button>
								<span className="text-border">|</span>
								<span className="font-mono text-xs font-medium">
									{activeEditingFile}
								</span>
								{hasUnsavedChanges && (
									<Badge
										variant="secondary"
										className="text-[10px] px-1.5 py-0 text-amber-500"
									>
										Modified
									</Badge>
								)}
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									className="h-8 text-xs gap-1.5"
									onClick={() => handleDownloadFile(activeEditingFile)}
								>
									<Download className="size-3.5" />
									Download
								</Button>
								<Button
									size="sm"
									className="h-8 text-xs gap-1.5"
									onClick={handleSaveFile}
									disabled={writeMutation.isPending}
								>
									{writeMutation.isPending ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<Save className="size-3.5" />
									)}
									Save File
								</Button>
							</div>
						</div>

						<div className="flex-1 overflow-hidden relative">
							{loadingFile ? (
								<div className="flex items-center justify-center h-full">
									<Loader2 className="size-6 animate-spin text-muted-foreground" />
								</div>
							) : (
								<CodeEditor
									value={editorContent}
									onChange={(val) => {
										setEditorContent(val);
										setHasUnsavedChanges(true);
									}}
									language="json"
									className="h-full w-full"
								/>
							)}
						</div>
					</div>
				) : (
					/* Directory Browser View */
					<div className="flex flex-col min-h-[50vh]">
						{/* Path & Search Bar */}
						<div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/5">
							<div className="flex items-center gap-1.5 font-mono text-xs overflow-x-auto whitespace-nowrap py-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={() => setCurrentPath("/")}
								>
									<Home className="size-3.5 text-muted-foreground" />
								</Button>
								<span className="text-muted-foreground">/</span>

								{pathSegments.map((segment, idx) => {
									const segmentPath = `/${pathSegments.slice(0, idx + 1).join("/")}`;
									const isLast = idx === pathSegments.length - 1;
									return (
										<React.Fragment key={segmentPath}>
											<button
												onClick={() => setCurrentPath(segmentPath)}
												className={cn(
													"hover:underline px-1 py-0.5 rounded text-xs",
													isLast
														? "font-semibold text-foreground"
														: "text-muted-foreground",
												)}
											>
												{segment}
											</button>
											{!isLast && (
												<span className="text-muted-foreground">/</span>
											)}
										</React.Fragment>
									);
								})}
							</div>

							<div className="relative w-full sm:w-[220px]">
								<Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search current directory..."
									value={searchFilter}
									onChange={(e) => setSearchFilter(e.target.value)}
									className="pl-8 h-8 text-xs"
								/>
							</div>
						</div>

						{/* File List */}
						<ScrollArea className="h-[55vh]">
							<div className="divide-y divide-border/60">
								{/* Parent directory link if not in root */}
								{currentPath !== "/" && (
									<div
										onClick={() => setCurrentPath(getParentPath(currentPath))}
										className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/40 cursor-pointer transition-colors text-xs font-mono text-muted-foreground"
									>
										<CornerDownLeft className="size-4" />
										<span>.. (parent directory)</span>
									</div>
								)}

								{loadingEntries ? (
									<div className="flex items-center justify-center py-16">
										<Loader2 className="size-6 animate-spin text-muted-foreground" />
									</div>
								) : entries.length === 0 ? (
									<div className="text-center py-16 text-muted-foreground text-xs">
										Folder is empty
									</div>
								) : (
									entries.map((item) => {
										const fullItemPath = joinPath(currentPath, item.name);
										return (
											<div
												key={item.name}
												className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/40 transition-colors group text-xs"
											>
												<div
													onClick={() => {
														if (item.isDirectory) {
															setCurrentPath(fullItemPath);
														} else {
															setActiveEditingFile(fullItemPath);
														}
													}}
													className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
												>
													{item.isDirectory ? (
														<Folder className="size-4 text-primary fill-primary/10 shrink-0" />
													) : (
														getFileIcon(item.name)
													)}
													<span
														className={cn(
															"truncate font-mono",
															item.isDirectory
																? "font-semibold text-foreground"
																: "text-foreground/90",
														)}
													>
														{item.name}
													</span>
												</div>

												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
													{!item.isDirectory && (
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7"
															onClick={() =>
																setActiveEditingFile(fullItemPath)
															}
															title="Edit file"
														>
															<FileCode2 className="size-3.5" />
														</Button>
													)}
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
														onClick={() => setDeleteTarget(fullItemPath)}
														title="Delete"
													>
														<Trash2 className="size-3.5" />
													</Button>
												</div>
											</div>
										);
									})
								)}
							</div>
						</ScrollArea>
					</div>
				)}
			</CardContent>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Confirmation</DialogTitle>
						<DialogDescription>
							Are you sure you want to permanently delete{" "}
							<code className="font-mono text-xs text-foreground">
								{deleteTarget}
							</code>
							? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteTarget(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
};
