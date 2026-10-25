// Only inert raster images and recognized font containers may share the app origin.
// MIME declarations and filenames are not evidence that an upload is safe.
export function safeAssetMime(mime, bytes, kind = 'image') {
  const b = Buffer.from(bytes);
  const declared = String(mime || '').split(';')[0].trim().toLowerCase();
  const fail = () => { const e = new Error('Only supported raster images and font files can be uploaded. SVG and active documents are not supported.'); e.status = 415; throw e; };
  if (kind === 'font') {
    const tag = b.subarray(0,4).toString('ascii');
    const types = { wOFF: 'font/woff', wOF2: 'font/woff2', OTTO: 'font/otf', ttcf: 'font/collection' };
    const found = types[tag] || (b.subarray(0,4).equals(Buffer.from([0,1,0,0])) ? 'font/ttf' : null);
    if (!found || !(['application/font-woff', 'application/x-font-ttf', 'application/x-font-otf', 'application/octet-stream'].includes(declared) || declared.startsWith('font/'))) return fail();
    return found;
  }
  let found;
  if (b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) found='image/png';
  else if (b[0]===255 && b[1]===216 && b[2]===255) found='image/jpeg';
  else if (['GIF87a','GIF89a'].includes(b.subarray(0,6).toString('ascii'))) found='image/gif';
  else if (b.subarray(0,4).toString('ascii')==='RIFF' && b.subarray(8,12).toString('ascii')==='WEBP') found='image/webp';
  else if (b.subarray(0,2).toString('ascii')==='BM') found='image/bmp';
  else if (b.subarray(0,4).equals(Buffer.from([73,73,42,0])) || b.subarray(0,4).equals(Buffer.from([77,77,0,42]))) found='image/tiff';
  else if (b.subarray(4,8).toString('ascii')==='ftyp' && ['avif','avis'].includes(b.subarray(8,12).toString('ascii'))) found='image/avif';
  if (!found || declared!==found) return fail();
  return found;
}

export function protectAssetResponse(res) {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  res.setHeader('Cache-Control','private, max-age=31536000, immutable');
}
