/* ============================================
   REMINDO — Home Page
   Dashboard grid, action buttons,
   upcoming reminders within 3 days
   ============================================ */

const HomePage = {

    async render(container) {
        // Initial render with Skeleton Loaders for 0ms visual latency
        container.innerHTML = `
            <div class="home-page animate-fade-in">
                <!-- Dashboard Grid -->
                <section class="dashboard" id="homeDashboard">
                    <div class="dashboard-grid" id="dashboardGrid">
                        <div class="dashboard-box skeleton" style="height: 100px;"></div>
                        <div class="dashboard-box skeleton" style="height: 100px;"></div>
                        <div class="dashboard-box skeleton" style="height: 100px;"></div>
                        <div class="dashboard-box skeleton" style="height: 100px;"></div>
                        <div class="dashboard-box skeleton" style="height: 100px;"></div>
                        <div class="dashboard-box skeleton" style="height: 100px;"></div>
                    </div>
                </section>

                <!-- Action Buttons -->
                <section class="home-actions" id="homeActions">
                    <a href="#/reminders/create" class="action-btn action-btn--create" id="btnCreateReminder">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        <span>Create Reminder</span>
                    </a>
                    <a href="#/reminders" class="action-btn action-btn--view" id="btnViewReminders">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        <span>All Reminders</span>
                    </a>
                </section>

                <!-- Upcoming Reminders (within 3 days) -->
                <section class="reminders-section" id="homeReminders">
                    <h2 class="section-title">
                        <span>⏰ Upcoming</span>
                        <span class="section-badge skeleton" id="upcomingBadge" style="width:24px; color:transparent">0</span>
                    </h2>
                    <div class="reminders-list" id="remindersList">
                        <div class="reminder-card skeleton" style="height: 72px;"></div>
                        <div class="reminder-card skeleton" style="height: 72px;"></div>
                    </div>
                </section>
            </div>
        `;

        // Fetch data
        const counts = await this.getCounts();
        const upcoming = await this.getUpcomingReminders();

        // Update DOM
        const grid = container.querySelector('#dashboardGrid');
        if (grid) {
            grid.innerHTML = `
                ${this.renderBox('🎂', 'Birthdays', counts.birthdays, 'birthday', '#/birthdays', 0)}
                ${this.renderBox('💡', 'Bills', counts.bills, 'bills', '#/bills', 1)}
                ${this.renderBox('🎓', 'Student', counts.student, 'student', '#/student', 2)}
                ${this.renderBox('💼', 'Jobs', counts.jobs, 'jobs', '#/jobs', 3)}
                ${this.renderBox('💊', 'Medicines', counts.medicines, 'medicines', '#/medicines', 4)}
                ${this.renderBox('🛒', 'Wishlist', counts.wishlist, 'wishlist', '#/wishlist', 5)}
            `;
        }

        const list = container.querySelector('#remindersList');
        const badge = container.querySelector('#upcomingBadge');
        if (list && badge) {
            if (upcoming.length > 0) {
                badge.className = 'section-badge';
                badge.style = '';
                badge.textContent = upcoming.length;
                list.innerHTML = upcoming.map((r, i) => this.renderReminderCard(r, i)).join('');
            } else {
                badge.style.display = 'none';
                list.innerHTML = this.renderEmpty();
            }
        }
    },

    /* --- Dashboard Box --- */
    renderBox(emoji, label, count, type, href, index) {
        return `
            <a href="${href}" class="dashboard-box dashboard-box--${type} animate-fade-in-up"
               style="animation-delay: ${index * 60}ms" id="dashBox-${type}">
                <span class="dashboard-box__emoji">${emoji}</span>
                <span class="dashboard-box__count">${count}</span>
                <span class="dashboard-box__label">${label}</span>
            </a>
        `;
    },

    /* --- Reminder Card --- */
    renderReminderCard(item, index) {
        const days = Utils.daysUntil(item.date);
        const urgency = days <= 0 ? 'urgent' : days <= 1 ? 'urgent' : days <= 2 ? 'soon' : 'upcoming';

        return `
            <div class="reminder-card reminder-card--${urgency} animate-fade-in-up"
                 style="animation-delay: ${(index + 6) * 60}ms" id="upcomingReminder-${item.id}">
                <div class="reminder-card__icon">${item.emoji}</div>
                <div class="reminder-card__content">
                    <h3 class="reminder-card__title">${Utils.escapeHtml(item.name)}</h3>
                    <p class="reminder-card__date">${Utils.formatDate(item.date)}</p>
                </div>
                <div class="reminder-card__badge reminder-card__badge--${urgency}">
                    ${Utils.getRelativeTime(item.date)}
                </div>
            </div>
        `;
    },

    /* --- Empty State --- */
    renderEmpty() {
        return `
            <div class="empty-state animate-fade-in">
                <div class="empty-state__icon">✨</div>
                <h3 class="empty-state__title">All clear!</h3>
                <p class="empty-state__desc">No upcoming reminders in the next 3 days. Enjoy your time!</p>
            </div>
        `;
    },

    /* --- Data Helpers --- */

    async getCounts() {
        const counts = {};
        const sections = ['birthdays', 'bills', 'student', 'jobs', 'medicines', 'wishlist'];
        
        // Fetch all counts in parallel (massively speeds up UI rendering)
        const results = await Promise.all(sections.map(s => store.getCount(s)));
        
        sections.forEach((s, index) => {
            counts[s] = results[index];
        });
        
        return counts;
    },

    async getUpcomingReminders() {
        const result = [];

        const configs = [
            { key: 'birthdays', dateField: 'date', nameField: 'name', emoji: '🎂', recurring: true },
            { key: 'bills', dateField: 'dueDate', nameField: 'name', emoji: '💡' },
            { key: 'student', dateField: 'deadline', nameField: 'title', emoji: '🎓' },
            { key: 'jobs', dateField: 'interviewDate', nameField: 'company', emoji: '💼' },
            { key: 'medicines', dateField: 'refillDate', nameField: 'name', emoji: '💊' },
            { key: 'reminders', dateField: 'date', nameField: 'title', emoji: '🔔' }
        ];

        // Fetch all collections in parallel
        const allItems = await Promise.all(configs.map(async (config) => {
            try {
                return { config, items: await store.getAll(config.key) };
            } catch {
                return { config, items: [] };
            }
        }));

        for (const { config, items } of allItems) {
            for (const item of items) {
                let dateStr = item[config.dateField];
                if (!dateStr) continue;

                // Handle recurring dates (birthdays/anniversaries)
                if (config.recurring && item.recurring !== false) {
                    dateStr = Utils.getNextOccurrence(dateStr);
                }

                if (dateStr && Utils.isWithinDays(dateStr, 3)) {
                    result.push({
                        id: item.id,
                        name: item[config.nameField] || 'Untitled',
                        date: dateStr,
                        emoji: config.emoji,
                        section: config.key
                    });
                }
            }
        }

        // Sort upcoming reminders by closest date first
        result.sort((a, b) => Utils.daysUntil(a.date) - Utils.daysUntil(b.date));

        return result;
    }
};
