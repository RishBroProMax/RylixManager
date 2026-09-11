import { validateRequest } from "@dokploy/server/lib/auth";
import { createServerSideHelpers } from "@trpc/react-query/server";
import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";
import superjson from "superjson";
import { VercelAnalyticsDashboard } from "@/components/dashboard/analytics/vercel-analytics-dashboard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ServerFilter } from "@/components/shared/server-filter";
import { appRouter } from "@/server/api/root";

const AnalyticsPage = () => {
	return (
		<ServerFilter>
			{(serverId) => <VercelAnalyticsDashboard serverId={serverId} />}
		</ServerFilter>
	);
};

AnalyticsPage.getLayout = (page: ReactElement) => {
	return (
		<DashboardLayout metaName="Traffic Analytics">
			{page}
		</DashboardLayout>
	);
};

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const { user, session } = await validateRequest(ctx.req);
	if (!user) {
		return {
			redirect: {
				permanent: false,
				destination: "/",
			},
		};
	}
	const { req, res } = ctx;

	const helpers = createServerSideHelpers({
		router: appRouter,
		ctx: {
			req: req as any,
			res: res as any,
			db: null as any,
			session: session as any,
			user: user as any,
		},
		transformer: superjson,
	});
	try {
		return {
			props: {
				trpcState: helpers.dehydrate(),
			},
		};
	} catch {
		return {
			props: {},
		};
	}
}

export default AnalyticsPage;
