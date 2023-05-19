import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import clerkClient from '@clerk/clerk-sdk-node';
import { verifyHmac } from '~/utils/verify-hmac';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    if (!verifyHmac(req, process.env.HMAC_SIGNING_SECRET!)) {
      res.status(500).send({ error: 'Invalid HMAC' });
      return;
    }

    const refreshToken = req.body.refreshToken;

    // Verify and decode the refresh token
    try {
      const decodedToken = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SIGNING_SECRET!,
      );

      const user = await clerkClient.users.getUser(decodedToken as string);

      // Generate a new JWT token
      const newToken = jwt.sign(
        {
          sub: decodedToken,
          firstName: user.firstName,
          lastName: user.lastName,
          primaryEmail: user.emailAddresses.find((e) => {
            e.id === user.primaryEmailAddressId;
          }),
        },
        process.env.JWT_SIGNING_SECRET!,
        { expiresIn: '1h' },
      );

      // Send the new token in the response
      res.status(200).json({ accessToken: newToken });
    } catch (error) {
      // If the token is invalid or expired, return an error response
      res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  } else {
    // Return an error for unsupported HTTP methods
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
