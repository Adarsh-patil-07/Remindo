/* ============================================
   REMINDO — Utility Functions
   Date helpers, formatting, toasts, modals,
   confirm dialogs, escaping, and more
   ============================================ */

const Utils = {
    /* ===== DATE HELPERS ===== */

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    },

    formatDateShort(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    },

    daysUntil(dateStr) {
        if (!dateStr) return Infinity;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr + 'T00:00:00');
        target.setHours(0, 0, 0, 0);
        return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    },

    getNextOccurrence(dateStr) {
        if (!dateStr) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(dateStr + 'T00:00:00');
        const thisYear = new Date(today.getFullYear(), date.getMonth(), date.getDate());

        if (thisYear >= today) {
            return thisYear.toISOString().split('T')[0];
        }
        const nextYear = new Date(today.getFullYear() + 1, date.getMonth(), date.getDate());
        return nextYear.toISOString().split('T')[0];
    },

    isWithinDays(dateStr, days) {
        const d = this.daysUntil(dateStr);
        return d >= 0 && d <= days;
    },

    isOverdue(dateStr) {
        return this.daysUntil(dateStr) < 0;
    },

    getRelativeTime(dateStr) {
        const days = this.daysUntil(dateStr);
        if (days < 0) return `${Math.abs(days)}d overdue`;
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `In ${days} days`;
    },

    today() {
        return new Date().toISOString().split('T')[0];
    },

    /* ===== FORMATTING ===== */

    formatCurrency(amount) {
        if (!amount && amount !== 0) return '';
        return '₹' + Number(amount).toLocaleString('en-IN');
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    truncate(str, len = 40) {
        if (!str || str.length <= len) return str || '';
        return str.substring(0, len) + '…';
    },

    /* ===== ID GENERATION ===== */

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    /* ===== TOAST NOTIFICATIONS ===== */

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;

        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast__icon">${icons[type] || icons.info}</span>
            <span class="toast__message">${this.escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('toast--visible'));
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('toast--visible');
            const onEnd = () => { toast.remove(); toast.removeEventListener('transitionend', onEnd); };
            toast.addEventListener('transitionend', onEnd);
            // Fallback removal
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    /* ===== CONFIRM DIALOG ===== */

    confirm(title, text) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('confirmOverlay');
            const dialog = document.getElementById('confirmDialog');
            const titleEl = document.getElementById('confirmTitle');
            const textEl = document.getElementById('confirmText');
            const cancelBtn = document.getElementById('confirmCancel');
            const okBtn = document.getElementById('confirmOk');

            if (!overlay || !dialog) { resolve(false); return; }

            titleEl.textContent = title;
            textEl.textContent = text;
            overlay.classList.remove('hidden');
            dialog.classList.remove('hidden');

            const cleanup = () => {
                overlay.classList.add('hidden');
                dialog.classList.add('hidden');
                cancelBtn.removeEventListener('click', onCancel);
                okBtn.removeEventListener('click', onOk);
                overlay.removeEventListener('click', onCancel);
            };

            const onCancel = () => { cleanup(); resolve(false); };
            const onOk = () => { cleanup(); resolve(true); };

            cancelBtn.addEventListener('click', onCancel);
            okBtn.addEventListener('click', onOk);
            overlay.addEventListener('click', onCancel);
        });
    },

    /* ===== MODAL (Bottom Sheet) ===== */

    showModal(title, contentHtml) {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');

        if (!overlay || !modal) return;

        modalTitle.textContent = title;
        modalContent.innerHTML = contentHtml;
        overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');

        // Setup custom selects
        this.setupCustomSelects(modalContent);

        // Initialize Flatpickr for date inputs
        if (typeof flatpickr !== 'undefined') {
            flatpickr(modalContent.querySelectorAll('input[type="date"]'), {
                disableMobile: "true", // Forces flatpickr UI on mobile instead of native
                altInput: true,
                altFormat: "F j, Y",
                dateFormat: "Y-m-d",
            });
        }

        // Focus first input after animation
        setTimeout(() => {
            const firstInput = modalContent.querySelector('input:not([type="checkbox"]), select, textarea');
            if (firstInput && !firstInput.classList.contains('flatpickr-input')) firstInput.focus();
        }, 350);
    },

    hideModal() {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById('modal');

        if (!overlay || !modal) return;

        overlay.classList.add('hidden');
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open');
    },

    /* ===== POPUP DIALOG ===== */

    showPopup(contentHtml) {
        const overlay = document.getElementById('popupOverlay');
        const popup = document.getElementById('popupDialog');
        const content = document.getElementById('popupContent');

        if (!overlay || !popup) return;

        content.innerHTML = contentHtml;
        overlay.classList.remove('hidden');
        popup.classList.remove('hidden');
        document.body.classList.add('modal-open');
        
        // Setup close button
        const closeBtn = document.getElementById('popupClose');
        const overlayClick = () => this.hidePopup();
        
        closeBtn.onclick = overlayClick;
        overlay.onclick = overlayClick;
    },

    hidePopup() {
        const overlay = document.getElementById('popupOverlay');
        const popup = document.getElementById('popupDialog');
        if (!overlay || !popup) return;
        
        overlay.classList.add('hidden');
        popup.classList.add('hidden');
        document.body.classList.remove('modal-open');
    },

    /* ===== CUSTOM SELECTS ===== */

    setupCustomSelects(container = document) {
        container.querySelectorAll('select:not(.custom-select-applied)').forEach(select => {
            select.classList.add('custom-select-applied');
            
            const wrapper = document.createElement('div');
            wrapper.className = 'custom-select';
            
            const trigger = document.createElement('div');
            trigger.className = 'custom-select__trigger';
            
            const selectedText = document.createElement('span');
            selectedText.textContent = select.options[select.selectedIndex]?.text || '';
            
            const icon = document.createElement('div');
            icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
            icon.style.color = 'var(--text-secondary)';

            trigger.appendChild(selectedText);
            trigger.appendChild(icon);
            wrapper.appendChild(trigger);
            
            select.parentNode.insertBefore(wrapper, select);
            wrapper.appendChild(select);
            
            let optionsContainer = null;
            
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const isOpen = wrapper.classList.contains('is-open');
                
                // Close any other open custom selects
                document.querySelectorAll('.custom-select').forEach(el => {
                    el.classList.remove('is-open');
                    const opts = el.querySelector('.custom-select__options');
                    if (opts) opts.remove();
                });
                
                if (isOpen) return;

                wrapper.classList.add('is-open');

                optionsContainer = document.createElement('div');
                optionsContainer.className = 'custom-select__options';
                
                Array.from(select.options).forEach((opt, index) => {
                    const optEl = document.createElement('div');
                    optEl.className = 'custom-select__option' + (select.selectedIndex === index ? ' selected' : '');
                    optEl.textContent = opt.text;
                    optEl.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        select.selectedIndex = index;
                        selectedText.textContent = opt.text;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        wrapper.classList.remove('is-open');
                        optionsContainer.remove();
                    });
                    optionsContainer.appendChild(optEl);
                });
                
                wrapper.appendChild(optionsContainer);
            });
            
            // Sync if select is updated externally
            select.addEventListener('change', () => {
                selectedText.textContent = select.options[select.selectedIndex]?.text || '';
            });
        });

        // Global click to close custom selects
        if (!window.__customSelectGlobalClick) {
            document.addEventListener('click', () => {
                document.querySelectorAll('.custom-select').forEach(el => {
                    el.classList.remove('is-open');
                    const opts = el.querySelector('.custom-select__options');
                    if (opts) opts.remove();
                });
            });
            window.__customSelectGlobalClick = true;
        }
    },

    /* ===== DEBOUNCE ===== */

    debounce(fn, delay = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },

    /* ===== SVG ICONS (inline) ===== */
    // Commonly used icons as SVG strings

    icons: {
        edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',

        delete: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',

        plus: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',

        calendar: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',

        clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',

        link: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',

        check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',

        tag: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',

        rupee: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3h12M6 8h12M6 13l8.5 8M14.5 13a4.5 4.5 0 0 0 0-5H6"/></svg>'
    }
};

