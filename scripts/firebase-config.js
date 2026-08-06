// The Chess Firebase web config.
// Replace these placeholder values with the Firebase project web app config.
// Firebase web config is public by design; security is enforced with Firebase Auth + Firestore rules.
window.THE_CHESS_FIREBASE_CONFIG = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_APP_ID"
};

window.THE_CHESS_FIREBASE_CONFIGURED = !Object.values(window.THE_CHESS_FIREBASE_CONFIG)
  .some(value => String(value).startsWith('PASTE_'));
