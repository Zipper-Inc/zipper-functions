'use client';
import { NextPageWithLayout } from '~/pages/_app';
import DashboardLayout from './layout';
import Header from '../../layouts/header';
import { trpc } from '~/utils/trpc';
import React, { useEffect, useMemo, useState } from 'react';
import { AppOwner, useAppOwner } from '~/hooks/use-app-owner';
import { RouterOutputs } from '~/utils/trpc';
import { useOrganization } from '~/hooks/use-organization';
import {
  SortingState,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { AppletsTable } from './components/applets-table';
import { APPLETS_TABLE_COLUMNS } from './components/applets-table/columns';
import { Button, Input, List, Show } from '@zipper/ui';
import { FiTool, FiRadio } from 'react-icons/fi';
import { PiPlusBold, PiRocket } from 'react-icons/pi';
import Link from 'next/link';
import EmptySlate from './components/empty';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const ZIPPER_STEP_BY_STEP = [
  {
    description:
      'Use applets to quickly build tools for your team, with built-in auth, APIs and storage.',
    icon: <FiTool />,
  },
  {
    description:
      'Create an applet from scratch, fork pre-built applets from the Gallery, or use AI to get a jumpstart on code.',
    icon: <FiRadio />,
  },
  {
    description: 'Share what you build with your team to boost productivity.',
    icon: <PiRocket />,
  },
];

/* -------------------------------------------- */
/* Types                                        */
/* -------------------------------------------- */

export type RouterApp = Unpack<RouterOutputs['app']['byAuthedUser']>;

export type App = RouterApp & {
  createdByInfo: AppOwner;
  updatedAt: Date;
};

/* -------------------------------------------- */
/* Render                                       */
/* -------------------------------------------- */

const Dashboard: NextPageWithLayout = () => {
  /* ------------------ States ------------------ */
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    description: false,
    owner: false,
    slug: false,
  });

  /* ------------------- Hooks ------------------ */
  const { getAppOwner } = useAppOwner();
  const { organization } = useOrganization();

  /* ------------------ Queries ----------------- */
  const { data: orgApps } = trpc.app.byAuthedUser.useQuery({
    filterByOrganization: !appSearchTerm,
  });

  /** TO-DO: Add gallery apps carrousel */
  const { data: galleryApps } = trpc.app.allApproved.useQuery(
    {
      amount: 6,
    },
    { enabled: (orgApps?.length as number) > 3 ?? false },
  );

  /* ------------------- Memos ------------------ */
  const apps = useMemo(() => {
    if (orgApps && orgApps?.length >= 1) {
      return orgApps.map((app): App => {
        const { createdAt, updatedAt, name, slug } = app;
        const lastUpdatedAt = updatedAt || createdAt;
        const appOwner = getAppOwner(app);

        return {
          ...app,
          updatedAt: lastUpdatedAt,
          name: name || slug,
          createdByInfo: appOwner,
        };
      });
    }

    return [] as App[];
  }, [orgApps, getAppOwner]);

  const states = useMemo(
    () => ({
      globalFilter: appSearchTerm,
      sorting,
      columnVisibility,
    }),
    [appSearchTerm, sorting, columnVisibility],
  );

  /* ------------------ Effects ----------------- */
  // useEffect(() => {
  //   appQuery.refetch();
  //   if (!organization && tabIndex > 1) setTabIndex(0);
  // }, [organization]);

  useEffect(() => {
    setColumnVisibility({
      description: false,
      owner: !!appSearchTerm,
      createdBy: !appSearchTerm,
      slug: false,
    });
  }, [appSearchTerm]);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-4 gap-9">
        <section className="col-span-1 flex flex-col gap-6">
          <article className="flex flex-col gap-2">
            <h1 className="text-3xl font-medium">Applets</h1>
            <p>
              Applets that you and other organization members have created
              within this workspace.
            </p>
          </article>

          <span className="flex flex-col gap-5 p-5 bg-secondary/10 text-secondary rounded-sm">
            <h3 className="font-semibold text-lg">
              New to Zipper? Here’s how it works:
            </h3>

            <List
              as="ul"
              className="flex flex-col gap-5"
              data={ZIPPER_STEP_BY_STEP}
            >
              {(props) => (
                <li className="flex items-start gap-3">
                  <figure className="h-10 w-10 border border-secondary flex items-center justify-center rounded-full">
                    {React.cloneElement(props.icon, {
                      className: 'text-secondary text-lg',
                    })}
                  </figure>
                  <p className="flex-1">{props.description}</p>
                </li>
              )}
            </List>
          </span>
        </section>

        <section className="col-span-3 flex flex-col gap-6">
          <div className="flex items-center gap-3 w-full">
            <Input
              placeholder="Search applets (name, slug or description)"
              value={appSearchTerm}
              onChange={(e) => setAppSearchTerm(e.target.value)}
            />
            <Button className="gap-2" asChild>
              <Link href={`/dashboard-tw/create`}>
                <PiPlusBold />
                Create Applet
              </Link>
            </Button>
          </div>
          <Show
            when={apps.length >= 1}
            fallback={<EmptySlate organization={organization} />}
          >
            <AppletsTable
              getSortedRowModel={getSortedRowModel()}
              getFilteredRowModel={getFilteredRowModel()}
              globalFilterFn="includesString"
              data={apps}
              columns={APPLETS_TABLE_COLUMNS}
              state={states}
            />
          </Show>
        </section>
      </div>
    </DashboardLayout>
  );
};

Dashboard.header = () => <Header showDivider={false} showNav showOrgSwitcher />;

export default Dashboard;
