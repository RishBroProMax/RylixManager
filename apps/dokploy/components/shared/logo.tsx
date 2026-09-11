import { cn } from "@/lib/utils";

interface Props {
	className?: string;
	logoUrl?: string;
}

export const Logo = ({ className = "size-14", logoUrl }: Props) => {
	if (logoUrl) {
		return (
			// biome-ignore lint/performance/noImgElement: this is for dynamic logo loading
			<img
				src={logoUrl}
				alt="Organization Logo"
				className={cn(className, "object-contain rounded-sm")}
			/>
		);
	}

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 100"
			fill="none"
			className={className}
		>
			{/* RylixManager Geometric Shield Emblem */}
			<rect
				x="6"
				y="6"
				width="88"
				height="88"
				rx="22"
				className="stroke-primary"
				strokeWidth="6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{/* Modern Architectural 'R' with server core accents */}
			<path
				d="M32 26V74"
				className="stroke-primary"
				strokeWidth="7"
				strokeLinecap="round"
			/>
			<path
				d="M32 30H54C62.8 30 70 37.2 70 46C70 54.8 62.8 62 54 62H32"
				className="stroke-primary"
				strokeWidth="7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M50 62L68 74"
				className="stroke-primary"
				strokeWidth="7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{/* Core Node Dot */}
			<circle
				cx="52"
				cy="46"
				r="4.5"
				className="fill-primary"
			/>
		</svg>
	);
};
