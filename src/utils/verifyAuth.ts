import supertokensNode from 'supertokens-node';
import { backendConfig } from '~/config/backendConfig';
import Session from 'supertokens-node/recipe/session';
import { NextApiRequest, NextApiResponse } from 'next';

export const verifyAuthServerSide = async (req: any, res: any) => {
  // this runs on the backend, so we must call init on supertokens-node SDK
  supertokensNode.init(backendConfig());
  let session;
  try {
    session = await Session.getSession(req, res);
  } catch (err: any) {
    if (err.type === Session.Error.TRY_REFRESH_TOKEN) {
      return { props: { fromSupertokens: 'needs-refresh' } };
    } else if (err.type === Session.Error.UNAUTHORISED) {
      // this will force the frontend to try and refresh which will fail
      // clearing all cookies and redirecting the user to the login screen.
      return { props: { fromSupertokens: 'needs-refresh' } };
    } else if (err.type === Session.Error.INVALID_CLAIMS) {
      return { props: {} };
    } else {
      throw err;
    }
  }

  return {
    props: { userId: session.getUserId() },
  };
};

export const verifyAPIAuth = async (req: any, res: any) => {
  const session = await Session.getSession(req, res);
  return session.getUserId();
};
