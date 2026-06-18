/* ============================================
   REMINDO — Notification Manager
   PWA notifications + reminder scanning
   ============================================ */

class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.checkInterval = null;
        this.notifiedKey = 'remindo_notified';
    }

    /** Initialize notification system */
    async init() {
        if (!('Notification' in window)) {
            console.warn('🔕 Browser notifications not supported');
            return;
        }

        this.permission = Notification.permission;

        // Request permission if not decided
        if (this.permission === 'default') {
            // Don't auto-request — wait for user action
            console.log('🔔 Notifications: waiting for user to grant permission');
        }

        // Start periodic check
        this.startPeriodicCheck();
    }

    /** Request notification permission (call from UI) */
    async requestPermission() {
        if (!('Notification' in window)) return 'denied';

        try {
            this.permission = await Notification.requestPermission();
            if (this.permission === 'granted') {
                Utils.showToast('Notifications enabled! 🔔', 'success');
                // Run an immediate check after permission granted
                this.checkUpcoming();
            }
            return this.permission;
        } catch (e) {
            console.error('Permission request failed:', e);
            return 'denied';
        }
    }

    /** Send a notification */
    send(title, body, tag = '') {
        if (this.permission !== 'granted') return;

        try {
            // Use service worker for notifications if available
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(title, {
                        body,
                        icon: '/icons/icon-192.svg',
                        badge: '/icons/icon-192.svg',
                        tag: tag || undefined,
                        vibrate: [200, 100, 200],
                        requireInteraction: false,
                        data: { url: '/' }
                    });
                });
            } else {
                // Fallback to regular Notification API
                const notification = new Notification(title, {
                    body,
                    icon: '/icons/icon-192.svg',
                    tag: tag || undefined
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            }
        } catch (e) {
            console.warn('Notification send failed:', e);
        }
    }

    /** Scan all sections for upcoming items (within 3 days) and send notifications */
    async checkUpcoming() {
        if (this.permission !== 'granted') return;

        const sectionConfigs = [
            { key: 'birthdays', dateField: 'date', nameField: 'name', emoji: '🎂', recurring: true },
            { key: 'bills', dateField: 'dueDate', nameField: 'name', emoji: '💡' },
            { key: 'student', dateField: 'deadline', nameField: 'title', emoji: '🎓' },
            { key: 'jobs', dateField: 'interviewDate', nameField: 'company', emoji: '💼' },
            { key: 'medicines', dateField: 'refillDate', nameField: 'name', emoji: '💊' },
            { key: 'reminders', dateField: 'date', nameField: 'title', emoji: '🔔' }
        ];

        // Load notification history
        let notified = {};
        try {
            notified = JSON.parse(localStorage.getItem(this.notifiedKey) || '{}');
        } catch { notified = {}; }

        // Get today's date key for daily reset
        const todayKey = Utils.today();

        for (const config of sectionConfigs) {
            let items;
            try {
                items = await store.getAll(config.key);
            } catch { continue; }

            for (const item of items) {
                let dateStr = item[config.dateField];
                if (!dateStr) continue;

                // For recurring events, get next occurrence
                if (config.recurring && item.recurring !== false) {
                    dateStr = Utils.getNextOccurrence(dateStr);
                }
                if (!dateStr) continue;

                const days = Utils.daysUntil(dateStr);
                const name = item[config.nameField] || 'Untitled';
                const notifBase = `${config.key}_${item.id}`;

                // Notify on Day 3
                if (days === 3) {
                    const notifId = `${notifBase}_3d_${todayKey}`;
                    if (!notified[notifId]) {
                        this.send(
                            `${config.emoji} 3 days left`,
                            `${name} — ${Utils.formatDate(dateStr)}`,
                            notifId
                        );
                        notified[notifId] = true;
                    }
                }

                // Notify on Day 1
                if (days === 1) {
                    const notifId = `${notifBase}_1d_${todayKey}`;
                    if (!notified[notifId]) {
                        this.send(
                            `${config.emoji} Tomorrow!`,
                            `${name} is tomorrow!`,
                            notifId
                        );
                        notified[notifId] = true;
                    }
                }

                // Notify on Day 0 (today)
                if (days === 0) {
                    const notifId = `${notifBase}_0d_${todayKey}`;
                    if (!notified[notifId]) {
                        this.send(
                            `${config.emoji} Today!`,
                            `${name} is today!`,
                            notifId
                        );
                        notified[notifId] = true;
                    }
                }
            }
        }

        // Cleanup old notification records (keep last 7 days)
        this._cleanupNotified(notified);
        localStorage.setItem(this.notifiedKey, JSON.stringify(notified));
    }

    /** Remove notification records older than 7 days */
    _cleanupNotified(notified) {
        const now = new Date();
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];

        for (const key of Object.keys(notified)) {
            // Extract date from key (last part after last underscore)
            const parts = key.split('_');
            const datepart = parts[parts.length - 1];
            if (datepart && datepart < cutoff) {
                delete notified[key];
            }
        }
    }

    /** Start checking every hour */
    startPeriodicCheck() {
        // Check immediately on start
        setTimeout(() => this.checkUpcoming(), 2000);

        // Then every 30 minutes
        this.checkInterval = setInterval(() => {
            this.checkUpcoming();
        }, 30 * 60 * 1000);
    }

    /** Stop periodic checking */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// Global instance
const notifications = new NotificationManager();
