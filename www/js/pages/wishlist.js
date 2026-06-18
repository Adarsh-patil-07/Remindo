const WishlistPage = {
    async render(container) {
        const items = await store.getAll('wishlist');
        container.innerHTML = `
            <div class="section-page animate-fade-in" style="padding-bottom:80px">
                <div class="section-header">
                    <span class="section-header__count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="items-list" id="wishlistList">
                    ${items.length > 0
                        ? items.map((item, i) => this.renderItem(item, i)).join('')
                        : this.renderEmpty()
                    }
                </div>
                <button class="fab" id="addWishlistBtn" aria-label="Add new item">
                    ${Utils.icons.plus}
                </button>
            </div>
        `;
        this.attachEvents(container);
    },

    renderItem(item, index) {
        const name = Utils.escapeHtml(item.productName || '');
        const isPurchased = item.purchased === true || item.purchased === 'true' || item.purchased === 'on';
        const priority = item.priority || 'medium';
        const hasPrice = item.price !== undefined && item.price !== null && item.price !== '';
        const hasLink = !!item.storeLink;
        const escapedLink = hasLink ? Utils.escapeHtml(item.storeLink) : '';

        const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);
        const purchasedBadge = isPurchased
            ? '<span class="badge--success">Purchased</span>'
            : '<span class="badge--warning">Not purchased</span>';

        return `
            <div class="item-card item-card--wishlist animate-fade-in-up" data-collection="wishlist" data-item-id="${item.id}" style="animation-delay:${index * 50}ms">
                <div class="item-card__top">
                    <div>
                        <div class="item-card__title ${isPurchased ? 'purchased' : ''}">${name}</div>
                        ${hasPrice ? `<span class="price">${Utils.formatCurrency(Number(item.price))}</span>` : ''}
                    </div>
                    <div class="item-card__actions">
                        <button class="item-card__action" data-toggle-purchased="${item.id}" aria-label="${isPurchased ? 'Mark as not purchased' : 'Mark as purchased'}" title="${isPurchased ? 'Mark as not purchased' : 'Mark as purchased'}">
                            ${Utils.icons.check}
                        </button>
                        <button class="item-card__action item-card__action--edit" data-edit="${item.id}" aria-label="Edit">
                            ${Utils.icons.edit}
                        </button>
                        <button class="item-card__action item-card__action--delete" data-delete="${item.id}" aria-label="Delete">
                            ${Utils.icons.delete}
                        </button>
                    </div>
                </div>
                <div class="item-card__meta">
                    <span class="tag--${priority}">${Utils.icons.tag} ${priorityLabel}</span>
                    ${purchasedBadge}
                    ${hasLink ? `
                        <a href="${escapedLink}" target="_blank" rel="noopener noreferrer" class="store-link item-card__meta-item">
                            ${Utils.icons.link} View in store
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state__icon">🛒</div>
                <h3 class="empty-state__title">Wishlist is empty</h3>
                <p class="empty-state__text">Add products you want to buy and track their prices</p>
            </div>
        `;
    },

    getFormHTML(item = null) {
        const productName = item ? Utils.escapeHtml(item.productName || '') : '';
        const price = item ? (item.price || '') : '';
        const storeLink = item ? Utils.escapeHtml(item.storeLink || '') : '';
        const priority = item ? (item.priority || 'medium') : 'medium';
        const isPurchased = item ? (item.purchased === true || item.purchased === 'true' || item.purchased === 'on') : false;
        const notes = item ? Utils.escapeHtml(item.notes || '') : '';

        return `
            <form id="wishlistForm">
                <div class="form-group">
                    <label class="form-label" for="wlProductName">Product Name *</label>
                    <input type="text" id="wlProductName" name="productName" value="${productName}" required placeholder="e.g. Sony WH-1000XM5">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="wlPrice">Price (₹)</label>
                        <input type="number" id="wlPrice" name="price" value="${price}" min="0" step="0.01" placeholder="e.g. 1500">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="wlPriority">Priority</label>
                        <select id="wlPriority" name="priority">
                            <option value="high" ${priority === 'high' ? 'selected' : ''}>High</option>
                            <option value="medium" ${priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="low" ${priority === 'low' ? 'selected' : ''}>Low</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="wlStoreLink">Store Link</label>
                    <input type="url" id="wlStoreLink" name="storeLink" value="${storeLink}" placeholder="https://www.example.com/product">
                </div>
                <div class="form-group">
                    <label class="form-label" for="wlPurchased">
                        <input type="checkbox" id="wlPurchased" name="purchased" ${isPurchased ? 'checked' : ''}> Purchased
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label" for="wlNotes">Notes</label>
                    <textarea id="wlNotes" name="notes" rows="2" placeholder="Any additional notes">${notes}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn--ghost" onclick="Utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn--primary">${item ? 'Update' : 'Add'} Item</button>
                </div>
            </form>
        `;
    },

    attachEvents(container) {
        container.querySelector('#addWishlistBtn')?.addEventListener('click', () => {
            Utils.showModal('Add to Wishlist', this.getFormHTML());
            this.attachFormEvents();
        });

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.edit;
                const item = await store.get('wishlist', id);
                if (item) {
                    Utils.showModal('Edit Wishlist Item', this.getFormHTML(item));
                    this.attachFormEvents(id);
                }
            });
        });

        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delete;
                const ok = await Utils.confirm('Delete Item?', 'This cannot be undone.');
                if (ok) {
                    await store.delete('wishlist', id);
                    Utils.showToast('Item deleted', 'success');
                    this.render(container);
                }
            });
        });

        container.querySelectorAll('[data-toggle-purchased]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.togglePurchased;
                const item = await store.get('wishlist', id);
                if (item) {
                    const wasPurchased = item.purchased === true || item.purchased === 'true' || item.purchased === 'on';
                    await store.update('wishlist', id, { purchased: !wasPurchased });
                    Utils.showToast(wasPurchased ? 'Marked as not purchased' : 'Marked as purchased!', 'success');
                    this.render(container);
                }
            });
        });
    },

    attachFormEvents(editId = null) {
        const form = document.getElementById('wishlistForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = Object.fromEntries(fd);

            // Handle checkbox — FormData omits unchecked checkboxes
            data.purchased = form.querySelector('#wlPurchased').checked;

            // Convert price to number if present
            if (data.price !== '' && data.price !== undefined) {
                data.price = Number(data.price);
            }

            if (editId) {
                await store.update('wishlist', editId, data);
                Utils.showToast('Item updated!', 'success');
            } else {
                await store.add('wishlist', data);
                Utils.showToast('Item added!', 'success');
            }

            Utils.hideModal();
            this.render(document.getElementById('mainContent'));
        });
    }
};
