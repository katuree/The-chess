(() => {
  'use strict';

  const state = {
    app: null,
    auth: null,
    db: null,
    modules: null,
    user: null
  };

  const $ = id => document.getElementById(id);
  const status = $('auth-status');
  const setupPanel = $('setup-panel');
  const authPanel = $('auth-panel');
  const verifyPanel = $('verify-panel');
  const usernamePanel = $('username-panel');
  const profilePanel = $('profile-panel');
  const emailInput = $('auth-email');
  const passwordInput = $('auth-password');
  const usernameInput = $('username-input');
  const nextTarget = new URLSearchParams(location.search).get('next') || './index.html';

  function setStatus(message, kind = 'info') {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function show(panel) {
    [setupPanel, authPanel, verifyPanel, usernamePanel, profilePanel].forEach(el => el.classList.add('hidden'));
    panel.classList.remove('hidden');
  }

  function showSetupForm() {
    [setupPanel, authPanel].forEach(el => el.classList.remove('hidden'));
    [verifyPanel, usernamePanel, profilePanel].forEach(el => el.classList.add('hidden'));
  }

  function requireFirebaseConfig(feature = 'login') {
    if (state.modules) return true;
    showSetupForm();
    const message = feature === 'google'
      ? 'Google login needs Firebase config first. Add the Firebase web config and enable Google sign-in.'
      : 'Email signup/login needs Firebase config first. Add the Firebase web config to send verification mail.';
    setStatus(message, 'warn');
    return false;
  }

  function gotoNext() {
    location.href = nextTarget.startsWith('http') ? './index.html' : nextTarget;
  }

  function googleProvider() {
    const { GoogleAuthProvider } = state.modules.authMod;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }

  function renderAccount(prefix, user) {
    const card = $(`${prefix}-google-account`);
    if (!card || !user) return;
    const name = user.displayName || user.email || 'Google account';
    $(`${prefix}-google-name`).textContent = name;
    $(`${prefix}-google-email`).textContent = user.email || '';
    const photo = $(`${prefix}-google-photo`);
    if (user.photoURL) {
      photo.src = user.photoURL;
      photo.classList.remove('hidden');
    } else {
      photo.removeAttribute('src');
      photo.classList.add('hidden');
    }
    card.classList.remove('hidden');
  }

  async function loadFirebase() {
    const [appMod, authMod, dbMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js')
    ]);
    const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(window.THE_CHESS_FIREBASE_CONFIG);
    state.app = app;
    state.auth = authMod.getAuth(app);
    state.db = dbMod.getFirestore(app);
    state.modules = { appMod, authMod, dbMod };
  }

  async function profileFor(user) {
    const { doc, getDoc } = state.modules.dbMod;
    const snap = await getDoc(doc(state.db, 'users', user.uid));
    return snap.exists() ? snap.data() : null;
  }

  async function refreshRoute(user) {
    state.user = user;
    if (!user) {
      show(authPanel);
      setStatus('Sign in with email or Google to continue.', 'info');
      return;
    }
    const providerIds = user.providerData.map(provider => provider.providerId);
    const needsEmailVerify = providerIds.includes('password') && !user.emailVerified;
    if (needsEmailVerify) {
      $('verify-email-label').textContent = user.email || 'your email';
      show(verifyPanel);
      setStatus('Check your inbox and verify your email before playing.', 'warn');
      return;
    }
    const profile = await profileFor(user);
    if (!profile?.username) {
      renderAccount('username', user);
      show(usernamePanel);
      setStatus(`Signed in as ${user.email || user.displayName || 'your Google account'}. Choose a username to finish your profile.`, 'info');
      return;
    }
    $('profile-name').textContent = profile.username;
    $('profile-email').textContent = user.email || 'Google account';
    renderAccount('profile', user);
    show(profilePanel);
    setStatus(`Login complete as ${user.email || user.displayName || profile.username}. You can enter the game.`, 'ok');
  }

  async function signUpEmail() {
    if (!requireFirebaseConfig()) return;
    const { createUserWithEmailAndPassword, sendEmailVerification } = state.modules.authMod;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || password.length < 6) {
      setStatus('Enter an email and a password with at least 6 characters.', 'warn');
      return;
    }
    const credential = await createUserWithEmailAndPassword(state.auth, email, password);
    await sendEmailVerification(credential.user);
    setStatus('Verification email sent. Open it, then come back and refresh.', 'ok');
  }

  async function signInEmail() {
    if (!requireFirebaseConfig()) return;
    const { signInWithEmailAndPassword } = state.modules.authMod;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setStatus('Enter email and password.', 'warn');
      return;
    }
    await signInWithEmailAndPassword(state.auth, email, password);
  }

  async function signInGoogle() {
    if (!requireFirebaseConfig('google')) return;
    const { signInWithPopup, signInWithRedirect } = state.modules.authMod;
    const provider = googleProvider();
    try {
      await signInWithPopup(state.auth, provider);
    } catch (error) {
      const mobileOrPopupBlocked = ['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code);
      if (!mobileOrPopupBlocked) throw error;
      setStatus('Opening Google account sign-in...', 'info');
      await signInWithRedirect(state.auth, provider);
    }
  }

  async function resendVerification() {
    if (!requireFirebaseConfig()) return;
    const { sendEmailVerification } = state.modules.authMod;
    if (!state.user) return;
    await sendEmailVerification(state.user);
    setStatus('Verification email sent again.', 'ok');
  }

  async function saveUsername() {
    if (!requireFirebaseConfig()) return;
    const { doc, getDoc, setDoc, serverTimestamp } = state.modules.dbMod;
    const username = usernameInput.value.trim().replace(/^@+/, '').toLowerCase();
    if (!/^[a-z0-9_]{3,18}$/.test(username)) {
      setStatus('Username must be 3-18 characters: letters, numbers, underscore.', 'warn');
      return;
    }
    const usernameRef = doc(state.db, 'usernames', username);
    const usernameSnap = await getDoc(usernameRef);
    if (usernameSnap.exists() && usernameSnap.data().uid !== state.user.uid) {
      setStatus('That username is already taken.', 'warn');
      return;
    }
    await setDoc(usernameRef, { uid: state.user.uid, username, updatedAt: serverTimestamp() });
    await setDoc(doc(state.db, 'users', state.user.uid), {
      uid: state.user.uid,
      username,
      email: state.user.email || '',
      displayName: state.user.displayName || '',
      photoURL: state.user.photoURL || '',
      updatedAt: serverTimestamp()
    }, { merge: true });
    await refreshRoute(state.user);
  }

  async function signOut() {
    if (!requireFirebaseConfig()) return;
    await state.modules.authMod.signOut(state.auth);
  }

  function bind() {
    $('email-signup-btn').addEventListener('click', () => signUpEmail().catch(showError));
    $('email-signin-btn').addEventListener('click', () => signInEmail().catch(showError));
    $('google-signin-btn').addEventListener('click', () => signInGoogle().catch(showError));
    $('resend-verification-btn').addEventListener('click', () => resendVerification().catch(showError));
    $('refresh-user-btn').addEventListener('click', () => state.user.reload().then(() => refreshRoute(state.auth.currentUser)).catch(showError));
    $('save-username-btn').addEventListener('click', () => saveUsername().catch(showError));
    $('enter-game-btn').addEventListener('click', gotoNext);
    $('signout-btn').addEventListener('click', () => signOut().catch(showError));
    document.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !usernamePanel.classList.contains('hidden')) saveUsername().catch(showError);
    });
  }

  function showError(error) {
    console.error('[The Chess Auth]', error);
    setStatus(error.message || String(error), 'error');
  }

  async function boot() {
    bind();
    if (!window.THE_CHESS_FIREBASE_CONFIGURED) {
      showSetupForm();
      setStatus('Create an account with email or continue with Google.', 'info');
      return;
    }
    await loadFirebase();
    await state.modules.authMod.getRedirectResult(state.auth).catch(showError);
    state.modules.authMod.onAuthStateChanged(state.auth, user => refreshRoute(user).catch(showError));
  }

  boot().catch(showError);
})();
