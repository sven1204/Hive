/* Fournisseurs OAuth 2.0 (Google, GitHub) — flux « authorization code ».
   Un fournisseur n'est actif que si son CLIENT_ID et son CLIENT_SECRET sont définis dans le .env.
   Chaque fournisseur sait construire l'URL d'autorisation, échanger le code contre un
   access token, puis renvoyer un profil normalisé : { id, email, emailVerified, firstName, lastName, avatarUrl }. */

const PROVIDERS = {
  google: {
    idField: 'googleId',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    authorizeParams: { scope: 'openid email profile', prompt: 'select_account' },

    async fetchProfile(accessToken) {
      const info = await getJson('https://openidconnect.googleapis.com/v1/userinfo', accessToken);
      return {
        id: String(info.sub),
        email: info.email,
        emailVerified: info.email_verified === true,
        firstName: info.given_name || '',
        lastName: info.family_name || '',
        avatarUrl: info.picture || '',
      };
    },
  },

  github: {
    idField: 'githubId',
    clientId: () => process.env.GITHUB_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_CLIENT_SECRET,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    authorizeParams: { scope: 'read:user user:email' },

    async fetchProfile(accessToken) {
      const [info, emails] = await Promise.all([
        getJson('https://api.github.com/user', accessToken),
        getJson('https://api.github.com/user/emails', accessToken),
      ]);
      // L'email public du profil peut être vide : on prend l'email principal vérifié
      const primary = (emails || []).find((e) => e.primary && e.verified)
        || (emails || []).find((e) => e.verified);
      const [firstName = '', ...rest] = (info.name || '').trim().split(/\s+/);
      return {
        id: String(info.id),
        email: primary?.email,
        emailVerified: Boolean(primary),
        firstName,
        lastName: rest.join(' '),
        avatarUrl: info.avatar_url || '',
      };
    },
  },
};

async function getJson(url, accessToken) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': 'Hive',
    },
  });
  if (!res.ok) throw new Error(`OAuth profile request failed (${res.status})`);
  return res.json();
}

function getProvider(name) {
  const provider = Object.hasOwn(PROVIDERS, name) ? PROVIDERS[name] : null;
  return provider && provider.clientId() && provider.clientSecret() ? provider : null;
}

function enabledProviders() {
  return Object.keys(PROVIDERS).filter((name) => getProvider(name));
}

/* URL publique du backend, utilisée pour l'URL de retour déclarée chez le fournisseur */
function callbackUrl(name) {
  const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5050}`;
  return `${base.replace(/\/$/, '')}/api/auth/oauth/${name}/callback`;
}

function buildAuthorizeUrl(name, state) {
  const provider = getProvider(name);
  const params = new URLSearchParams({
    client_id: provider.clientId(),
    redirect_uri: callbackUrl(name),
    response_type: 'code',
    state,
    ...provider.authorizeParams,
  });
  return `${provider.authorizeUrl}?${params}`;
}

async function exchangeCode(name, code) {
  const provider = getProvider(name);
  const res = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: provider.clientId(),
      client_secret: provider.clientSecret(),
      code,
      redirect_uri: callbackUrl(name),
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`OAuth token exchange failed (${res.status}${data.error ? `: ${data.error}` : ''})`);
  }
  return provider.fetchProfile(data.access_token);
}

module.exports = { getProvider, enabledProviders, buildAuthorizeUrl, exchangeCode };
