const BillsPage = {
    async render(container) {
        const items = await store.getAll('bills');
        // Sort: unpaid overdue first, then by due date ascending
        items.sort((a, b) => {
            const aOverdue = Utils.isOverdue(a.dueDate) && !a.paid;
            const bOverdue = Utils.isOverdue(b.dueDate) && !b.paid;
            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;
            const daysA = Utils.daysUntil(a.dueDate);
            const daysB = Utils.daysUntil(b.dueDate);
            return daysA - daysB;
        });

        container.innerHTML = `
            <div class="section-page animate-fade-in" style="padding-bottom:80px">
                <div class="section-header">
                    <span class="section-header__count">${items.length} bill${items.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="items-list" id="billsList">
                    ${items.length > 0
                        ? items.map((item, i) => this.renderItem(item, i)).join('')
                        : this.renderEmpty()
                    }
                </div>
                <button class="fab" id="addBillBtn" aria-label="Add new bill">
                    ${Utils.icons.plus}
                </button>
            </div>
        `;
        this.attachEvents(container);
    },

    getBillEmoji(billType) {
        const emojis = {
            electricity: '💡',
            water: '💧',
            gas: '🔥',
            internet: '📶',
            mobile: '📱',
            other: '📋'
        };
        return emojis[billType] || '📋';
    },

    renderItem(item, index) {
        const emoji = this.getBillEmoji(item.billType);
        const typeLabel = item.billType ? item.billType.charAt(0).toUpperCase() + item.billType.slice(1) : 'Other';
        const isOverdue = Utils.isOverdue(item.dueDate) && !item.paid;
        const relativeTime = Utils.getRelativeTime(item.dueDate);
        const paidBadge = item.paid
            ? '<span class="badge--success">✅ Paid</span>'
            : '<span class="badge--danger">⏳ Unpaid</span>';
        const recurringLabel = item.recurring && item.recurringInterval
            ? item.recurringInterval.charAt(0).toUpperCase() + item.recurringInterval.slice(1)
            : '';

        return `
            <div class="item-card item-card--bills animate-fade-in-up${isOverdue ? ' item-card--overdue' : ''}" data-collection="bills" data-item-id="${item.id}" style="animation-delay:${index * 50}ms;${isOverdue ? 'border-left-color:var(--danger, #ef4444);background:rgba(239,68,68,0.05)' : ''}">
                <div class="item-card__top">
                    <div>
                        <div class="item-card__title">${emoji} ${Utils.escapeHtml(item.name)}</div>
                        ${item.amount ? `<div class="item-card__subtitle price">${Utils.icons.rupee} ${Utils.formatCurrency(item.amount)}</div>` : ''}
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
                        ${Utils.icons.calendar} ${Utils.formatDate(item.dueDate)}
                    </span>
                    <span class="item-card__meta-item ${isOverdue ? 'tag--high' : ''}">
                        ${Utils.icons.clock} ${relativeTime}
                    </span>
                    <span class="item-card__meta-item">${paidBadge}</span>
                    ${item.recurring ? `<span class="item-card__meta-item badge--primary">🔁 ${Utils.escapeHtml(recurringLabel || 'Recurring')}</span>` : ''}
                    <span class="item-card__meta-item">
                        ${Utils.icons.tag} ${Utils.escapeHtml(typeLabel)}
                    </span>
                </div>
                ${item.notes ? `<div class="item-card__subtitle">${Utils.escapeHtml(item.notes)}</div>` : ''}
            </div>
        `;
    },

    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state__icon">💡</div>
                <h3 class="empty-state__title">No bills tracked</h3>
                <p class="empty-state__text">Add your recurring bills to never miss a payment</p>
            </div>
        `;
    },

    getFormHTML(item = null) {
        const billType = item ? item.billType : 'electricity';
        const name = item ? Utils.escapeHtml(item.name) : '';
        const amount = item && item.amount ? item.amount : '';
        const dueDate = item ? item.dueDate : '';
        const recurring = item ? item.recurring !== false : true;
        const recurringInterval = item ? (item.recurringInterval || 'monthly') : 'monthly';
        const paid = item ? !!item.paid : false;
        const notes = item ? Utils.escapeHtml(item.notes || '') : '';

        return `
            <form id="billForm">
                <div class="form-group">
                    <label class="form-label">Bill Type</label>
                    <select name="billType" class="form-input" required>
                        <option value="electricity" ${billType === 'electricity' ? 'selected' : ''}>💡 Electricity</option>
                        <option value="water" ${billType === 'water' ? 'selected' : ''}>💧 Water</option>
                        <option value="gas" ${billType === 'gas' ? 'selected' : ''}>🔥 Gas</option>
                        <option value="internet" ${billType === 'internet' ? 'selected' : ''}>📶 Internet</option>
                        <option value="mobile" ${billType === 'mobile' ? 'selected' : ''}>📱 Mobile</option>
                        <option value="other" ${billType === 'other' ? 'selected' : ''}>📋 Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Bill Name</label>
                    <input type="text" name="name" class="form-input" placeholder="e.g. BESCOM Electricity" value="${name}" required />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Amount (₹)</label>
                        <input type="number" name="amount" class="form-input" placeholder="0" value="${amount}" min="0" step="0.01" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Due Date</label>
                        <input type="date" name="dueDate" class="form-input" value="${dueDate}" required />
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" style="display:flex;align-items:center;gap:8px">
                        <input type="checkbox" name="recurring" value="true" id="billRecurringCheck" ${recurring ? 'checked' : ''} />
                        Recurring bill
                    </label>
                </div>
                <div class="form-group" id="recurringIntervalGroup" style="${recurring ? '' : 'display:none'}">
                    <label class="form-label">Recurring Interval</label>
                    <select name="recurringInterval" class="form-input">
                        <option value="monthly" ${recurringInterval === 'monthly' ? 'selected' : ''}>Monthly</option>
                        <option value="quarterly" ${recurringInterval === 'quarterly' ? 'selected' : ''}>Quarterly</option>
                        <option value="yearly" ${recurringInterval === 'yearly' ? 'selected' : ''}>Yearly</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" style="display:flex;align-items:center;gap:8px">
                        <input type="checkbox" name="paid" value="true" ${paid ? 'checked' : ''} />
                        Paid
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-input" rows="3" placeholder="Account number, reminders...">${notes}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn--ghost" onclick="Utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn--primary">${item ? 'Update' : 'Add'}</button>
                </div>
            </form>
        `;
    },

    attachEvents(container) {
        container.querySelector('#addBillBtn')?.addEventListener('click', () => {
            Utils.showModal('Add Bill', this.getFormHTML());
            this.attachFormEvents();
        });

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.edit;
                const item = await store.get('bills', id);
                if (item) {
                    Utils.showModal('Edit Bill', this.getFormHTML(item));
                    this.attachFormEvents(id);
                }
            });
        });

        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delete;
                const ok = await Utils.confirm('Delete?', 'This cannot be undone.');
                if (ok) {
                    await store.delete('bills', id);
                    Utils.showToast('Deleted', 'success');
                    this.render(container);
                }
            });
        });
    },

    attachFormEvents(editId = null) {
        const form = document.getElementById('billForm');
        if (!form) return;

        // Toggle recurring interval visibility
        const recurringCheck = document.getElementById('billRecurringCheck');
        const intervalGroup = document.getElementById('recurringIntervalGroup');
        if (recurringCheck && intervalGroup) {
            recurringCheck.addEventListener('change', () => {
                intervalGroup.style.display = recurringCheck.checked ? '' : 'none';
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = Object.fromEntries(fd);

            // Handle checkboxes
            data.recurring = fd.has('recurring');
            data.paid = fd.has('paid');

            // Convert amount to number if present
            if (data.amount) {
                data.amount = parseFloat(data.amount);
            } else {
                data.amount = null;
            }

            // Clear interval if not recurring
            if (!data.recurring) {
                data.recurringInterval = null;
            }

            if (editId) {
                await store.update('bills', editId, data);
                Utils.showToast('Updated!', 'success');
            } else {
                await store.add('bills', data);
                Utils.showToast('Added!', 'success');
            }

            Utils.hideModal();
            this.render(document.getElementById('mainContent'));
        });
    }
};
