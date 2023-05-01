export {};

declare global {
  namespace http {
    interface IncomingMessage {
      cookies: string[];
    }
  }

  type Unpack<T> = T extends (infer U)[] ? U : T;
}
