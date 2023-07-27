const CORS_ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const CORS_ALLOWED_HEADERS = [
  'Accept',
  'Authorization',
  'Content-Type',
  'X-Zipper-Client-Version',
];

export function setCorsHeaders(headers: Headers | undefined) {
  if (!headers) return;
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', CORS_ALLOWED_METHODS.join(', '));
  headers.set('Access-Control-Allow-Headers', CORS_ALLOWED_HEADERS.join(', '));
}