/* ============================================
   QUICK ACTIONS — Long-Press Radial Menu
   Works globally on all .item-card elements
   ============================================ */

const QuickActions = {
    HOLD_DURATION: 500, // ms
    _timer: null,
    _activeCard: null,
    _startX: 0,
    _startY: 0,

    /** Call once on app init to enable long-press on all cards */
    init() {
        const main = document.getElementById('mainContent') || document.body;

        // Pointer down — start the hold timer
        main.addEventListener('pointerdown', (e) => {
            const card = e.target.closest('.item-card[data-collection][data-item-id]');
            if (!card) return;

            // Don't trigger on existing action buttons
            if (e.target.closest('.item-card__action, .quick-actions-overlay, a')) return;

            this._startX = e.clientX;
            this._startY = e.clientY;
            this._activeCard = card;

            this._timer = setTimeout(() => {
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(30);
                card.classList.add('long-pressing');
                this.show(card);
            }, this.HOLD_DURATION);
        });

        // Pointer move — cancel if finger drifts > 10px
        main.addEventListener('pointermove', (e) => {
            if (!this._timer) return;
            const dx = Math.abs(e.clientX - this._startX);
            const dy = Math.abs(e.clientY - this._startY);
            if (dx > 10 || dy > 10) {
                this._cancel();
            }
        });

        // Pointer up — cancel if not yet triggered
        main.addEventListener('pointerup', () => this._cancel());
        main.addEventListener('pointercancel', () => this._cancel());

        // Tap anywhere outside to dismiss active menu
        document.addEventListener('pointerdown', (e) => {
            if (this._activeCard && !e.target.closest('.quick-actions-overlay')) {
                this.hide();
            }
        }, true);
    },

    _cancel() {
        clearTimeout(this._timer);
        this._timer = null;
    },

    /** Render the radial overlay on a card */
    show(card) {
        // Remove any existing overlay first
        this.hide();
        this._activeCard = card;

        const collection = card.dataset.collection;
        const itemId = card.dataset.itemId;

        // Determine "done" label based on collection
        let doneLabel = 'Done';
        let doneIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
        if (collection === 'bills') doneLabel = 'Paid';
        else if (collection === 'wishlist') doneLabel = 'Bought';
        else if (collection === 'student') doneLabel = 'Done';

        const overlay = document.createElement('div');
        overlay.className = 'quick-actions-overlay';
        overlay.innerHTML = `
            <button class="quick-action-btn quick-action-btn--done" data-qa="done">
                <span class="quick-action-btn__icon">${doneIcon}</span>
                <span class="quick-action-btn__label">${doneLabel}</span>
            </button>
            <button class="quick-action-btn quick-action-btn--duplicate" data-qa="duplicate">
                <span class="quick-action-btn__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                </span>
                <span class="quick-action-btn__label">Duplicate</span>
            </button>
            <button class="quick-action-btn quick-action-btn--delete" data-qa="delete">
                <span class="quick-action-btn__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </span>
                <span class="quick-action-btn__label">Delete</span>
            </button>
        `;

        // Attach action handlers
        overlay.querySelector('[data-qa="done"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDone(collection, itemId);
        });
        overlay.querySelector('[data-qa="duplicate"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDuplicate(collection, itemId);
        });
        overlay.querySelector('[data-qa="delete"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDelete(collection, itemId);
        });

        card.appendChild(overlay);
    },

    /** Dismiss the overlay */
    hide() {
        const existing = document.querySelector('.quick-actions-overlay');
        if (existing) existing.remove();
        if (this._activeCard) {
            this._activeCard.classList.remove('long-pressing');
            this._activeCard = null;
        }
    },

    /** Re-render the current page after an action */
    _rerender() {
        this.hide();
        // Trigger a hash change to re-render the current route
        const current = window.location.hash;
        window.location.hash = '';
        requestAnimationFrame(() => { window.location.hash = current; });
    },

    /* ===== ACTION HANDLERS ===== */

    async handleDone(collection, id) {
        try {
            const item = await store.get(collection, id);
            if (!item) return;

            if (collection === 'bills') {
                const wasPaid = item.paid === true || item.paid === 'true';
                await store.update(collection, id, { paid: !wasPaid });
                Utils.showToast(wasPaid ? 'Marked as unpaid' : 'Marked as paid! ✅', 'success');
            } else if (collection === 'wishlist') {
                const wasPurchased = item.purchased === true || item.purchased === 'true' || item.purchased === 'on';
                await store.update(collection, id, { purchased: !wasPurchased });
                Utils.showToast(wasPurchased ? 'Marked as not purchased' : 'Marked as purchased! ✅', 'success');
            } else if (collection === 'student') {
                const wasCompleted = item.completed === true || item.completed === 'true';
                await store.update(collection, id, { completed: !wasCompleted });
                Utils.showToast(wasCompleted ? 'Marked as pending' : 'Marked as completed! ✅', 'success');
            } else {
                // For birthdays, jobs, medicines — just show a "noted" confirmation
                Utils.showToast('Noted! ✅', 'success');
            }
            this._rerender();
        } catch (err) {
            console.error('QuickAction done error:', err);
            Utils.showToast('Something went wrong', 'error');
        }
    },

    async handleDuplicate(collection, id) {
        try {
            const item = await store.get(collection, id);
            if (!item) return;

            // Create a clone without the original id
            const clone = { ...item };
            delete clone.id;
            delete clone.createdAt;
            delete clone.updatedAt;

            // Prefix the name/title to indicate it's a copy
            if (clone.name) clone.name = clone.name + ' (copy)';
            if (clone.title) clone.title = clone.title + ' (copy)';
            if (clone.company) clone.company = clone.company + ' (copy)';

            await store.add(collection, clone);
            Utils.showToast('Duplicated! 📋', 'success');
            if (navigator.vibrate) navigator.vibrate(20);
            this._rerender();
        } catch (err) {
            console.error('QuickAction duplicate error:', err);
            Utils.showToast('Something went wrong', 'error');
        }
    },

    async handleDelete(collection, id) {
        try {
            await store.delete(collection, id);
            Utils.showToast('Deleted 🗑️', 'success');
            if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
            this._rerender();
        } catch (err) {
            console.error('QuickAction delete error:', err);
            Utils.showToast('Something went wrong', 'error');
        }
    }
};
