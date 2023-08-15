export const code = `
import { encode } from "https://deno.land/std@0.196.0/encoding/base64.ts";
import * as jwt from "https://esm.sh/jsonwebtoken@8.5.1";

const ZENDESK_DOMAIN = Deno.env.get("ZENDESK_SUBDOMAIN") + '.zendesk.com';

export const ZENDESK_API_URL = 'https://' + ZENDESK_DOMAIN + '/api/v2';

// Definitions of zendesk JWT claims:
// https://developer.zendesk.com/documentation/apps/app-developer-guide/using-the-apps-framework/#jwt-claims
export type ZendeskWebTokenPayload = {
  exp: number;
  nbf: number;
  iss: string;
  aud: string;
  iat: number;
  sub: string;
  cnf: {
    jku: string;
  };
  qsh: string;
  context: {
    product: string;
    location: string;
  };
};

export enum ParsedTokenStatus {
  OK,
  ERROR,
}

export type ParsedToken = {
  status: ParsedTokenStatus;
  payload?: ZendeskWebTokenPayload;
  error?: any;
  refreshedToken?: string;
};

function getHearders() {
  const ZendeskAuthString = encode(
    Zipper.env.ZENDESK_EMAIL + ':' + Zipper.env.ZENDESK_TOKEN
  );
  const headers = new Headers();
  headers.set("Authorization", 'Basic ' + ZendeskAuthString);

  return headers;
}

export async function getZendeskResource(path: string) {
  const url = ZENDESK_API_URL + path;

  return fetch(url, {
    method: "GET",
    headers: getHearders(),
  });
}

/**
 * Get the public key for a specific app.  This key is
 * used for verifying JWTs
 * Zendesk doc:
 * https://developer.zendesk.com/api-reference/ticketing/apps/apps/#get-app-public-key
 *
 */
export async function fetchPem(app_id: number | undefined) {
  if (!app_id) throw new Error("Invalid Zendesk App ID");
  const pem = await getZendeskResource('/apps/' + app_id + '/public_key.pem');
  return pem.text();
}

/**
 * Build a new JWT with a refreshed expiration.
 * The JWT from Zendesk is only valid for 5 minutes,
 * so we need to create new ones to pass along inside
 * inside the app.
 *
 */
export function getRefreshToken(
  payload: ZendeskWebTokenPayload,
  secret: string
) {
  return jwt.sign(payload, secret, { algorithm: "HS256" });
}


/**
 * Get the zendesk app id from the apps env.
 */
export function getZendeskAppId() {
  const idString = Deno.env.get("ZENDESK_APP_ID") || "";
  return parseInt(idString);
}

/**
 * Verifies a token. Check status for errors. On successful
 * validation a refreshed token will also be returned.
 */
export async function validateToken(
  zendeskToken?: string,
  zipperToken?: string
): Promise<ParsedToken> {
  // zendesk token only comes on first request, subsequent tokens
  // are zipper tokens
  const token = zendeskToken || zipperToken;
  if (!token)
    return {
      status: ParsedTokenStatus.ERROR,
      error: "token or zipperToken is required",
    };

  let secret = Deno.env.get("ZENDESK_JWT_SECRET") || "";
  if (zendeskToken) {
    secret = await fetchPem(getZendeskAppId());
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["RS256", "HS256"],
      issuer: ZENDESK_DOMAIN,
    }) as ZendeskWebTokenPayload;
    const refreshedToken = getRefreshToken(payload, secret);

    return {
      status: ParsedTokenStatus.OK,
      payload,
      refreshedToken,
    };
  } catch (e: any) {
    console.log(e.message);
    return {
      status: ParsedTokenStatus.ERROR,
      error: e,
    };
  }
}
`;

export const userScopes = [];
