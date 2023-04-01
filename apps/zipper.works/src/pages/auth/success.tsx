import { User } from '@clerk/clerk-sdk-node';
import { useUser } from '@clerk/nextjs';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { trpc } from '~/utils/trpc';
import { NextPageWithLayout } from '../_app';

export const AuthSuccess: NextPageWithLayout = (props: any) => {
  const [readyToRedirect, setReadyToRedirect] = useState(false);

  const { user } = useUser();

  const generateSlug = trpc.useMutation(
    'resourceOwnerSlug.createGeneratedUserSlug',
  );

  const validateSlug = trpc.useMutation(
    'resourceOwnerSlug.validateAndCreateUserSlug',
  );

  const acceptPendingInvitations = trpc.useMutation(
    'appEditor.acceptPendingInvitations',
  );

  useEffect(() => {
    if (user) {
      if (user.publicMetadata.username) {
        validateSlug.mutateAsync({
          clerkUsername: user.publicMetadata.username as string,
          id: user.id,
        });
      } else {
        generateSlug.mutateAsync({
          email: user.emailAddresses.find(
            (e) => e.id === user.primaryEmailAddressId,
          )?.emailAddress,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          clerkUsername: user.username || undefined,
          id: user.id,
        });
      }

      acceptPendingInvitations.mutateAsync();

      setReadyToRedirect(true);
    }
  }, [user]);

  const router = useRouter();

  useEffect(() => {
    if (readyToRedirect) {
      router.push(props.redirect || '/');
    }
  }, [readyToRedirect]);

  return <></>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const redirect = ctx.query.redirect_url || '/';

  return {
    props: { redirect },
  };
};

export default AuthSuccess;

AuthSuccess.header = () => <></>;
