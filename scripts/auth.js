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

  function gotoNext() {
    location.href = nextTarget.startsWith('http') ? './index.html' : nextTarget;
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
      show(usernamePanel);
      setStatus('Choose a username to finish your profile.', 'info');
      return;
    }
    $('profile-name').textContent = profile.username;
    $('profile-email').textContent = user.email || 'Google account';
    show(profilePanel);
    setStatus('Login complete. You can enter the game.', 'ok');
  }

  async function signUpEmail() {
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
    const { GoogleAuthProvider, signInWithPopup } = state.modules.authMod;
    await signInWithPopup(state.auth, new GoogleAuthProvider());
  }

  async function resendVerification() {
    const { sendEmailVerification } = state.modules.authMod;
    if (!state.user) return;
    await sendEmailVerification(state.user);
    setStatus('Verification email sent again.', 'ok');
  }

  async function saveUsername() {
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
      show(setupPanel);
      setStatus('Firebase is not configured yet. Paste the Firebase web config in scripts/firebase-config.js.', 'warn');
      return;
    }
    await loadFirebase();
    state.modules.authMod.onAuthStateChanged(state.auth, user => refreshRoute(user).catch(showError));
  }

  boot().catch(showError);
})();
