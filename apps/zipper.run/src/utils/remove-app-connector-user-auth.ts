export default async function removeAppConnectorUserAuth({
  appId,
  type,
  token,
}: {
  appId: string;
  type: string;
  token: string;
}): Promise<{ ok: boolean }> {
  const res = await fetch(`/_zipper/removeConnector/${appId}/${type}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token || ''}`,
    },
  });

  return res.json();
}
