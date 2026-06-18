/* ============================================
   REMINDO — Sizes Page
   Personal size reference — single form,
   no list/add/delete, just view & save
   ============================================ */

const SizesPage = {

    /* --- Size field definitions --- */
    fields: [
        { key: 'shirtSize',       label: 'Shirt Size',        type: 'text',   placeholder: 'e.g. S, M, L' },
        { key: 'tshirtSize',      label: 'T-Shirt Size',      type: 'text',   placeholder: 'e.g. S, M, L' },
        { key: 'formalShirtSize', label: 'Formal Shirt Size', type: 'text',   placeholder: 'e.g. 40, 42' },
        { key: 'jeansWaist',      label: 'Jeans Waist',       type: 'text',   placeholder: 'e.g. 32, 34' },
        { key: 'trouserSize',     label: 'Trouser Size',      type: 'text',   placeholder: 'e.g. 32, 34' },
        { key: 'shoeSize',        label: 'Shoe Size',         type: 'text',   placeholder: 'e.g. 9, 10' },
        { key: 'blazerSize',      label: 'Blazer Size',       type: 'text',   placeholder: 'e.g. 40, 42' },
        { key: 'beltSize',        label: 'Belt Size',         type: 'text',   placeholder: 'e.g. 34, 36' }
    ],

    /* --- Render --- */
    async render(container) {
        const sizes = await store.getSizes() || {};

        container.innerHTML = `
            <div class="sizes-page animate-fade-in">
                <div style="text-align:center; margin-bottom:var(--space-xl);">
                    <div style="font-size:2.5rem; margin-bottom:var(--space-sm);">👕</div>
                    <p style="font-size:var(--fs-sm); color:var(--text-secondary);">
                        Your personal size reference
                    </p>
                </div>

                <form id="sizesForm">
                    <div class="sizes-grid">
                        ${this.fields.map((f, i) => this.renderField(f, sizes, i)).join('')}
                    </div>

                    <div style="margin-top:var(--space-xl);">
                        <button type="submit" class="btn btn--primary btn--block">
                            Save Sizes
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.attachEvents(container);

        // Transform native selects into styled custom dropdowns
        Utils.setupCustomSelects(container);
    },

    /* --- Render a single field row --- */
    renderField(field, sizes, index) {
        const value = sizes[field.key] || '';

        if (field.type === 'select') {
            const optionsHtml = field.options
                .map(opt => {
                    const selected = opt === value ? 'selected' : '';
                    const label = opt === '' ? '—' : Utils.escapeHtml(opt);
                    return `<option value="${Utils.escapeHtml(opt)}" ${selected}>${label}</option>`;
                })
                .join('');

            return `
                <div class="size-item animate-fade-in-up" style="animation-delay:${index * 40}ms">
                    <span class="size-item__label">${Utils.escapeHtml(field.label)}</span>
                    <select name="${field.key}" class="size-item__input">
                        ${optionsHtml}
                    </select>
                </div>
            `;
        }

        return `
            <div class="size-item animate-fade-in-up" style="animation-delay:${index * 40}ms">
                <span class="size-item__label">${Utils.escapeHtml(field.label)}</span>
                <input
                    type="text"
                    name="${field.key}"
                    class="size-item__input"
                    value="${Utils.escapeHtml(value)}"
                    placeholder="${Utils.escapeHtml(field.placeholder || '')}"
                />
            </div>
        `;
    },

    /* --- Events --- */
    attachEvents(container) {
        const form = container.querySelector('#sizesForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = Object.fromEntries(fd);
            await store.saveSizes(data);
            Utils.showToast('Sizes saved!', 'success');
        });
    }
};
