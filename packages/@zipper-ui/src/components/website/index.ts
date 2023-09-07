import { ComponentProps } from 'react';
import { Wrapper } from './Wrapper';
import { WebSiteFooter } from './Footer';
import { WebSiteNavbar } from './Navbar';
import { WebSiteContent } from './Content';

type WebsiteComponet = {
  (props: ComponentProps<typeof Wrapper>): JSX.Element;
  Navbar: (props: ComponentProps<typeof WebSiteNavbar>) => JSX.Element;
  Footer: (props: ComponentProps<typeof WebSiteFooter>) => JSX.Element;
  Content: (props: ComponentProps<typeof WebSiteContent>) => JSX.Element;
};
export const Website = Wrapper as WebsiteComponet;

Website.Navbar = WebSiteNavbar;
Website.Footer = WebSiteFooter;
Website.Content = WebSiteContent;
