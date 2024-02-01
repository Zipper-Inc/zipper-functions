'use client';
import { useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { cn } from '@zipper/tw/cn';
import {
  Divider,
  Show,
  Dropdown,
  Badge,
  List,
  Button,
  ZipperSymbol,
  Tooltip,
} from '@zipper/tw/ui';
import { usePathname } from 'next/navigation';
import React, { useMemo } from 'react';
import { FiEye } from 'react-icons/fi';
import { HiOutlineChevronUpDown } from 'react-icons/hi2';
import { CreateOrganizationModal } from '~/components/auth/createOrganizationModal';
import { useOrganization } from '~/hooks/use-organization';
import { useOrganizationList } from '~/hooks/use-organization-list';
import { useUser } from '~/hooks/use-user';
import NextLink from 'next/link';
import { SignedIn, SignedOut } from '../auth/signed';
import { FeedbackModal } from '~/components/auth/feedback-modal';
import { ProfileButton } from '../auth/profile-button';
import { MobileMenu } from '~/components/header-mobile-menu';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const ROUTES = {
  DASHBOARD: [
    { label: 'Gallery', path: '/gallery-new' },
    { label: 'Changelog', path: '/changelog' },
    { label: 'Docs', path: '/docs' },
  ],
  LANDING: [
    { label: 'Gallery', path: '/gallery-new' },
    { label: 'About', path: '/about' },
    { label: 'Changelog', path: '/changelog' },
    { label: 'Docs', path: '/docs' },
    { label: 'Blog', path: '/blog' },
  ],
};

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

const OrganizationSwitcher: React.FC = () => {
  const { organization, role } = useOrganization();
  const { user } = useUser();
  const { setActive, organizationList, currentOrganizationId } =
    useOrganizationList();

  const OTHER_ORGANIZATIONS = useMemo(
    () =>
      organizationList.filter((o) => {
        return o.organization.id !== (currentOrganizationId || null);
      }),
    [organizationList, organization],
  );

  const USER_ROLE = useMemo(
    () => (role === 'admin' ? 'Admin' : 'Member'),
    [role],
  );

  const {
    isOpen: isOpenCreateOrg,
    onOpen: onOpenCreateOrg,
    onClose: onCloseCreateOrg,
  } = useDisclosure();

  return (
    <React.Fragment>
      <Dropdown.Root>
        <div className="flex items-center gap-1">
          <h3 className="text-xl font-medium">
            {organization?.name ?? user?.username}
          </h3>
          <Dropdown.Trigger className="flex items-center justify-center rounded-sm px-1 transition-all hover:bg-muted h-8">
            <HiOutlineChevronUpDown size={16} />
          </Dropdown.Trigger>
        </div>
        <Dropdown.Content align="end" className="w-72">
          <header className="flex px-2 py-2 items-center justify-between text-sm">
            <article>
              <h3 className="text-md font-bold">
                {organization?.name || 'Personal Workspace'}
              </h3>
              <Show
                when={!!organization?.name}
                fallback={<p>{user?.username}</p>}
              >
                <p>{USER_ROLE}</p>
              </Show>
            </article>

            <Button size="sm" variant="outline" className="gap-2">
              <FiEye />
              Profile
            </Button>
          </header>
          <Dropdown.Separator />
          <main className="py-2 flex flex-col gap-2">
            <h3 className="text-xs px-2 text-disabled">Switch workspace:</h3>
            <List data={OTHER_ORGANIZATIONS}>
              {(org) => (
                <Dropdown.Item
                  onClick={async () =>
                    org.pending
                      ? window.location.replace(
                          `${window.location.host}/${org.organization.slug}`,
                        )
                      : await setActive?.(org.organization.id)
                  }
                  className="group cursor-pointer flex items-center justify-between"
                >
                  <h3 className="font-medium">{org.organization.name}</h3>
                  <Show
                    when={org.pending}
                    fallback={
                      <ChevronRightIcon className="text-muted transition-all group-hover:text-foreground group-hover:translate-x-1" />
                    }
                  >
                    <Badge variant="secondary"> Invited</Badge>
                  </Show>
                </Dropdown.Item>
              )}
            </List>

            <Button
              onClick={onOpenCreateOrg}
              variant="outline-primary"
              size="sm"
              className="w-fit ml-2"
            >
              Create Organization
            </Button>
          </main>
        </Dropdown.Content>
      </Dropdown.Root>

      <CreateOrganizationModal
        isOpen={isOpenCreateOrg}
        onClose={onCloseCreateOrg}
      />
    </React.Fragment>
  );
};

const ZipperBetaLogo = () => {
  return (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger>
          <NextLink
            href="/dashboard-new"
            className="flex items-center space-x-2 transition-all group rounded-sm"
          >
            {/* ZipperSymbol should be adapted or replaced with TailwindCSS styled component. Custom styles may be required */}
            <ZipperSymbol className="max-h-full h-4 w-4 py-0 ml-1 fill-secondary transition-all text-blue-500" />

            <p className="text-xs transition-all uppercase flex items-center py-0 font-bold text-secondary bg-secondary/10 px-2 h-5">
              Beta
            </p>
          </NextLink>
        </Tooltip.Trigger>
        <Tooltip.Content>Go to Dashboard</Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
};

/* -------------------------------------------- */
/* Root                                         */
/* -------------------------------------------- */

interface RootHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  showDivider?: boolean;
}

const RootHeader: React.FC<RootHeaderProps> = ({
  className,
  children,
  showDivider,
  ...props
}) => (
  <header className={cn('w-full min-w-md px-12 h-16 ', className)} {...props}>
    <React.Fragment>{children}</React.Fragment>
    <Show when={showDivider === true}>
      <Divider />
    </Show>
  </header>
);

/* -------------------------------------------- */
/* Gallery                                      */
/* -------------------------------------------- */

export const GalleryHeader: React.FC = () => {
  const pathname = usePathname();
  const feedbackModal = useDisclosure();
  const isTablet = useBreakpointValue({ base: false, md: true });

  return (
    <RootHeader>
      <main className="w-full h-full flex items-center justify-between">
        <SignedIn>
          <div className="flex items-center space-x-4">
            <ZipperBetaLogo />

            <span className="text-2xl leading-none whitespace-nowrap font-medium text-muted">
              /
            </span>

            <OrganizationSwitcher />
          </div>
        </SignedIn>
        <SignedOut>
          <NextLink href="/home">
            <ZipperBetaLogo />
          </NextLink>
        </SignedOut>

        <div className="flex space-x-4 justify-end items-center">
          <List
            as="nav"
            className="flex h-full items-center space-x-4 no-underline"
            data={ROUTES.DASHBOARD}
          >
            {(props) => {
              const isActive = props.path === pathname;
              const textDecoration = isActive
                ? 'border-b border-foreground'
                : 'none';

              return (
                <NextLink
                  href={props.path}
                  key={props.label}
                  className={`text-sm text-foreground ${textDecoration} h-8 flex items-center hover:border-b hover:border-foreground`}
                >
                  {props.label}
                </NextLink>
              );
            }}
          </List>

          <SignedIn>
            <Button
              className="hidden md:flex"
              variant="outline"
              onClick={feedbackModal.onOpen}
            >
              Feedback
            </Button>

            <FeedbackModal {...feedbackModal} />
          </SignedIn>
          <ProfileButton />
        </div>
      </main>
      {!isTablet && (
        <MobileMenu
          navRoutes={ROUTES.DASHBOARD}
          feedbackModal={feedbackModal}
        />
      )}
    </RootHeader>
  );
};

/* -------------------------------------------- */
/* Dashboard                                    */
/* -------------------------------------------- */

export const DashboardHeader: React.FC = () => {
  const pathname = usePathname();
  const feedbackModal = useDisclosure();
  const isTablet = useBreakpointValue({ base: false, md: true });

  return (
    <RootHeader>
      <main className="w-full h-full flex items-center justify-between">
        <SignedIn>
          <div className="flex items-center space-x-4">
            <ZipperBetaLogo />

            <span className="text-2xl leading-none whitespace-nowrap font-medium text-muted">
              /
            </span>

            <OrganizationSwitcher />
          </div>
        </SignedIn>
        <SignedOut>
          <NextLink href="/home">
            <ZipperBetaLogo />
          </NextLink>
        </SignedOut>

        <div className="flex space-x-4 justify-end items-center">
          <List
            as="nav"
            className="flex h-full items-center space-x-4 no-underline"
            data={ROUTES.DASHBOARD}
          >
            {(props) => {
              const isActive = props.path === pathname;
              const textDecoration = isActive
                ? 'border-b border-foreground'
                : 'none';

              return (
                <NextLink
                  href={props.path}
                  key={props.label}
                  className={`text-sm text-foreground ${textDecoration} h-8 flex items-center hover:border-b hover:border-foreground`}
                >
                  {props.label}
                </NextLink>
              );
            }}
          </List>

          <SignedIn>
            <Button
              className="hidden md:flex"
              variant="outline"
              onClick={feedbackModal.onOpen}
            >
              Feedback
            </Button>

            <FeedbackModal {...feedbackModal} />
          </SignedIn>
          <ProfileButton />
        </div>
      </main>
      {!isTablet && (
        <MobileMenu
          navRoutes={ROUTES.DASHBOARD}
          feedbackModal={feedbackModal}
        />
      )}
    </RootHeader>
  );
};

/* -------------------------------------------- */
/* Playground                                   */
/* -------------------------------------------- */

export const PlaygroundHeader: React.FC = () => {
  return <RootHeader></RootHeader>;
};

/* -------------------------------------------- */
/* Main                                         */
/* -------------------------------------------- */

export type HeaderComponent = typeof RootHeader & {
  Gallery: typeof GalleryHeader;
  Dashboard: typeof DashboardHeader;
  Playground: typeof PlaygroundHeader;
};

export const Header = RootHeader as HeaderComponent;

Header.Gallery = GalleryHeader;
Header.Dashboard = DashboardHeader;
Header.Playground = PlaygroundHeader;
