export function isAllowedReturnTo(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;

  try {
    const target = new URL(value);
    if (target.username || target.password || target.search || target.hash) return false;

    if (target.protocol === 'makanuy:') {
      return (
        (target.hostname === '' && target.pathname === '/login') ||
        (target.hostname === 'login' && (target.pathname === '' || target.pathname === '/'))
      );
    }

    if (target.protocol !== 'exp:' && target.protocol !== 'exps:') return false;
    if (target.pathname !== '/--/login') return false;

    const hostname = target.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return true;
    if (hostname.endsWith('.local')) return true;

    const octets = hostname.split('.').map(Number);
    if (
      octets.length !== 4 ||
      octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
    ) {
      return false;
    }

    return (
      octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    );
  } catch {
    return false;
  }
}

export function readAllowedReturnTo(search) {
  const value = new URLSearchParams(search).get('return_to') || '';
  return isAllowedReturnTo(value) ? value : '';
}
