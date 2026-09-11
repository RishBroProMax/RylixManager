import { IS_CLOUD } from "@dokploy/server/constants";
import { validateRequest } from "@dokploy/server/lib/auth";
import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";
import { VercelAnalyticsDashboard } from "@/components/dashboard/analytics/vercel-analytics-dashboard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ServerFilter } from "@/components/shared/server-filter";

export default function Requests() {
	return (
		<ServerFilter>
			{(serverId) => <VercelAnalyticsDashboard serverId={serverId} />}
		</ServerFilter>
	);
}
Requests.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};
export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{ serviceId: string }>,
) {
	if (IS_CLOUD) {
		return {
			redirect: {
				permanent: false,
				destination: "/dashboard/home",
			},
		};
	}
	const { user } = await validateRequest(ctx.req);
	if (!user) {
		return {
			redirect: {
				permanent: false,
				destination: "/",
			},
		};
	}

	return {
		props: {},
	};
}
