import hash from 'object-hash';
import { AppQueryOutput } from '~/types/trpc';

export function getLastRunVersion(app: AppQueryOutput) {
  const scripts = app.scripts.map(({ code, id, filename }) => ({
    id,
    filename,
    code,
  }));
  return hash(
    { id: app.id, name: app.name, scripts },
    {
      algorithm: 'sha1',
    },
  );
}
