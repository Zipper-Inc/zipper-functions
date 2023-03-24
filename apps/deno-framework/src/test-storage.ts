export async function handler() {
  const timestamp = Date.now().toString();
  await window.Zipper.storage.set('ts', timestamp);
  const value = await window.Zipper.storage.get('ts');
  console.log(timestamp, value);
  return value === timestamp ? 'works!' : 'broke!';
}
