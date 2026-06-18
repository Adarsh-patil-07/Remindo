const StudentPage = {
    typeConfig: {
        exam: { label: 'Exam', badge: 'badge--danger' },
        registration: { label: 'Registration', badge: 'badge--primary' },
        scholarship: { label: 'Scholarship', badge: 'badge--success' },
        assignment: { label: 'Assignment', badge: 'badge--warning' }
    },

    async render(container) {
        const items = await store.getAll('student');
        items.sort((a, b) => {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });

        container.innerHTML = `
            <div class="section-page animate-fade-in" style="padding-bottom:80px">
                <div class="section-header">
                    <span class="section-header__count">${items.length} deadline${items.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="items-list" id="studentList">
                    ${items.length > 0
                        ? items.map((item, i) => this.renderItem(item, i)).join('')
                        : this.renderEmpty()
                    }
                </div>
                <button class="fab" id="addStudentBtn" aria-label="Add new deadline">
                    ${Utils.icons.plus}
                </button>
            </div>
        `;
        this.attachEvents(container);
    },

    renderItem(item, index) {
        const config = this.typeConfig[item.type] || this.typeConfig.assignment;
        const isCompleted = item.completed === true || item.completed === 'true' || item.completed === 'on';
        const overdue = !isCompleted && Utils.isOverdue(item.deadline);
        const statusBadge = isCompleted
            ? '<span class="badge--success">Completed</span>'
            : overdue
                ? '<span class="badge--danger">Overdue</span>'
                : '<span class="badge--warning">Pending</span>';

        return `
            <div class="item-card item-card--student animate-fade-in-up" data-collection="student" data-item-id="${item.id}" style="animation-delay:${index * 50}ms;${isCompleted ? 'opacity:0.5;' : ''}">
                <div class="item-card__top">
                    <div>
                        <span class="${config.badge}">${Utils.escapeHtml(config.label)}</span>
                        ${statusBadge}
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
                <div class="item-card__title">${Utils.escapeHtml(item.title)}</div>
                ${item.subject ? `<div class="item-card__subtitle">${Utils.escapeHtml(item.subject)}</div>` : ''}
                <div class="item-card__meta">
                    <span class="item-card__meta-item">
                        ${Utils.icons.calendar} ${Utils.formatDate(item.deadline)}
                    </span>
                    <span class="item-card__meta-item">
                        ${Utils.icons.clock} ${Utils.getRelativeTime(item.deadline)}
                    </span>
                </div>
                ${item.notes ? `<div class="item-card__subtitle" style="margin-top:4px">${Utils.escapeHtml(item.notes)}</div>` : ''}
            </div>
        `;
    },

    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state__icon">🎓</div>
                <h3 class="empty-state__title">No deadlines yet</h3>
                <p class="empty-state__text">Track your exams, assignments, and scholarship deadlines</p>
            </div>
        `;
    },

    getFormHTML(item = null) {
        const isCompleted = item && (item.completed === true || item.completed === 'true' || item.completed === 'on');
        return `
            <form id="studentForm">
                <div class="form-group">
                    <label class="form-label">Type *</label>
                    <select name="type" class="form-input" required>
                        <option value="exam" ${item?.type === 'exam' ? 'selected' : ''}>Exam</option>
                        <option value="registration" ${item?.type === 'registration' ? 'selected' : ''}>Registration</option>
                        <option value="scholarship" ${item?.type === 'scholarship' ? 'selected' : ''}>Scholarship</option>
                        <option value="assignment" ${item?.type === 'assignment' ? 'selected' : ''}>Assignment</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" name="title" class="form-input" required value="${item ? Utils.escapeHtml(item.title) : ''}" placeholder="e.g. Math Final Exam">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Subject</label>
                        <input type="text" name="subject" class="form-input" value="${item?.subject ? Utils.escapeHtml(item.subject) : ''}" placeholder="e.g. Mathematics">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Deadline *</label>
                        <input type="date" name="deadline" class="form-input" required value="${item?.deadline || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-input" rows="3" placeholder="Any additional notes...">${item?.notes ? Utils.escapeHtml(item.notes) : ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" style="display:flex;align-items:center;gap:8px">
                        <input type="checkbox" name="completed" ${isCompleted ? 'checked' : ''}>
                        Mark as completed
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn--ghost" onclick="Utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn--primary">${item ? 'Update' : 'Add'}</button>
                </div>
            </form>
        `;
    },

    attachEvents(container) {
        container.querySelector('#addStudentBtn')?.addEventListener('click', () => {
            Utils.showModal('Add Deadline', this.getFormHTML());
            this.attachFormEvents();
        });

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.edit;
                const item = await store.get('student', id);
                if (item) {
                    Utils.showModal('Edit Deadline', this.getFormHTML(item));
                    this.attachFormEvents(id);
                }
            });
        });

        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delete;
                const ok = await Utils.confirm('Delete Deadline?', 'This cannot be undone.');
                if (ok) {
                    await store.delete('student', id);
                    Utils.showToast('Deadline deleted', 'success');
                    this.render(container);
                }
            });
        });
    },

    attachFormEvents(editId = null) {
        const form = document.getElementById('studentForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = Object.fromEntries(fd);
            data.completed = form.querySelector('[name="completed"]').checked;

            if (editId) {
                await store.update('student', editId, data);
                Utils.showToast('Deadline updated!', 'success');
            } else {
                await store.add('student', data);
                Utils.showToast('Deadline added!', 'success');
            }
            Utils.hideModal();
            this.render(document.getElementById('mainContent'));
        });
    }
};
