/* ============================================
   Remindo — Firebase Configuration
   ============================================
   
   To connect to Firebase:
   1. Create a project at https://console.firebase.google.com
   2. Enable Firestore Database
   3. Enable Authentication (Email/Password or Google)
   4. Copy your config values below
   5. The app will automatically switch from localStorage to Firebase
   
   ============================================ */

const firebaseConfig = {
    apiKey: "AIzaSyAG7jwoXxgbCN1b_hFImgxZykDx0qm3rV8",
    authDomain: "remindo-20.firebaseapp.com",
    projectId: "remindo-20",
    storageBucket: "remindo-20.firebasestorage.app",
    messagingSenderId: "350116454586",
    appId: "1:350116454586:web:c483d63aad15f584a32283"
};

// --- Auto-initialize Firebase if configured ---
let firebaseApp = null;
let firebaseDB = null;
let firebaseAuth = null;

(function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.log('📦 Firebase SDK not loaded — using localStorage');
        return;
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.log('📦 Firebase not configured — using localStorage');
        console.log('   To enable Firebase, fill in firebaseConfig in js/firebase-config.js');
        return;
    }

    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firebaseDB = firebase.firestore();
        firebaseAuth = firebase.auth();

        // Enable offline persistence for Firestore
        firebaseDB.enablePersistence({ synchronizeTabs: true })
            .catch(err => {
                if (err.code === 'failed-precondition') {
                    console.warn('Firestore persistence failed: Multiple tabs open');
                } else if (err.code === 'unimplemented') {
                    console.warn('Firestore persistence not supported in this browser');
                }
            });

        console.log('🔥 Firebase initialized successfully');
    } catch (e) {
        console.warn('⚠️ Firebase initialization failed:', e.message);
        console.log('📦 Falling back to localStorage');
        firebaseApp = null;
        firebaseDB = null;
        firebaseAuth = null;
    }
})();
