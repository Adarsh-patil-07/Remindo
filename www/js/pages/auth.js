/* ============================================
   REMINDO — Auth Page
   Handles Login, Sign Up, and Google Auth
   ============================================ */

const AuthPage = {
    render(container) {
        container.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <img src="assets/preview.png" alt="Remindo Preview" class="auth-preview-img">
                        <h2 class="auth-title" id="authTitle">Welcome Back</h2>
                        <p class="auth-subtitle" id="authSubtitle">Log in to sync your reminders</p>
                    </div>

                    <!-- LOGIN FORM -->
                    <form id="loginForm" class="auth-form">
                        <div class="input-group floating">
                            <input type="email" id="loginEmail" class="input" placeholder=" " required autocomplete="email">
                            <label for="loginEmail">Email</label>
                        </div>
                        
                        <div class="input-group floating">
                            <input type="password" id="loginPassword" class="input" placeholder=" " required autocomplete="current-password">
                            <label for="loginPassword">Password</label>
                        </div>

                        <button type="submit" class="btn btn--primary btn--block" id="btnLogin" style="margin-top: 16px;">
                            Log In
                        </button>
                    </form>

                    <!-- SIGN UP FORM -->
                    <form id="signupForm" class="auth-form hidden">
                        <div class="input-group floating">
                            <input type="text" id="signupName" class="input" placeholder=" " required autocomplete="name">
                            <label for="signupName">Name</label>
                        </div>

                        <div class="input-group floating">
                            <input type="email" id="signupEmail" class="input" placeholder=" " required autocomplete="email">
                            <label for="signupEmail">Email</label>
                        </div>
                        
                        <div class="input-group floating">
                            <input type="password" id="signupPassword" class="input" placeholder=" " required autocomplete="new-password">
                            <label for="signupPassword">Password</label>
                        </div>

                        <button type="submit" class="btn btn--primary btn--block" id="btnSignup" style="margin-top: 16px;">
                            Sign Up
                        </button>
                    </form>

                    <div class="auth-divider">
                        <span>OR</span>
                    </div>

                    <button class="btn btn--ghost btn--block auth-google-btn" id="btnGoogleAuth">
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div class="auth-footer">
                        <p id="authToggleText">
                            <span id="toggleQuestion">Don't have an account?</span> 
                            <button type="button" class="btn-text" id="btnToggleToSignup">Sign Up</button>
                        </p>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const btnToggle = document.getElementById('btnToggleToSignup');
        const toggleText = document.getElementById('authToggleText');
        const title = document.getElementById('authTitle');
        const subtitle = document.getElementById('authSubtitle');
        const googleBtn = document.getElementById('btnGoogleAuth');
        let isLoginMode = true;
        const toggleQuestion = document.getElementById('toggleQuestion');

        btnToggle.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            
            if (isLoginMode) {
                title.textContent = 'Welcome Back';
                subtitle.textContent = 'Log in to sync your reminders';
                loginForm.classList.remove('hidden');
                signupForm.classList.add('hidden');
                toggleQuestion.textContent = "Don't have an account?";
                btnToggle.textContent = "Sign Up";
            } else {
                title.textContent = 'Create Account';
                subtitle.textContent = 'Sign up to keep your data safe';
                loginForm.classList.add('hidden');
                signupForm.classList.remove('hidden');
                toggleQuestion.textContent = "Already have an account?";
                btnToggle.textContent = "Log In";
            }
        });

        googleBtn.addEventListener('click', async () => {
            if (!firebaseAuth) return Utils.showToast('Firebase not configured!', 'error');
            
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                await firebaseAuth.signInWithPopup(provider);
                Utils.showToast('Welcome via Google!', 'success');
            } catch (error) {
                console.error('Google Auth Error:', error);
                Utils.showToast(this.getFriendlyErrorMessage(error.code), 'error');
            }
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!firebaseAuth) return Utils.showToast('Firebase is not configured yet!', 'error');

            const btn = document.getElementById('btnLogin');
            const originalText = btn.textContent;
            btn.textContent = 'Please wait...';
            btn.disabled = true;

            try {
                await firebaseAuth.signInWithEmailAndPassword(email, password);
                Utils.showToast('Welcome back!', 'success');
            } catch (error) {
                console.error('Login Error:', error);
                Utils.showToast(this.getFriendlyErrorMessage(error.code), 'error');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;

            if (!firebaseAuth) return Utils.showToast('Firebase is not configured yet!', 'error');

            const btn = document.getElementById('btnSignup');
            const originalText = btn.textContent;
            btn.textContent = 'Please wait...';
            btn.disabled = true;

            try {
                const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
                // Update profile with the name immediately
                if (userCredential.user) {
                    await userCredential.user.updateProfile({ displayName: name });
                    
                    // Force refresh the profile dropdown right away since onAuthStateChanged 
                    // might have already fired before the profile was updated
                    const nameEl = document.getElementById('profileDropdownName');
                    if (nameEl) nameEl.textContent = name;
                }
                Utils.showToast('Account created successfully!', 'success');
            } catch (error) {
                console.error('Signup Error:', error);
                Utils.showToast(this.getFriendlyErrorMessage(error.code), 'error');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    },

    getFriendlyErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/user-not-found': return 'No account found with this email.';
            case 'auth/wrong-password': return 'Incorrect password.';
            case 'auth/email-already-in-use': return 'An account already exists with this email.';
            case 'auth/weak-password': return 'Password must be at least 6 characters.';
            case 'auth/invalid-email': return 'Please enter a valid email address.';
            case 'auth/network-request-failed': return 'Network error. Please check your connection.';
            case 'auth/popup-closed-by-user': return 'Google sign-in was canceled.';
            default: return 'An error occurred. Please try again.';
        }
    }
};
