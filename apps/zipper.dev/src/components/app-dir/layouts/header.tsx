'use client';
import React, { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import { useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { useUser } from '~/hooks/use-user';
import SignedIn from '~/components/auth/signed-in';
import SignedOut from '~/components/auth/signed-out';
import {
  Badge,
  Button,
  Dropdown,
  List,
  Show,
  ZipperLogo,
  ZipperSymbol,
} from '@zipper/ui';
import { FeedbackModal } from '~/components/auth/feedback-modal';
import { MobileMenu } from '~/components/header-mobile-menu';
import { ProfileButton } from '../auth/profile-button';
import { useOrganization } from '~/hooks/use-organization';
import { FiEye } from 'react-icons/fi';
import { useOrganizationList } from '~/hooks/use-organization-list';
import { HiOutlineChevronUpDown } from 'react-icons/hi2';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { CreateOrganizationModal } from '~/components/auth/createOrganizationModal';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const DASHBOARD_ROUTES = [
  { href: '/gallery', text: 'Gallery' },
  { href: '/changelog', text: 'Changelog' },
  { href: '/docs', text: 'Docs' },
  { href: '/dashboard', text: 'Dashboard' },
  { href: '/blog', text: 'Blog' },
];

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
        <Dropdown.Trigger className="flex items-center justify-center hover:opacity-75 transition-all  gap-2 h-8">
          <h3 className="text-xl font-medium">
            {organization?.name ?? user?.username}
          </h3>
          <HiOutlineChevronUpDown size={16} />
        </Dropdown.Trigger>
        <Dropdown.Content align="start" className="w-72">
          <header className="flex px-2 py-4 items-center justify-between text-sm">
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
          <main className="py-4 flex flex-col gap-2">
            <h3 className="px-2 uppercase font-bold text-xs text-gray-400">
              switch workspace
            </h3>
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
                  className="group cursor-pointer flex items-center justify-between hover:bg-brand-red"
                >
                  <h3>{org.organization.name}</h3>
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
    <div className="flex items-center space-x-2">
      {/* ZipperSymbol should be adapted or replaced with TailwindCSS styled component. Custom styles may be required */}
      <ZipperSymbol className="max-h-full h-4 w-4 py-0 ml-1 fill-secondary text-blue-500" />

      <p className="text-xs uppercase flex items-center py-0 font-bold text-secondary bg-secondary/10 px-2 h-5">
        Beta
      </p>
    </div>
  );
};

type HeaderProps = {
  showNav?: boolean;
  showOrgSwitcher?: boolean;
  showDivider?: boolean;
};

const Header: React.FC<HeaderProps> = ({
  showNav = true,
  showDivider = true,
  showOrgSwitcher,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const feedbackModal = useDisclosure();
  const isTablet = useBreakpointValue({ base: false, md: true });

  const isLanding = useMemo(
    () =>
      [
        '/home',
        '/about',
        '/docs',
        '/features',
        '/blog',
        '/home',
        '/terms',
        '/privacy',
      ].find((path) => path === pathname),
    [pathname],
  );

  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (searchParams?.get('reload')) {
      window.location.href = window.location.href.replace('?reload=true', '');
    }
  }, [searchParams]);

  if (isLanding) {
    return <></>;
  }

  return (
    <>
      <header className="flex gap-4 pt-5 w-full min-w-md px-12 justify-center items-center">
        <div className="flex space-x-3 h-8 items-center">
          <div>
            {isLoaded && (
              <NextLink href="/">
                <SignedIn>
                  {showNav && showOrgSwitcher ? (
                    <div className="flex items-center space-x-4">
                      <ZipperBetaLogo />

                      <span className="text-2xl leading-none whitespace-nowrap font-medium text-muted">
                        /
                      </span>

                      <OrganizationSwitcher />
                    </div>
                  ) : (
                    <div className="flex space-x-5">
                      <ZipperLogo className="fill-secondary dark:fill-secondary text-blue-500 h-5 w-36" />
                    </div>
                  )}
                </SignedIn>
                <SignedOut>
                  <ZipperBetaLogo />
                </SignedOut>
              </NextLink>
            )}
          </div>

          {/* OrganizationSwitcher should be adapted to TailwindCSS */}
        </div>
        {showNav && isLoaded && (
          <div
            className={`flex items-center ${
              !user ? 'justify-between' : 'justify-end'
            } gap-4 flex-1`}
          >
            <List
              as="nav"
              className="flex h-full items-center space-x-4 no-underline"
              data={DASHBOARD_ROUTES}
            >
              {(props) => {
                const isActive = props.href === `/${pathname}`;
                const textDecoration = isActive ? 'underline' : 'none';

                return (
                  <NextLink
                    href={props.href}
                    key={props.text}
                    className={`text-sm text-foreground ${textDecoration} h-8 flex items-center hover:border-b hover:border-foreground`}
                  >
                    {props.text}
                  </NextLink>
                );
              }}
            </List>

            <div className="flex space-x-4 justify-end items-center">
              {user && (
                <>
                  <Button
                    className="hidden md:flex"
                    variant="outline"
                    onClick={feedbackModal.onOpen}
                  >
                    Feedback
                  </Button>

                  <FeedbackModal {...feedbackModal} />
                </>
              )}
              <ProfileButton />
            </div>
            {!isTablet && (
              <MobileMenu
                navRoutes={DASHBOARD_ROUTES}
                feedbackModal={user ? feedbackModal : null}
              />
            )}
          </div>
        )}
      </header>
      <Show when={showDivider}>
        <span className="pt-4 mb-10 border-b border-gray-200" />
      </Show>
    </>
  );
};

export default Header;
