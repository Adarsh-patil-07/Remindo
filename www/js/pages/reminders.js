/* ============================================
   REMINDO — Reminders Page
   List view + inline create form
   ============================================ */

const RemindersPage = {

    /* ===== LIST VIEW ===== */
    async render(container) {
        const items = await store.getAll('reminders');

        // Sort: overdue first, then soonest upcoming
        items.sort((a, b) => new Date(a.date) - new Date(b.date));

        container.innerHTML = `
            <div class="section-page animate-fade-in">
                <div class="section-header">
                    <span class="section-header__count">${items.length} reminder${items.length !== 1 ? 's' : ''}</span>
                </div>

                <div class="items-list" id="remindersList">
                    ${items.length > 0
                        ? items.map((item, i) => this.renderItem(item, i)).join('')
                        : this.renderEmpty()
                    }
                </div>

                <button class="fab" id="addReminderBtn" aria-label="Add new reminder">
                    ${Utils.icons.plus}
                </button>
            </div>
        `;

        this.attachEvents(container);
    },

    /* --- Single reminder card --- */
    renderItem(item, index) {
        const overdue = Utils.isOverdue(item.date);
        const relativeTime = Utils.getRelativeTime(item.date);
        const notesPreview = item.notes
            ? Utils.escapeHtml(item.notes.length > 60 ? item.notes.slice(0, 60) + '…' : item.notes)
            : '';

        return `
            <div class="item-card item-card--reminder animate-fade-in-up" data-collection="reminders" data-item-id="${item.id}" style="animation-delay:${index * 50}ms">
                <div class="item-card__top">
                    <div>
                        <div class="item-card__title">${Utils.escapeHtml(item.title)}</div>
                        ${notesPreview
                            ? `<div class="item-card__subtitle">${notesPreview}</div>`
                            : ''
                        }
                    </div>
                    <div class="item-card__actions">
                        <button class="item-card__action item-card__action--edit" data-edit="${item.id}" aria-label="Edit">
                            ${Utils.icons.edit}
                        </button>
                        <button class="item-card__action item-card__action--delete" data-delete="${item.id}" aria-label="Delete">
                            ${Utils.icons.delete}
                        </button>
                    </div>
                </div>

                <div class="item-card__meta">
                    <span class="item-card__meta-item">
                        ${Utils.icons.calendar}
                        ${Utils.formatDate(item.date)}
                    </span>
                    <span class="badge ${overdue ? 'badge--danger' : 'badge--primary'}">
                        ${relativeTime}
                    </span>
                </div>
            </div>
        `;
    },

    /* --- Empty state --- */
    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state__icon">🔔</div>
                <h3 class="empty-state__title">No reminders yet</h3>
                <p class="empty-state__text">Create quick reminders for anything you want to remember</p>
            </div>
        `;
    },

    /* --- Modal form HTML --- */
    getFormHTML(item = null) {
        return `
            <form id="reminderForm">
                <div class="form-group">
                    <label class="form-label" for="reminderTitle">Title</label>
                    <input type="text" id="reminderTitle" name="title"
                        value="${item ? Utils.escapeHtml(item.title) : ''}"
                        placeholder="What to remember" required />
                </div>

                <div class="form-group">
                    <label class="form-label" for="reminderDate">Date</label>
                    <input type="date" id="reminderDate" name="date"
                        value="${item ? item.date : ''}" required />
                </div>

                <div class="form-group">
                    <label class="form-label" for="reminderNotes">Notes</label>
                    <textarea id="reminderNotes" name="notes"
                        placeholder="Optional details">${item ? Utils.escapeHtml(item.notes || '') : ''}</textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--ghost" onclick="Utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn--primary">${item ? 'Update' : 'Add'}</button>
                </div>
            </form>
        `;
    },

    /* --- Attach list-view events --- */
    attachEvents(container) {
        // FAB → add modal
        container.querySelector('#addReminderBtn')?.addEventListener('click', () => {
            Utils.showModal('Add Reminder', this.getFormHTML());
            this.attachFormEvents();
        });

        // Edit buttons
        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.edit;
                const item = await store.get('reminders', id);
                if (item) {
                    Utils.showModal('Edit Reminder', this.getFormHTML(item));
                    this.attachFormEvents(id);
                }
            });
        });

        // Delete buttons
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delete;
                const ok = await Utils.confirm('Delete reminder?', 'This cannot be undone.');
                if (ok) {
                    await store.delete('reminders', id);
                    Utils.showToast('Reminder deleted', 'success');
                    this.render(container);
                }
            });
        });
    },

    /* --- Attach modal form events --- */
    attachFormEvents(editId = null) {
        const form = document.getElementById('reminderForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = Object.fromEntries(fd);

            if (editId) {
                await store.update('reminders', editId, data);
                Utils.showToast('Reminder updated!', 'success');
            } else {
                await store.add('reminders', data);
                Utils.showToast('Reminder added!', 'success');
            }

            Utils.hideModal();
            this.render(document.getElementById('mainContent'));
        });
    },

    /* ===== CREATE VIEW (inline page form) ===== */
    async renderCreate(container) {
        container.innerHTML = `
            <div class="section-page animate-fade-in">
                <div style="text-align:center; margin-bottom:var(--space-xl);">
                    <div style="font-size:2.5rem; margin-bottom:var(--space-sm);">🔔</div>
                    <p style="font-size:var(--fs-sm); color:var(--text-secondary);">
                        Create a quick reminder
                    </p>
                </div>

                <div class="card" style="padding:var(--space-lg);">
                    <form id="reminderCreateForm">
                        <div class="form-group">
                            <label class="form-label" for="createTitle">Title</label>
                            <input type="text" id="createTitle" name="title"
                                placeholder="What to remember" required />
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="createDate">Date</label>
                            <input type="date" id="createDate" name="date"
                                value="${Utils.today()}" required />
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="createNotes">Notes</label>
                            <textarea id="createNotes" name="notes"
                                placeholder="Optional details"></textarea>
                        </div>

                        <button type="submit" class="btn btn--primary btn--block">
                            Create Reminder
                        </button>
                    </form>
                </div>
            </div>
        `;

        this.attachCreateEvents(container);

        // Initialize flatpickr on the inline date input (not inside a modal)
        if (typeof flatpickr !== 'undefined') {
            flatpickr(container.querySelector('#createDate'), {
                disableMobile: "true",
                altInput: true,
                altFormat: "F j, Y",
                dateFormat: "Y-m-d",
            });
        }
    },

    /* --- Attach create-form events --- */
    attachCreateEvents(container) {
        const form = container.querySelector('#reminderCreateForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = Object.fromEntries(fd);

            await store.add('reminders', data);
            Utils.showToast('Reminder created!', 'success');
            router.navigate('/reminders');
        });
    }
};
