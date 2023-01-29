import { config } from 'dotenv';
// import { AppInfoResult } from '~/types/app-info.ts';
import AppPage, { AppPageProps } from '../../components/app-page.tsx';

const { NEXT_API_URL } = config({ path: '../.env' });

/*
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
*/

const response = {
  ok: true,
  data: {
    app: {
      id: '2fff3d67-8d7d-443e-b191-c0d0aa18eb50',
      name: null,
      slug: 'remote-work-dashboard',
      description: null,
      lastDeploymentVersion: '1674237013115',
    },
    inputs: [
      { key: 'worldString', type: 'string', optional: false },
      { key: 'count', type: 'number', optional: false },
      { key: 'display', type: 'boolean', optional: false },
      { key: 'obj', type: 'any', optional: false },
      { key: 'arr', type: 'array', optional: false },
      { key: 'date', type: 'date', optional: false },
    ],
  },
};

export default function () {
  const { data } = response;
  const version = null;
  return <AppPage app={data.app} version={version} inputs={data.inputs} />;
}
