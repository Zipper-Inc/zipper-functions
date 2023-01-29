export {};

declare global {
  namespace http {
    interface IncomingMessage {
      cookies: string[];
    }
  }
}
