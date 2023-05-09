export default async function removeAppConnectorUserAuth({
  appId,
  type,
}: {
  appId: string;
  type: string;
}): Promise<{ ok: boolean }> {
  const res = await fetch(`/_zipper/removeConnector/${appId}/${type}`, {
    method: 'POST',
    credentials: 'include',
  });

  return res.json();
}
