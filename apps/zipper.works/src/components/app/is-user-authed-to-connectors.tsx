import { AppConnector } from '@prisma/client';
import { getCookie } from 'cookies-next';
import { FC, ReactNode, useEffect, useState } from 'react';

const IsUserAuthedToConnectors: FC<{
  appId: string;
  children: ReactNode;
  connectors: Pick<
    AppConnector,
    'isUserAuthRequired' | 'userScopes' | 'type'
  >[];
}> = ({ appId, connectors, children }) => {
  const [userAuthConnectors, setUserAuthConnectors] = useState<
    Partial<AppConnector>[] | undefined
  >([]);

  const [connectorsWithCookies, setConnectorsWithCookies] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    setUserAuthConnectors(
      connectors.filter(
        (connector) =>
          connector.isUserAuthRequired && connector.userScopes.length > 0,
      ),
    );
  }, []);

  useEffect(() => {
    userAuthConnectors?.forEach((c) => {
      const cookie = getCookie(`${appId}::${c.type}`);

      setConnectorsWithCookies((prevConnectorsWithCookies) => {
        return {
          ...prevConnectorsWithCookies,
          [`${c.type}`]: cookie?.toString() || null,
        };
      });
    });
  }, [userAuthConnectors]);

  if (userAuthConnectors && userAuthConnectors.length === 0)
    return <>{children}</>;

  // return <>{JSON.stringify(connectorsWithCookies)}</>;
  return (
    <>
      {Object.keys(connectorsWithCookies).map((k) => (
        <>
          <>{k}:</>
          <>{connectorsWithCookies[k] || 'needs auth'}</>
        </>
      ))}
    </>
  );
};

export default IsUserAuthedToConnectors;
