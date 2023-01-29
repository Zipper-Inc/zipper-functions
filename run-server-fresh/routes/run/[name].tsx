import { PageProps, Handlers } from '$fresh/server.ts';
import { config } from 'dotenv';
import { AppInfoResult } from '../../../src/types/app-info.ts';
import AppPage, { AppPageProps } from '../../components/app-page.tsx';

const { NEXT_API_URL } = config({ path: '../.env' });

export const handler: Handlers<AppPageProps> = {
  async GET(_req, ctx) {
    const [slug, version] = ctx.params.name.split('@');

    if (!slug) return ctx.renderNotFound();

    const result = (await fetch(`${NEXT_API_URL}/app/info/${slug}`).then((r) =>
      r.json(),
    )) as AppInfoResult;

    if (!result.ok) return ctx.renderNotFound();

    return ctx.render({ ...result.data, version });
  },
};

export default function RunPage({
  data: appPageProps,
}: PageProps<AppPageProps>) {
  return <AppPage {...appPageProps} />;
}
