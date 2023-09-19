import { Analytics, TrackParams } from '@june-so/analytics-node';
import { EventProperties } from '@segment/analytics-core';
import { prisma } from '~/server/prisma';
import * as Sentry from '@sentry/nextjs';

export function getAnalytics() {
  // Instantiate AnalyticsNode:
  const analytics = new Analytics(process.env.NEXT_PUBLIC_JUNE_WRITE_KEY!);

  return analytics;
}

export async function trackEvent({
  userId,
  orgId,
  eventName,
  properties,
}: {
  userId?: string;
  orgId?: string;
  eventName: string;
  properties: EventProperties;
}): Promise<void> {
  try {
    const analytics = getAnalytics();

    const trackData: TrackParams = {
      event: eventName,
      anonymousId: 'UNKNOWN',
      properties,
    };

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        analytics.identify({
          userId: userId,
          traits: {
            email: user.email,
            name: user.name,
            avatar: user.image,
          },
        });

        trackData.userId = userId;

        if (orgId) {
          const org = await prisma.organization.findUnique({
            where: { id: orgId },
          });

          if (org) {
            analytics.group({
              userId,
              groupId: orgId,
              traits: {
                name: org?.name || org?.slug || 'missing org name',
              },
            });

            trackData.context = { groupId: orgId };
          }
        }
      }

      analytics.track(trackData);
    }
  } catch (e) {
    Sentry.captureException(e);
  }
}

export type { Analytics } from '@june-so/analytics-next';
