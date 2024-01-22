'use client';
import { Divider } from '@chakra-ui/react';
import { Button, Input, Label } from '@zipper/ui';
import { getZipperDotDevUrl } from '@zipper/utils';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import Header from '~/components/app-dir/layouts/header';
import SlackInstallButton from '~/components/dashboard/slack-install-button';
import { useOrganization } from '~/hooks/use-organization';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';
import SettingsLayout from './layout';

const GeneralSettingsPage: NextPageWithLayout = () => {
  /* ------------------- Hooks ------------------ */
  const { organization } = useOrganization();
  const router = useRouter();

  /* ------------------ States ------------------ */
  const [disabled, setDisabled] = useState(false);
  const [orgName, setOrgName] = useState(organization?.name || '');

  /* ------------------ Queries ----------------- */
  const organizationSlugQuery =
    trpc.resourceOwnerSlug.findByOrganizationId.useQuery(
      { organizationId: organization?.id || '' },
      { enabled: !!organization },
    );

  /* ------------------ Effects ----------------- */
  useEffect(() => {
    setOrgName(organization?.name || '');
  }, [organization?.name]);

  /* ----------------- Callbacks ---------------- */
  const handleOrgNameSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();
      setDisabled(true);

      await organization?.update({ name: orgName });

      setDisabled(false);
    },
    [setDisabled, organization, orgName, router],
  );

  /* ------------------ Render ------------------ */
  return (
    <SettingsLayout>
      <section className="w-full flex flex-col gap-3">
        <h3 className="text-xl font-medium">General</h3>
        <Divider />

        <form onSubmit={handleOrgNameSubmit} className="flex flex-col gap-3">
          <Label htmlFor="organization-name">Organization Name</Label>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Input
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                id="organization-name"
              />
              <Button disabled={disabled} type="submit">
                Save
              </Button>
            </div>
            <span className="text-sm">
              {`This is the display name for your organization. It does not change
            the url: ${getZipperDotDevUrl().origin}/${
                organizationSlugQuery.data?.slug
              }`}
            </span>
          </div>
        </form>
      </section>

      <section className="w-full flex flex-col gap-3">
        <h3 className="text-xl font-medium">Integrations</h3>
        <Divider />

        <div className="flex flex-col gap-3">
          <Label htmlFor="organization-name">Run Applets from Slack</Label>
          <div className="flex flex-col gap-1">
            <span className="text-sm">
              Once installed, run the `/zipper [applet-slug]` slash command to
              run an applet from within Slack
            </span>
            <SlackInstallButton />
          </div>
        </div>
      </section>
    </SettingsLayout>
  );
};

GeneralSettingsPage.header = () => (
  <Header showDivider={false} showNav showOrgSwitcher />
);

export default GeneralSettingsPage;
