import app from '../server.js';

export default function handler(req: any, res: any) {
  // Normalize request url on Vercel so Express routes matching /api/* are always matched
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
