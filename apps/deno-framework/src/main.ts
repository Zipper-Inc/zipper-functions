import { hello } from './hello.ts';

export function main({
  helloString,
  worldString,
}: {
  helloString: string;
  worldString: string;
}) {
  return hello(helloString, worldString);
}
