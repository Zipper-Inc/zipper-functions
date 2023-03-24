export function hello(helloString: string, worldString: string) {
  return `${helloString} ${worldString}`;
}

export function handler({ worldString }: { worldString: string }) {
  return hello('hello', worldString);
}
