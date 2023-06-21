import {
  Img,
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface MagicLinkEmailProps {
  loginUrl?: string;
}

export const MagicLinkEmail = ({ loginUrl }: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Log in with this magic link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://zipper.dev/zipper-logo.png" alt="Zipper" />
        <Heading style={h1}>Continue to Zipper</Heading>
        <Link
          href={loginUrl}
          target="_blank"
          style={{
            ...link,
            display: 'block',
            marginBottom: '16px',
          }}
        >
          Click here to log in with this magic link
        </Link>
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
          If you didn&apos;t try to login, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const OrgInvitationEmail = ({
  loginUrl,
  organizationName,
}: {
  loginUrl: string;
  organizationName: string;
}) => (
  <Html>
    <Head />
    <Preview>{`You've been invited to join ${organizationName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://zipper.dev/zipper-logo.png" alt="Zipper" />
        <Heading style={h1}>Your invitation</Heading>

        <Text style={{ ...text, marginBottom: '14px' }}>
          {`You've been invited to join ${organizationName} on Zipper.`}
        </Text>

        <Link
          href={loginUrl}
          target="_blank"
          style={{
            ...link,
            display: 'block',
            marginBottom: '16px',
          }}
        >
          Accept invitation
        </Link>
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

export default { MagicLinkEmail, OrgInvitationEmail };

const main = {
  backgroundColor: '#ffffff',
};

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
};

const h1 = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const link = {
  color: '#2754C5',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'underline',
};

const text = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
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
