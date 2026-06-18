const JobsPage = {
    statusConfig: {
        applied: { label: 'Applied', badge: 'badge--primary' },
        interview: { label: 'Interview', badge: 'badge--warning' },
        offer: { label: 'Offer', badge: 'badge--success' },
        rejected: { label: 'Rejected', badge: 'badge--danger' },
        accepted: { label: 'Accepted', badge: 'badge--success' }
    },

    pipelineSteps: ['applied', 'interview', 'offer', 'accepted'],

    async render(container) {
        const items = await store.getAll('jobs');
        items.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

        container.innerHTML = `
            <div class="section-page animate-fade-in" style="padding-bottom:80px">
                <div class="section-header">
                    <span class="section-header__count">${items.length} application${items.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="items-list" id="jobsList">
                    ${items.length > 0
                        ? items.map((item, i) => this.renderItem(item, i)).join('')
                        : this.renderEmpty()
                    }
                </div>
                <button class="fab" id="addJobBtn" aria-label="Add new application">
                    ${Utils.icons.plus}
                </button>
            </div>
        `;
        this.attachEvents(container);
    },

    renderItem(item, index) {
        const config = this.statusConfig[item.status] || this.statusConfig.applied;
        const isRejected = item.status === 'rejected';

        return `
            <div class="item-card item-card--jobs animate-fade-in-up" data-collection="jobs" data-item-id="${item.id}" style="animation-delay:${index * 50}ms">
                <div class="item-card__top">
                    <div>
                        <span class="${config.badge}">${Utils.escapeHtml(config.label)}</span>
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
                <div class="item-card__title">${Utils.escapeHtml(item.company)}</div>
                <div class="item-card__subtitle">${Utils.escapeHtml(item.position)}</div>
                ${this.renderPipeline(item.status)}
                <div class="item-card__meta">
                    <span class="item-card__meta-item">
                        ${Utils.icons.calendar} Applied: ${Utils.formatDate(item.applicationDate)}
                    </span>
                    ${item.interviewDate ? `
                        <span class="item-card__meta-item">
                            ${Utils.icons.clock} Interview: ${Utils.formatDate(item.interviewDate)}
                        </span>
                    ` : ''}
                    ${item.followUpDate ? `
                        <span class="item-card__meta-item">
                            ${Utils.icons.calendar} Follow-up: ${Utils.formatDate(item.followUpDate)}
                        </span>
                    ` : ''}
                </div>
                ${item.notes ? `<div class="item-card__subtitle" style="margin-top:4px">${Utils.escapeHtml(item.notes)}</div>` : ''}
            </div>
        `;
    },

    renderPipeline(status) {
        const isRejected = status === 'rejected';
        const currentIndex = this.pipelineSteps.indexOf(status);

        return `
            <div class="status-pipeline">
                ${this.pipelineSteps.map((step, i) => {
                    let stepClass = 'status-step';
                    if (isRejected) {
                        stepClass += ' rejected';
                    } else if (i < currentIndex) {
                        stepClass += ' completed';
                    } else if (i === currentIndex) {
                        stepClass += ' active';
                    }
                    const label = step.charAt(0).toUpperCase() + step.slice(1);
                    return `<div class="${stepClass}">${Utils.escapeHtml(label)}</div>`;
                }).join('')}
            </div>
        `;
    },

    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state__icon">💼</div>
                <h3 class="empty-state__title">No applications yet</h3>
                <p class="empty-state__text">Start tracking your job applications and interviews</p>
            </div>
        `;
    },

    getFormHTML(item = null) {
        return `
            <form id="jobsForm">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Company *</label>
                        <input type="text" name="company" class="form-input" required value="${item ? Utils.escapeHtml(item.company) : ''}" placeholder="e.g. Google">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Position *</label>
                        <input type="text" name="position" class="form-input" required value="${item ? Utils.escapeHtml(item.position) : ''}" placeholder="e.g. Software Engineer">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Application Date *</label>
                        <input type="date" name="applicationDate" class="form-input" required value="${item?.applicationDate || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status *</label>
                        <select name="status" class="form-input" required>
                            <option value="applied" ${item?.status === 'applied' ? 'selected' : ''}>Applied</option>
                            <option value="interview" ${item?.status === 'interview' ? 'selected' : ''}>Interview</option>
                            <option value="offer" ${item?.status === 'offer' ? 'selected' : ''}>Offer</option>
                            <option value="rejected" ${item?.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                            <option value="accepted" ${item?.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Interview Date</label>
                        <input type="date" name="interviewDate" class="form-input" value="${item?.interviewDate || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Follow-up Date</label>
                        <input type="date" name="followUpDate" class="form-input" value="${item?.followUpDate || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-input" rows="3" placeholder="Salary, requirements, contact info...">${item?.notes ? Utils.escapeHtml(item.notes) : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn--ghost" onclick="Utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn--primary">${item ? 'Update' : 'Add'}</button>
                </div>
            </form>
        `;
    },

    attachEvents(container) {
        container.querySelector('#addJobBtn')?.addEventListener('click', () => {
            Utils.showModal('Add Application', this.getFormHTML());
            this.attachFormEvents();
        });

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.edit;
                const item = await store.get('jobs', id);
                if (item) {
                    Utils.showModal('Edit Application', this.getFormHTML(item));
                    this.attachFormEvents(id);
                }
            });
        });

        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delete;
                const ok = await Utils.confirm('Delete Application?', 'This cannot be undone.');
                if (ok) {
                    await store.delete('jobs', id);
                    Utils.showToast('Application deleted', 'success');
                    this.render(container);
                }
            });
        });
    },

    attachFormEvents(editId = null) {
        const form = document.getElementById('jobsForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = Object.fromEntries(fd);

            if (editId) {
                await store.update('jobs', editId, data);
                Utils.showToast('Application updated!', 'success');
            } else {
                await store.add('jobs', data);
                Utils.showToast('Application added!', 'success');
            }
            Utils.hideModal();
            this.render(document.getElementById('mainContent'));
        });
    }
};
