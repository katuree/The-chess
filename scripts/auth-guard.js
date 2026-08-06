(() => {
  'use strict';

  const AUTH_PAGE = './auth.html';
  const isAuthPage = /(^|\/)auth\.html$/.test(location.pathname);

  function injectAuthBadge(text, href = AUTH_PAGE) {
    if (document.getElementById('the-chess-auth-badge')) return;
    const badge = document.createElement('a');
    badge.id = 'the-chess-auth-badge';
    badge.href = href;
    badge.textContent = text;
    badge.style.cssText = [
      'position:fixed', 'right:14px', 'top:14px', 'z-index:9999',
      'padding:9px 12px', 'border-radius:999px',
      'background:rgba(8,16,32,.78)', 'border:1px solid rgba(255,255,255,.18)',
      'color:#ffe45c', 'font:800 13px Segoe UI,Arial,sans-serif',
      'text-decoration:none', 'box-shadow:0 10px 28px rgba(0,0,0,.25)',
      'backdrop-filter:blur(8px)'
    ].join(';');
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(badge), { once: true });
  }

  function authUrl(reason = '') {
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search + location.hash);
    return `${AUTH_PAGE}?next=${next}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`;
  }

  async function loadModule(url) {
    return import(url);
  }

  async function ensureAuth() {
    if (!window.THE_CHESS_FIREBASE_CONFIGURED) {
      injectAuthBadge('Login setup needed');
      return;
    }

    const [{ initializeApp, getApps }, authMod, dbMod] = await Promise.all([
      loadModule('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js'),
      loadModule('https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js'),
      loadModule('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js')
    ]);

    const app = getApps().length ? getApps()[0] : initializeApp(window.THE_CHESS_FIREBASE_CONFIG);
    const auth = authMod.getAuth(app);
    const db = dbMod.getFirestore(app);

    authMod.onAuthStateChanged(auth, async user => {
      if (!user) {
        if (!isAuthPage) location.href = authUrl('login');
        return;
      }
      const providerIds = user.providerData.map(provider => provider.providerId);
      const needsEmailVerify = providerIds.includes('password') && !user.emailVerified;
      if (needsEmailVerify) {
        if (!isAuthPage) location.href = authUrl('verify-email');
        return;
      }
      const profileRef = dbMod.doc(db, 'users', user.uid);
      const profileSnap = await dbMod.getDoc(profileRef);
      const username = profileSnap.exists() ? profileSnap.data().username : '';
      if (!username) {
        if (!isAuthPage) location.href = authUrl('username');
        return;
      }
      window.theChessUser = { uid: user.uid, email: user.email, username };
      injectAuthBadge(`@${username}`, AUTH_PAGE);
    });
  }

  ensureAuth().catch(error => {
    console.error('[The Chess Auth Guard]', error);
    injectAuthBadge('Login error');
  });
})();
