export async function handler() {
  const timestamp = Date.now().toString();
  await Zipper.storage.set('ts', timestamp);
  const value = await Zipper.storage.get('ts');
  console.log(timestamp, value);
  return value === timestamp ? 'works!' : 'broke!';
}
