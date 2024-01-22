import { Button, ZipperSymbol } from '@zipper/ui';
import Link from 'next/link';
import { SessionOrganization } from '~/pages/api/auth/[...nextauth]';

interface EmptySlateProps {
  organization: SessionOrganization | undefined | null;
}

function EmptySlate({ organization }: EmptySlateProps) {
  const CREATE_ZIPLET_ROUTE = `/dashboard-tw/create`;

  return (
    <section className="w-full flex flex-col items-center h-full justify-center gap-6">
      <figure className="w-20 h-20 rounded-sm flex items-center justify-center border border-disabled bg-disabled/10">
        <ZipperSymbol className="fill-foreground" />
      </figure>
      <article className="lg:max-w-[600px] flex flex-col items-center gap-3">
        <h1 className="text-2xl font-semibold">
          Create {organization ? organization.name + "'s" : 'your'} first Ziplet
        </h1>
        <p className="text-center">
          Write some code to solve a problem or explore an idea. <br />
          We'll deploy your functions, give you a URL, and generate a web UI and
          API for you to use.
        </p>
      </article>

      <Button asChild>
        <Link href={CREATE_ZIPLET_ROUTE}>Create Zipplet</Link>
      </Button>
    </section>
  );
}

export default EmptySlate;
