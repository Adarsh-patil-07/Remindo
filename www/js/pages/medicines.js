const MedicinesPage = {
    async render(container) {
        const items = await store.getAll('medicines');
        container.innerHTML = `
            <div class="section-page animate-fade-in" style="padding-bottom:80px">
                <div class="section-header">
                    <span class="section-header__count">${items.length} medicine${items.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="items-list" id="medicinesList">
                    ${items.length > 0
                        ? items.map((item, i) => this.renderItem(item, i)).join('')
                        : this.renderEmpty()
                    }
                </div>
                <button class="fab" id="addMedicineBtn" aria-label="Add new medicine">
                    ${Utils.icons.plus}
                </button>
            </div>
        `;
        this.attachEvents(container);
    },

    renderItem(item, index) {
        const name = Utils.escapeHtml(item.name || '');
        const dosage = item.dosage ? Utils.escapeHtml(item.dosage) : '';
        const hasRefill = !!item.refillDate;
        const refillSoon = hasRefill && Utils.isWithinDays(item.refillDate, 3);
        const refillOverdue = hasRefill && Utils.isOverdue(item.refillDate);
        const doctorNotes = item.doctorNotes ? Utils.escapeHtml(item.doctorNotes) : '';

        let refillBadgeClass = 'badge--primary';
        if (refillOverdue) {
            refillBadgeClass = 'badge--danger';
        } else if (refillSoon) {
            refillBadgeClass = 'badge--warning';
        }

        return `
            <div class="item-card item-card--medicines animate-fade-in-up" data-collection="medicines" data-item-id="${item.id}" style="animation-delay:${index * 50}ms">
                <div class="item-card__top">
                    <div>
                        <div class="item-card__title">${name}</div>
                        ${dosage ? `<span class="dosage-display">${dosage}</span>` : ''}
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
                    ${hasRefill ? `
                        <span class="item-card__meta-item">
                            ${Utils.icons.calendar}
                            Refill: ${Utils.formatDate(item.refillDate)}
                        </span>
                        <span class="${refillBadgeClass}">
                            ${refillOverdue ? 'Overdue' : Utils.getRelativeTime(item.refillDate)}
                        </span>
                    ` : ''}
                </div>
                ${doctorNotes ? `
                    <div class="item-card__subtitle" title="${doctorNotes}">
                        🩺 ${doctorNotes.length > 80 ? doctorNotes.substring(0, 80) + '…' : doctorNotes}
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state__icon">💊</div>
                <h3 class="empty-state__title">No medicines tracked</h3>
                <p class="empty-state__text">Keep track of your medicines, dosages, and refill dates</p>
            </div>
        `;
    },

    getFormHTML(item = null) {
        const name = item ? Utils.escapeHtml(item.name || '') : '';
        const dosage = item ? Utils.escapeHtml(item.dosage || '') : '';
        const refillDate = item ? (item.refillDate || '') : '';
        const doctorNotes = item ? Utils.escapeHtml(item.doctorNotes || '') : '';
        const notes = item ? Utils.escapeHtml(item.notes || '') : '';

        return `
            <form id="medicineForm">
                <div class="form-group">
                    <label class="form-label" for="medName">Medicine Name *</label>
                    <input type="text" id="medName" name="name" value="${name}" required placeholder="e.g. Paracetamol">
                </div>
                <div class="form-group">
                    <label class="form-label" for="medDosage">Dosage</label>
                    <input type="text" id="medDosage" name="dosage" value="${dosage}" placeholder="e.g. 500mg, 2x daily">
                </div>
                <div class="form-group">
                    <label class="form-label" for="medRefillDate">Refill Date</label>
                    <input type="date" id="medRefillDate" name="refillDate" value="${refillDate}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="medDoctorNotes">Doctor Notes</label>
                    <textarea id="medDoctorNotes" name="doctorNotes" rows="3" placeholder="Notes from your doctor">${doctorNotes}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="medNotes">Personal Notes</label>
                    <textarea id="medNotes" name="notes" rows="2" placeholder="Any additional notes">${notes}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn--ghost" onclick="Utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn--primary">${item ? 'Update' : 'Add'} Medicine</button>
                </div>
            </form>
        `;
    },

    attachEvents(container) {
        container.querySelector('#addMedicineBtn')?.addEventListener('click', () => {
            Utils.showModal('Add Medicine', this.getFormHTML());
            this.attachFormEvents();
        });

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.edit;
                const item = await store.get('medicines', id);
                if (item) {
                    Utils.showModal('Edit Medicine', this.getFormHTML(item));
                    this.attachFormEvents(id);
                }
            });
        });

        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delete;
                const ok = await Utils.confirm('Delete Medicine?', 'This cannot be undone.');
                if (ok) {
                    await store.delete('medicines', id);
                    Utils.showToast('Medicine deleted', 'success');
                    this.render(container);
                }
            });
        });
    },

    attachFormEvents(editId = null) {
        const form = document.getElementById('medicineForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = Object.fromEntries(fd);

            if (editId) {
                await store.update('medicines', editId, data);
                Utils.showToast('Medicine updated!', 'success');
            } else {
                await store.add('medicines', data);
                Utils.showToast('Medicine added!', 'success');
            }

            Utils.hideModal();
            this.render(document.getElementById('mainContent'));
        });
    }
};
