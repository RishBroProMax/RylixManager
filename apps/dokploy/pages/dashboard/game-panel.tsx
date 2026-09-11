import { validateRequest } from "@dokploy/server/lib/auth";
import { createServerSideHelpers } from "@trpc/react-query/server";
import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";
import superjson from "superjson";
import { GamePanelDashboard } from "@/components/dashboard/game-panel/game-panel-dashboard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { appRouter } from "@/server/api/root";

const GamePanelPage = () => {
	return <GamePanelDashboard />;
};

GamePanelPage.getLayout = (page: ReactElement) => {
	return <DashboardLayout metaName="Game Control Panel">{page}</DashboardLayout>;
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
		const userPermissions = await helpers.user.getPermissions.fetch();

		if (!userPermissions?.service.read) {
			return {
				redirect: {
					permanent: false,
					destination: "/",
				},
			};
		}
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

export default GamePanelPage;
