'use client';

import { Button, cn, Show } from '@zipper/ui';
import Link from 'next/link';
import React, { useState } from 'react';
import AppAvatar from '~/components/app-avatar';
import { RouterOutputs } from '~/utils/trpc';

type GalleryItemProps = {
  app: Unpack<GalleryAppQueryOutput>;
};

export type GalleryAppQueryOutput =
  | RouterOutputs['app']['allApproved']
  | RouterOutputs['app']['byResourceOwner'];

export const AppletCard: React.FC<GalleryItemProps> = ({ app }) => {
  const [isShowingActions, setIsShowingActions] = useState(false);

  return (
    <div
      className="h-40 border border-border rounded-sm grid grid-cols-[96px,1fr] gap-6 p-6"
      onMouseEnter={() => setIsShowingActions(true)}
      onMouseLeave={() => setIsShowingActions(false)}
    >
      <figure className="aspect-square">
        <AppAvatar nameOrSlug={app.name || app.slug} />
      </figure>
      <div className="h-full flex flex-col justify-between transition-all">
        <article className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">{app.name ?? app.slug}</h1>
          <i className="font-medium">by {app.resourceOwner.slug}</i>
          <Show
            when={isShowingActions}
            fallback={<p className="text-gray-400">{app.description}</p>}
          >
            <footer className={cn('flex items-center gap-3 w-fit')}>
              <Link href={`/${app.resourceOwner.slug}/${app.slug}`}>
                <Button
                  variant="outline-primary"
                  className="flex items-center gap-1"
                >
                  Open applet
                </Button>
              </Link>
              <Link href={`/gallery/${app.resourceOwner.slug}/${app.slug}`}>
                <Button variant="ghost-primary">Learn more</Button>
              </Link>
            </footer>
          </Show>
        </article>
      </div>
    </div>
  );
};
