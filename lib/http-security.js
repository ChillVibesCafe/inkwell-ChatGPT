// This desktop application has no authenticated LAN mode.
export function localListenHost(value = process.env.INKWELL_HOST) {
  const host = value || '127.0.0.1';
  if (!['127.0.0.1', '::1', 'localhost'].includes(host)) {
    throw new Error('Inkwell supports loopback hosting only. LAN hosting requires authentication.');
  }
  return host;
}

export function localApiRequest(req, res, next) {
  const deny = () => res.status(403).json({ error: 'Use Inkwell from its local browser address.' });
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) return deny();
  let host;
  try {
    const value = req.headers.host;
    if (typeof value !== 'string' || !/^(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?$/i.test(value)) return deny();
    host = new URL('http://' + value);
    const expectedPort = String(req.socket.localPort || process.env.PORT || 4321);
    if ((host.port || '80') !== expectedPort) return deny();
    if (req.headers.origin) {
      const origin = new URL(req.headers.origin);
      if (origin.origin !== host.origin || req.headers.origin !== origin.origin) return deny();
    }
  } catch { return deny(); }
  if (req.headers['sec-fetch-site'] === 'cross-site') return deny();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Cross-origin forms cannot submit JSON or binary upload MIME types.
    const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data'].includes(type)) return deny();
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}
