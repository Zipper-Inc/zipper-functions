import { getZipperDotDevUrl } from '@zipper/utils';
import Link from 'next/link';

function SlackInstallButton() {
  const slackAppInstallUrl = new URL('https://slack.com/oauth/v2/authorize');
  slackAppInstallUrl.searchParams.set(
    'client_id',
    process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
  );
  slackAppInstallUrl.searchParams.set(
    'scope',
    'chat:write, chat:write.public, commands',
  );
  slackAppInstallUrl.searchParams.set(
    'redirect_uri',
    process.env.NODE_ENV === 'production'
      ? `${getZipperDotDevUrl()}slack/auth`
      : `https://redirectmeto.com/${getZipperDotDevUrl()}slack/auth`,
  );

  return (
    <Link href={slackAppInstallUrl.toString()} className="mt-2">
      <img
        alt="Add to Slack"
        height="40"
        width="139"
        src="https://platform.slack-edge.com/img/add_to_slack.png"
        srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
      />
    </Link>
  );
}

export default SlackInstallButton;
