const BirthdaysPage = {
    async render(container) {
        const items = await store.getAll('birthdays');
        // Sort by nearest upcoming date
        items.sort((a, b) => {
            const daysA = Utils.daysUntil(a.date);
            const daysB = Utils.daysUntil(b.date);
            return daysA - daysB;
        });

        container.innerHTML = `
            <div class="section-page animate-fade-in" style="padding-bottom:80px">
                <div class="section-header">
                    <span class="section-header__count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="items-list" id="birthdaysList">
                    ${items.length > 0
                        ? items.map((item, i) => this.renderItem(item, i)).join('')
                        : this.renderEmpty()
                    }
                </div>
                <button class="fab" id="addBirthdayBtn" aria-label="Add new birthday">
                    ${Utils.icons.plus}
                </button>
            </div>
        `;
        this.attachEvents(container);
    },

    renderItem(item, index) {
        const typeEmoji = item.type === 'birthday' ? '🎂' : item.type === 'anniversary' ? '💍' : '🎉';
        const typeBadgeClass = item.type === 'birthday'
            ? 'badge--primary'
            : item.type === 'anniversary'
                ? 'badge--success'
                : 'badge--warning';
        const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
        const relativeTime = Utils.getRelativeTime(item.date);
        const isUpcoming = Utils.isWithinDays(item.date, 7);

        return `
            <div class="item-card item-card--birthday animate-fade-in-up" data-collection="birthdays" data-item-id="${item.id}" style="animation-delay:${index * 50}ms">
                <div class="item-card__top">
                    <div>
                        <span class="${typeBadgeClass}" style="display:inline-block;margin-bottom:4px">${typeEmoji} ${Utils.escapeHtml(typeLabel)}</span>
                        <div class="item-card__title">${Utils.escapeHtml(item.name)}</div>
                    </div>
                    <div class="item-card__actions">
                        <button class="item-card__action item-card__action--edit" data-edit="${Utils.escapeHtml(item.id)}" aria-label="Edit">
                            ${Utils.icons.edit}
                        </button>
                        <button class="item-card__action item-card__action--delete" data-delete="${Utils.escapeHtml(item.id)}" aria-label="Delete">
                            ${Utils.icons.delete}
                        </button>
                    </div>
                </div>
                <div class="item-card__meta">
                    <span class="item-card__meta-item">
                        ${Utils.icons.calendar} ${Utils.formatDate(item.date)}
                    </span>
                    <span class="item-card__meta-item ${isUpcoming ? 'tag--high' : ''}">
                        ${Utils.icons.clock} ${relativeTime}
                    </span>
                    ${item.recurring ? `<span class="item-card__meta-item badge--success">🔁 Recurring</span>` : ''}
                </div>
                ${item.notes ? `<div class="item-card__subtitle">${Utils.escapeHtml(item.notes)}</div>` : ''}
            </div>
        `;
    },

    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state__icon">🎂</div>
                <h3 class="empty-state__title">No birthdays yet</h3>
                <p class="empty-state__text">Tap + to add your first birthday or anniversary</p>
            </div>
        `;
    },

    getFormHTML(item = null) {
        const type = item ? item.type : 'birthday';
        const name = item ? Utils.escapeHtml(item.name) : '';
        const date = item ? item.date : '';
        const recurring = item ? item.recurring !== false : true;
        const notes = item ? Utils.escapeHtml(item.notes || '') : '';

        return `
            <form id="birthdayForm">
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select name="type" class="form-input" required>
                        <option value="birthday" ${type === 'birthday' ? 'selected' : ''}>🎂 Birthday</option>
                        <option value="anniversary" ${type === 'anniversary' ? 'selected' : ''}>💍 Anniversary</option>
                        <option value="custom" ${type === 'custom' ? 'selected' : ''}>🎉 Custom</option>
                    </select>
                </div>
                <div class="form-group floating">
                    <input type="text" name="name" class="form-input" placeholder=" " value="${name}" required />
                    <label class="form-label">Name / Event</label>
                </div>
                <div class="form-group floating">
                    <input type="date" name="date" class="form-input" placeholder=" " value="${date}" required />
                    <label class="form-label">Date</label>
                </div>
                <div class="form-group">
                    <label class="form-label" style="display:flex;align-items:center;gap:8px">
                        <input type="checkbox" name="recurring" value="true" ${recurring ? 'checked' : ''} />
                        Recurring every year
                    </label>
                </div>
                <div class="form-group floating">
                    <textarea name="notes" class="form-input" rows="3" placeholder=" ">${notes}</textarea>
                    <label class="form-label">Notes (Gift ideas, reminders)</label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn--ghost" onclick="Utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn--primary">${item ? 'Update' : 'Add'}</button>
                </div>
            </form>
        `;
    },

    attachEvents(container) {
        container.querySelector('#addBirthdayBtn')?.addEventListener('click', () => {
            Utils.showModal('Add Birthday', this.getFormHTML());
            this.attachFormEvents();
        });

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.edit;
                const item = await store.get('birthdays', id);
                if (item) {
                    Utils.showModal('Edit Birthday', this.getFormHTML(item));
                    this.attachFormEvents(id);
                }
            });
        });

        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delete;
                const ok = await Utils.confirm('Delete?', 'This cannot be undone.');
                if (ok) {
                    await store.delete('birthdays', id);
                    Utils.showToast('Deleted', 'success');
                    this.render(container);
                }
            });
        });
    },

    attachFormEvents(editId = null) {
        const form = document.getElementById('birthdayForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = Object.fromEntries(fd);

            // Handle checkbox — unchecked checkboxes aren't in FormData
            data.recurring = fd.has('recurring');

            if (editId) {
                await store.update('birthdays', editId, data);
                Utils.showToast('Updated!', 'success');
            } else {
                await store.add('birthdays', data);
                Utils.showToast('Added!', 'success');
            }

            Utils.hideModal();
            this.render(document.getElementById('mainContent'));
        });
    }
};
