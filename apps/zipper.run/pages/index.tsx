import { GetServerSideProps } from 'next';
import { AppInfoAndInputParams } from '../../zipper.works/src/types/app-info';

export default function ZipperRun({ app, inputs }: AppInfoAndInputParams) {
  return (
    <div>
      <h1>{app.name || app.slug}</h1>
      {app.description && <p>{app.description}</p>}
      <code>{JSON.stringify(inputs, null, 2)}</code>
    </div>
  );
}

/**
 * Just making this up for now, but this list will have to live somewhere
 * We should also prevent people from naming their app this list
 */
const NON_ALLOWED_SUBDOMAINS = ['www', 'app'];

const { ZIPPER_API_URL } = process.env;

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const { host } = req.headers;
  const subdomain = host?.split('.').shift();

  if (!subdomain || NON_ALLOWED_SUBDOMAINS.includes(subdomain))
    return { notFound: true };

  const result = await fetch(`${ZIPPER_API_URL}/app/info`, {
    method: 'POST',
    body: JSON.stringify({ slug: subdomain }),
  }).then((r) => r.json());

  if (!result.ok) {
    return { notFound: true };
  }

  return { props: result.data };
};
