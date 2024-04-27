import {
  Button,
  Img,
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from '@react-email/components';
import { getZipperDotDevUrl } from '@zipper/utils';
import * as React from 'react';

interface MagicLinkEmailProps {
  loginUrl: string;
  token: string;
}

export const Logo = () => (
  <Img
    src={`${getZipperDotDevUrl().origin}/static/zipper-logomark.png`}
    alt="Zipper"
    width="42"
    height="42"
  />
);

export const MagicLinkEmail = ({ loginUrl, token }: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>A magic link to log in to Zipper</Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Heading style={h1}>Your login link for Zipper</Heading>
        <Section style={buttonContainer}>
          <Button href={loginUrl} target="_blank" style={button} tw="px-6 py-3">
            Login to Zipper
          </Button>
        </Section>
        <Text style={paragraph}>
          This link and code will only be valid for the next 5 minutes. If the
          link does not work, you can use the login verification code directly:
        </Text>
        <code style={magicLinkCode}>{token}</code>
        <Text
          style={{
            ...text,
            color: '#ababab',
            marginTop: '14px',
            marginBottom: '16px',
          }}
        >
          If you didn&apos;t try to login, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const InvitationEmail = ({
  loginUrl,
  resourceToJoinName,
}: {
  loginUrl: string;
  resourceToJoinName: string;
}) => (
  <Html>
    <Head />
    <Preview>{`You've been invited to join ${resourceToJoinName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Heading style={h1}>Your invitation</Heading>

        <Text style={{ ...text, marginBottom: '14px' }}>
          {`You've been invited to join ${resourceToJoinName} on Zipper.`}
        </Text>

        <Section style={buttonContainer}>
          <Button href={loginUrl} target="_blank" style={button} tw="px-6 py-3">
            Accept invitation
          </Button>
        </Section>

        <Text style={{ ...text, marginBottom: '14px' }}>
          Or, copy and paste the url below into your browser:
        </Text>
        <code style={code}>{loginUrl}</code>
        <Text
          style={{
            ...text,
            color: '#ababab',
            marginTop: '14px',
            marginBottom: '16px',
          }}
        >
          If you don&apos;t want to join this organization, you can safely
          ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default { MagicLinkEmail, InvitationEmail };

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '560px',
};

const h1 = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
};

const link = {
  color: '#2754C5',
  fontSize: '14px',
  textDecoration: 'underline',
};

const text = {
  color: '#333',
  fontSize: '14px',
  margin: '24px 0',
};

const code = {
  display: 'inline-block',
  padding: '16px 4.5%',
  width: '90.5%',
  backgroundColor: '#f4f4f4',
  borderRadius: '5px',
  border: '1px solid #eee',
  color: '#333',
};

const button = {
  backgroundColor: '#BA47C2',
  borderRadius: '3px',
  fontWeight: '600',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
};

const buttonContainer = {
  padding: '27px 0 27px',
};

const paragraph = {
  margin: '0 0 15px',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4149',
};

const magicLinkCode = {
  fontFamily: 'monospace',
  fontWeight: '700',
  padding: '1px 4px',
  backgroundColor: '#dfe1e4',
  letterSpacing: '-0.3px',
  fontSize: '21px',
  borderRadius: '4px',
  color: '#3c4149',
};
