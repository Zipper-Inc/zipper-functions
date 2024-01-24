import AppAvatar from '~/components/app-avatar';
import { App } from '../../page';
import Link from 'next/link';
import { getEditAppletLink } from '@zipper/utils';
import { createColumnHelper } from '@tanstack/react-table';
import { Button, Show, Tooltip } from '@zipper/ui';
import {
  PiBuildings,
  PiLockSimple,
  PiLockSimpleOpen,
  PiUser,
} from 'react-icons/pi';
import React from 'react';
import { ResourceOwnerType } from '@zipper/types';
import { CaretSortIcon } from '@radix-ui/react-icons';

const columnHelper = createColumnHelper<App>();

/* -------------------------------------------- */
/* Types                                        */
/* -------------------------------------------- */

type ColumnComponentType<T extends keyof App> = React.FC<
  Pick<App, T> & { getValue: () => any }
>;

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

const AppletNameColumn: ColumnComponentType<
  'slug' | 'isPrivate' | 'description' | 'resourceOwner'
> = (props) => (
  <div className="flex items-center gap-4">
    <figure className="w-16 h-16 min-h-16">
      <AppAvatar nameOrSlug={props.slug} />
    </figure>
    <article className="flex flex-col items-start">
      <Tooltip.Provider>
        <Link
          className="flex items-center gap-2"
          href={getEditAppletLink(props.resourceOwner.slug, props.slug)}
        >
          <h3 className="text-lg font-semibold hover:underline">
            {props.getValue()}
          </h3>
          <Tooltip>
            <Tooltip.Trigger className="text-secondary">
              <Show when={props.isPrivate} fallback={<PiLockSimpleOpen />}>
                <PiLockSimple />
              </Show>
            </Tooltip.Trigger>
            <Tooltip.Content className="text-xs">
              <Show when={props.isPrivate} fallback={<p>Open-Source</p>}>
                <p>Private Code</p>
              </Show>
            </Tooltip.Content>
          </Tooltip>
        </Link>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <p className="whitespace-pre-line">{props.description}</p>
          </Tooltip.Trigger>
          <Tooltip.Content className="text-xs">
            <p>{props.description}</p>
          </Tooltip.Content>
        </Tooltip>
      </Tooltip.Provider>
    </article>
  </div>
);

const AppletCreatedByColumn: ColumnComponentType<'createdByInfo'> = (props) => {
  if (props.getValue()) {
    return (
      <div className="flex items-center gap-2">
        <PiUser />
        <p>You</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <PiBuildings />
      <p>{props.createdByInfo.resourceOwnerName}</p>
    </div>
  );
};

const AppletOwnerColumn: ColumnComponentType<'createdByInfo'> = (props) => (
  <div className="flex items-center gap-2">
    <Show
      when={props.createdByInfo.resourceOwnerType === ResourceOwnerType.User}
      fallback={<p>{props.getValue()}</p>}
    >
      <PiUser />
    </Show>
  </div>
);

/* -------------------------------------------- */
/* Render                                       */
/* -------------------------------------------- */

export const APPLETS_TABLE_COLUMNS = [
  columnHelper.accessor('name', {
    cell: (info) => (
      <AppletNameColumn getValue={info.getValue} {...info.cell.row.original} />
    ),
    header: 'Name',
  }),
  columnHelper.accessor('createdByInfo.createdByAuthedUser', {
    cell: (info) => (
      <AppletCreatedByColumn
        getValue={info.getValue}
        {...info.cell.row.original}
      />
    ),
    header: 'Created by',
    enableGlobalFilter: false,
    size: 52,
  }),
  columnHelper.accessor('resourceOwner.slug', {
    id: 'owner',
    cell: (info) => (
      <AppletOwnerColumn getValue={info.getValue} {...info.cell.row.original} />
    ),
    header: 'Owner',
    size: 52,
  }),
  columnHelper.accessor('updatedAt', {
    cell: (info) =>
      new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'short',
      }).format(info.getValue()),
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-5"
        onClick={() => column.getToggleGroupingHandler()}
      >
        Last Updated at
        <CaretSortIcon className="ml-2 h-4 w-4" />
      </Button>
    ),

    enableGlobalFilter: false,
  }),
  columnHelper.accessor('description', {
    cell: (info) => info.getValue(),
    header: 'Description',
  }),
  columnHelper.accessor('slug', {
    cell: (info) => info.getValue(),
  }),
];
