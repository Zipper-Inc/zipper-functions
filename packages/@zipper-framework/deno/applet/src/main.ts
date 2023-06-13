import { hello } from './hello.ts';

export function handler({
  helloString,
  worldString,
}: {
  helloString: string;
  worldString: string;
}) {
  return hello(helloString, worldString);
}

export const config = {
  run: true,
};
