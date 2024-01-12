'use client';
import { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import { Icon, useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { PiHouseSimple } from 'react-icons/pi';
import { useUser } from '~/hooks/use-user';
import SignedIn from '~/components/auth/signed-in';
import SignedOut from '~/components/auth/signed-out';
import { BLUE, Button, Dropdown, ZipperLogo, ZipperSymbol } from '@zipper/ui';
import { FeedbackModal } from '~/components/auth/feedback-modal';
import { MobileMenu } from '~/components/header-mobile-menu';
import { ProfileButton } from '../auth/profile-button';
import OrganizationSwitcher from '~/components/auth/organizationSwitcher';
import { useOrganization } from '~/hooks/use-organization';
import { FiChevronDown } from 'react-icons/fi';

type HeaderProps = {
  showNav?: boolean;
  showOrgSwitcher?: boolean;
  showDivider?: boolean;
};

const navRoutes = [
  { href: '/gallery', text: 'Gallery' },
  { href: '/changelog', text: 'Changelog' },
  { href: '/docs', text: 'Docs' },
];

const Header: React.FC<HeaderProps> = ({
  showNav = true,
  showDivider = true,
  showOrgSwitcher,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const feedbackModal = useDisclosure();
  const isTablet = useBreakpointValue({ base: false, md: true });
  const { organization, role } = useOrganization();

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
                      <div className="flex items-center space-x-2">
                        {/* ZipperSymbol should be adapted or replaced with TailwindCSS styled component. Custom styles may be required */}
                        <ZipperSymbol className="max-h-full h-4 w-4 py-0 ml-1 fill-secondary text-blue-500" />

                        <p className="text-xs uppercase flex items-center py-0 font-bold text-secondary bg-secondary/10 px-2 h-5">
                          Beta
                        </p>
                      </div>

                      <span className="text-2xl leading-none whitespace-nowrap font-medium text-muted">
                        /
                      </span>

                      <Dropdown.Root>
                        <Dropdown.Trigger className="flex items-center gap-2 text-xl font-medium">
                          {organization?.name}
                          <FiChevronDown size={16} />
                        </Dropdown.Trigger>
                      </Dropdown.Root>
                    </div>
                  ) : (
                    <div className="flex space-x-5">
                      <ZipperLogo className="fill-secondary dark:fill-secondary text-blue-500 h-5 w-36" />
                      {/* {showNav && (
                        <div className="hidden sm:flex space-x-1 items-center bg-green">
                          <Icon as={PiHouseSimple} />
                          <p className="text-sm">Dashboard</p>
                        </div>
                      )} */}
                    </div>
                  )}
                </SignedIn>
                <SignedOut>
                  <ZipperLogo
                    fill={BLUE}
                    height={20}
                    style={{
                      marginLeft: '5px',
                      width: '140px',
                    }}
                  />
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
            <div className="flex h-full space-x-4 text-lg text-purple no-underline">
              {navRoutes.map((r) => {
                const isActive = r.href === `/${pathname}`;
                const textDecoration = isActive ? 'underline' : 'none';

                return (
                  <NextLink
                    href={r.href}
                    key={r.text}
                    className={`text-sm text-foreground ${textDecoration} h-8 flex items-center hover:border-b hover:border-foreground`}
                  >
                    {r.text}
                  </NextLink>
                );
              })}
            </div>

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
                navRoutes={navRoutes}
                feedbackModal={user ? feedbackModal : null}
              />
            )}
          </div>
        )}
      </header>
      {showDivider && <div className="pt-4 mb-10 border-b border-gray-200" />}
    </>
  );
};

export default Header;
