const port = process.env.APP_PORT || 3000;

const apiBasePath = '/api/auth/';

const websiteDomain = process.env.NEXT_PUBLIC_URL || `http://localhost:${port}`;

export const appInfo = {
  // learn more about this on https://supertokens.com/docs/thirdpartyemailpassword/appinfo
  appName: 'Zipper',
  apiDomain: websiteDomain,
  websiteDomain,
  apiBasePath,
  websiteBasePath: '/auth',
};
