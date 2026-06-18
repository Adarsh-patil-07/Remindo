/* ============================================
   REMINDO — App Controller
   Initialization, routing, navigation,
   drawer, modal, and global event handling
   ============================================ */

const App = {

    async init() {
        // Setup global UI handlers
        this.setupTopBar();
        this.setupBottomNav();
        this.setupDrawer();
        this.setupModal();

        // Register all routes
        this.registerRoutes();

        // Load theme
        const theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);

        // Initialize notifications
        await notifications.init();

        // Initialize Quick Actions (long-press radial menu)
        QuickActions.init();

        const authWrapper = document.getElementById('authWrapper');
        const appWrapper = document.getElementById('app');

        // Check if Firebase Auth is available
        if (typeof firebaseAuth !== 'undefined' && firebaseAuth) {
            firebaseAuth.onAuthStateChanged(async user => {
                const splash = document.getElementById('splashScreen');
                if (splash) splash.classList.add('hidden');

                if (user) {
                    store.setUser(user.uid);
                    
                    // Check if user just logged in to verify identity for clearing data
                    if (localStorage.getItem('remindo_pending_clear') === 'true') {
                        localStorage.removeItem('remindo_pending_clear');
                        Utils.showToast('Identity verified. Clearing data...', 'info');
                        await store.clearAll();
                        Utils.showToast('All data permanently cleared.', 'success');
                        setTimeout(() => location.reload(), 1500);
                        return;
                    }

                    // Update profile dropdown
                    const nameEl = document.getElementById('profileDropdownName');
                    const emailEl = document.getElementById('profileDropdownEmail');
                    if (nameEl) nameEl.textContent = user.displayName || 'Remindo User';
                    if (emailEl) emailEl.textContent = user.email || '';

                    authWrapper.classList.add('hidden');
                    appWrapper.classList.remove('hidden');
                    router.start();
                } else {
                    // No user is signed in.
                    store.setUser(null);
                    appWrapper.classList.add('hidden');
                    authWrapper.classList.remove('hidden');
                    AuthPage.render(authWrapper);
                }
            });
        } else {
            const splash = document.getElementById('splashScreen');
            if (splash) splash.classList.add('hidden');

            // Fallback to local storage mode
            appWrapper.classList.remove('hidden');
            router.start();
        }

        console.log('🚀 Remindo initialized');
    },

    /* ===== ROUTE REGISTRATION ===== */

    registerRoutes() {
        const main = document.getElementById('mainContent');

        // Home
        router.register('/', () => {
            this.setPage('Remindo', false, true);
            HomePage.render(main);
        });

        // Section pages
        router.register('/birthdays', () => {
            this.setPage('🎂 Birthdays', true, true);
            BirthdaysPage.render(main);
        });

        router.register('/bills', () => {
            this.setPage('💡 Bills & Payments', true, true);
            BillsPage.render(main);
        });

        router.register('/student', () => {
            this.setPage('🎓 Student Tracker', true, true);
            StudentPage.render(main);
        });

        router.register('/jobs', () => {
            this.setPage('💼 Job Tracker', true, true);
            JobsPage.render(main);
        });

        router.register('/medicines', () => {
            this.setPage('💊 Medicine Vault', true, true);
            MedicinesPage.render(main);
        });

        router.register('/wishlist', () => {
            this.setPage('🛒 Wishlist', true, true);
            WishlistPage.render(main);
        });

        router.register('/sizes', () => {
            this.setPage('📏 My Sizes', true, true);
            SizesPage.render(main);
        });

        // Reminders
        router.register('/reminders', () => {
            this.setPage('🔔 All Reminders', true, true);
            RemindersPage.render(main);
        });

        router.register('/reminders/create', () => {
            this.setPage('➕ New Reminder', true, true);
            RemindersPage.renderCreate(main);
        });
    },

    /* ===== PAGE STATE ===== */

    setPage(title, showBack, showNav) {
        // Update title
        const titleEl = document.getElementById('pageTitle');
        const backBtn = document.getElementById('backBtn');
        const bottomNav = document.getElementById('bottomNav');
        const profileBtn = document.getElementById('profileBtn');

        if (titleEl) {
            titleEl.textContent = title;
            // Apply gradient only on home
            if (title === 'Remindo') {
                titleEl.classList.remove('top-bar__title--plain');
            } else {
                titleEl.classList.add('top-bar__title--plain');
            }
        }

        // Show/hide back button
        if (backBtn) {
            if (showBack) {
                backBtn.classList.remove('hidden');
            } else {
                backBtn.classList.add('hidden');
            }
        }

        // Show/hide profile on home only
        if (profileBtn) {
            if (title === 'Remindo') {
                profileBtn.classList.remove('hidden');
            } else {
                profileBtn.classList.add('hidden');
            }
        }

        // Close drawer on any navigation
        this.closeDrawer();
    },

    /* ===== TOP BAR ===== */

    setupTopBar() {
        // Back button
        document.getElementById('backBtn')?.addEventListener('click', () => {
            router.back();
        });

        // Profile button
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');

        if (profileBtn && profileDropdown) {
            // Toggle dropdown
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('hidden');
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileDropdown.contains(e.target)) {
                    profileDropdown.classList.add('hidden');
                }
            });

            // Dropdown Actions
            document.getElementById('btnToggleTheme')?.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                document.getElementById('themeLabel').textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
                profileDropdown.classList.add('hidden');
            });

            document.getElementById('btnAbout')?.addEventListener('click', () => {
                profileDropdown.classList.add('hidden');
                Utils.showPopup(`
                    <div class="about-modal">
                        <div style="text-align:center;">
                            <img src="assets/icon.png" alt="Remindo Icon" style="display: block; margin: 0 auto 10px auto; width: 56px; height: 56px; border-radius: 12px; box-shadow: 0 6px 12px rgba(0,0,0,0.25);">
                            <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; color: var(--text-primary); letter-spacing: -0.4px;">Remindo</h2>
                            <div style="margin-bottom: 12px;">
                                <span style="display:inline-block; padding: 2px 8px; background: var(--surface-hover); color: var(--text-secondary); font-size: 0.7rem; border-radius: 16px; font-weight: 500;">Version 1.0</span>
                            </div>
                            <p style="color: var(--text-secondary); font-size: 0.8rem; line-height: 1.35; margin-bottom: 18px;">
                                Your personal life manager. Track bills, birthdays, routines, and important reminders — all in one place.
                            </p>
                        </div>

                        <div style="height: 1px; background: var(--border); margin-bottom: 18px;"></div>

                        <div style="display: flex; gap: 12px; margin-bottom: 18px; align-items: flex-start; text-align: left;">
                            <img src="assets/Adarsh-avatar.png" alt="Adarsh Patil" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
                            <div>
                                <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">Adarsh Patil</div>
                                <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 4px;">Software Developer</div>
                                <p style="font-size: 0.7rem; color: var(--text-tertiary); line-height: 1.35; margin: 0;">
                                    Specializing in Web Apps & Android APK development. Passionate about building modern, user-friendly digital solutions.
                                </p>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px;">
                            <a href="https://github.com/Adarsh-patil-07" target="_blank" class="about-link" style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-elevated); border-radius: 10px; text-decoration: none; color: var(--text-primary); font-weight: 600; font-size: 0.8rem; transition: transform 0.1s; border: 1px solid var(--border);">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                                GitHub — Adarsh-patil-07
                            </a>
                            <a href="https://www.linkedin.com/in/adarsh-patil0721" target="_blank" class="about-link" style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-elevated); border-radius: 10px; text-decoration: none; color: var(--text-primary); font-weight: 600; font-size: 0.8rem; transition: transform 0.1s; border: 1px solid var(--border);">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                LinkedIn — adarsh-patil0721
                            </a>
                            <a href="https://adarsh-patil-portfolio.netlify.app/" target="_blank" class="about-link" style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-elevated); border-radius: 10px; text-decoration: none; color: var(--text-primary); font-weight: 600; font-size: 0.8rem; transition: transform 0.1s; border: 1px solid var(--border);">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                Portfolio Website
                            </a>
                        </div>

                        <div style="text-align: center; color: var(--text-tertiary); font-size: 0.7rem;">
                            Made with <span style="color: #ff4757;">❤️</span> by Adarsh Patil
                        </div>
                    </div>
                `);
            });

            document.getElementById('btnLogout')?.addEventListener('click', async () => {
                profileDropdown.classList.add('hidden');
                if (firebaseAuth) {
                    try {
                        await firebaseAuth.signOut();
                        Utils.showToast('Logged out successfully', 'info');
                    } catch (e) {
                        Utils.showToast('Failed to log out', 'error');
                    }
                } else {
                    Utils.showToast('Logout requires Firebase', 'info');
                }
            });
        }
    },

    /* ===== BOTTOM NAVIGATION ===== */

    setupBottomNav() {
        // Home
        document.getElementById('navHome')?.addEventListener('click', () => {
            this.closeDrawer();
            router.navigate('/');
        });

        // Sections (toggle drawer)
        document.getElementById('navSections')?.addEventListener('click', () => {
            this.toggleDrawer();
        });

        // Settings (placeholder)
        document.getElementById('navSettings')?.addEventListener('click', () => {
            this.showSettingsMenu();
        });
    },

    /* ===== SECTIONS DRAWER ===== */

    setupDrawer() {
        const overlay = document.getElementById('drawerOverlay');
        const drawer = document.getElementById('sectionsDrawer');

        // Close on overlay tap
        overlay?.addEventListener('click', () => this.closeDrawer());

        // Close when section link is tapped
        drawer?.querySelectorAll('.drawer__item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.closeDrawer();
            });
        });
    },

    toggleDrawer() {
        const overlay = document.getElementById('drawerOverlay');
        const drawer = document.getElementById('sectionsDrawer');
        const navBtn = document.getElementById('navSections');

        const isOpen = !drawer.classList.contains('hidden');

        if (isOpen) {
            this.closeDrawer();
        } else {
            overlay.classList.remove('hidden');
            drawer.classList.remove('hidden');
            navBtn?.classList.add('active');
        }
    },

    closeDrawer() {
        document.getElementById('drawerOverlay')?.classList.add('hidden');
        document.getElementById('sectionsDrawer')?.classList.add('hidden');

        // Reset nav active states
        const navBtn = document.getElementById('navSections');
        if (navBtn) navBtn.classList.remove('active');

        // Re-apply correct active state
        if (router.getCurrentPath() === '/') {
            document.getElementById('navHome')?.classList.add('active');
        }
    },

    /* ===== MODAL ===== */

    setupModal() {
        // Close on overlay
        document.getElementById('modalOverlay')?.addEventListener('click', () => {
            Utils.hideModal();
        });

        // Close button
        document.getElementById('modalClose')?.addEventListener('click', () => {
            Utils.hideModal();
        });
    },

    /* ===== SETTINGS ===== */

    showSettingsMenu() {
        const hasNotifPermission = notifications.permission === 'granted';

        Utils.showModal('Settings', `
            <div class="settings-menu">
                <div class="settings-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);">
                    <div>
                        <div style="font-weight:600;font-size:14px;">🔔 Notifications</div>
                        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                            ${hasNotifPermission ? 'Enabled ✓' : 'Get reminders on Day 3 & Day 1'}
                        </div>
                    </div>
                    ${!hasNotifPermission ? '<button class="btn btn--primary btn--sm" id="btnEnableNotif">Enable</button>' : '<span class="badge badge--success">ON</span>'}
                </div>

                <div class="settings-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);">
                    <div>
                        <div style="font-weight:600;font-size:14px;">📥 Export Data</div>
                        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">Download all your data as JSON</div>
                    </div>
                    <button class="btn btn--ghost btn--sm" id="btnExportData">Export</button>
                </div>

                <div class="settings-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);">
                    <div>
                        <div style="font-weight:600;font-size:14px;">📤 Import Data</div>
                        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">Restore from JSON backup</div>
                    </div>
                    <button class="btn btn--ghost btn--sm" id="btnImportData">Import</button>
                    <input type="file" id="importFileInput" accept=".json" style="display:none;">
                </div>

                <div class="settings-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;">
                    <div>
                        <div style="font-weight:600;font-size:14px;">🗑️ Clear All Data</div>
                        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">Remove everything permanently</div>
                    </div>
                    <button class="btn btn--danger btn--sm" id="btnClearData">Clear</button>
                </div>

                <div style="margin-top:24px;text-align:center;color:var(--text-tertiary);font-size:11px;">
                    Remindo v1.0 — Made with 💜
                </div>
            </div>
        `);

        // Attach settings events
        setTimeout(() => {
            document.getElementById('btnEnableNotif')?.addEventListener('click', async () => {
                await notifications.requestPermission();
                Utils.hideModal();
            });

            document.getElementById('btnExportData')?.addEventListener('click', async () => {
                const data = await store.exportAll();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `remindo-backup-${Utils.today()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                Utils.showToast('Data exported!', 'success');
                Utils.hideModal();
            });

            document.getElementById('btnImportData')?.addEventListener('click', () => {
                document.getElementById('importFileInput')?.click();
            });

            document.getElementById('importFileInput')?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    await store.importAll(data);
                    Utils.showToast('Data imported! Refreshing...', 'success');
                    Utils.hideModal();
                    setTimeout(() => router.navigate('/'), 500);
                } catch (err) {
                    Utils.showToast('Invalid backup file', 'error');
                }
            });

            document.getElementById('btnClearData')?.addEventListener('click', async () => {
                Utils.hideModal();
                const ok = await Utils.confirm(
                    'Clear All Data?',
                    'This will permanently delete everything in Remindo. This cannot be undone.'
                );
                if (ok) {
                    if (typeof firebaseAuth !== 'undefined' && firebaseAuth.currentUser) {
                        localStorage.setItem('remindo_pending_clear', 'true');
                        await firebaseAuth.signOut();
                        Utils.showToast('Please log in again to verify identity and clear data.', 'warning');
                    } else {
                        await store.clearAll();
                        Utils.showToast('All data cleared', 'info');
                        router.navigate('/');
                        setTimeout(() => location.reload(), 500);
                    }
                }
            });
        }, 100);
    }
};

/* ===== BOOT ===== */
document.addEventListener('DOMContentLoaded', () => App.init());
