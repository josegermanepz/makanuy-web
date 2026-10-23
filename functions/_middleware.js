const PRIMARY_HOST = 'makanuynutricion.com';
const LEGACY_HOSTS = new Set([
  'www.makanuynutricion.com',
  'makanuy-web.pages.dev',
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (LEGACY_HOSTS.has(url.hostname)) {
    url.protocol = 'https:';
    url.hostname = PRIMARY_HOST;
    url.port = '';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
