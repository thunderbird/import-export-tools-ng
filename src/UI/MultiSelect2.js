/*
 * Created by David Adams
 * https://codeshack.io/multi-select-dropdown-html-javascript/
 * 
 * Released under the MIT license
 */
class MultiSelect {
    constructor(element, options = {}) {
        let defaults = {
            placeholder: 'Select item(s)',
            max: null,
            min: null,
            disabled: false,
            search: true,
            selectAll: true,
            listAll: true,
            closeListOnItemSelect: false,
            name: '',
            width: '',
            height: '',
            dropdownWidth: '',
            dropdownHeight: '',
            theme: 'auto',
            required: false,
            data: [],
            onChange: function () { },
            onSelect: function () { },
            onUnselect: function () { },
            onMaxReached: function () { }
        };
        this.options = Object.assign(defaults, options);
        this.selectElement = typeof element === 'string' ? document.querySelector(element) : element;
        if (this.selectElement._multiSelect) {
            this.selectElement._multiSelect.destroy();
        }
        this.selectElement._multiSelect = this;
        this.originalStyle = this.selectElement.getAttribute('style') || '';
        this.originalTabIndex = this.selectElement.getAttribute('tabindex');
        this._isBatching = false;
        for (const prop in this.selectElement.dataset) {
            if (this.options[prop] !== undefined) {
                if (typeof this.options[prop] === 'boolean' || this.selectElement.dataset[prop] === 'true' || this.selectElement.dataset[prop] === 'false') {
                    this.options[prop] = this.selectElement.dataset[prop] === 'true';
                } else {
                    this.options[prop] = this.selectElement.dataset[prop];
                }
            }
        }
        if (this.selectElement.hasAttribute('required')) this.options.required = true;
        if (this.selectElement.hasAttribute('disabled')) this.options.disabled = true;
        this.name = this.selectElement.getAttribute('name') ? this.selectElement.getAttribute('name') : 'multi-select-' + Math.floor(Math.random() * 1000000);
        if (!this.options.data.length) {
            let options = this.selectElement.querySelectorAll('option');
            for (let i = 0; i < options.length; i++) {
                let parent = options[i].parentElement;
                let group = parent.tagName.toLowerCase() === 'optgroup' ? parent.getAttribute('label') : '';
                this.options.data.push({
                    value: options[i].value,
                    text: options[i].textContent,
                    selected: options[i].selected,
                    disabled: options[i].disabled,
                    html: options[i].getAttribute('data-html'),
                    group: group
                });
            }
        }
        this.originalData = JSON.parse(JSON.stringify(this.options.data));
        this.element = this._template();
        this.selectElement.insertAdjacentElement('beforebegin', this.element);
        this.element.appendChild(this.selectElement);
        this.selectElement.multiple = true;
        this.selectElement.setAttribute('tabindex', '-1');
        this.selectElement.style.position = 'absolute';
        this.selectElement.style.left = '0';
        this.selectElement.style.top = '0';
        this.selectElement.style.width = '100%';
        this.selectElement.style.height = '100%';
        this.selectElement.style.opacity = '0';
        this.selectElement.style.zIndex = '-1';
        this.selectElement.style.pointerEvents = 'none';
        this.outsideClickHandler = this._outsideClick.bind(this);
        this._buildOriginalSelect();
        this._updateSelected();
        this._eventHandlers();
        if (this.options.disabled) this.disable();
        if (this.selectElement.form) {
            this.formResetHandler = () => setTimeout(() => this.reset(), 0);
            this.selectElement.form.addEventListener('reset', this.formResetHandler);
        }
    }

    _escapeHTML(str) {
        return str !== undefined && str !== null ? str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)) : '';
    }

    _template() {
        let optionsHTML = '';
        let groupedData = {};
        this.data.forEach(item => {
            let g = item.group || '';
            if (!groupedData[g]) groupedData[g] = [];
            groupedData[g].push(item);
        });
        for (const [groupName, items] of Object.entries(groupedData)) {
            if (groupName) {
                let enabledItems = items.filter(i => !i.disabled);
                let allGroupSelected = enabledItems.length > 0 && enabledItems.every(i => i.selected);
                optionsHTML += `
                    <div class="multi-select-group${allGroupSelected ? ' multi-select-selected' : ''}" data-group="${this._escapeHTML(groupName)}" role="option" tabindex="-1">
                        <span class="multi-select-option-radio"></span>
                        <span class="multi-select-option-text">${this._escapeHTML(groupName)}</span>
                    </div>
                `;
            }
            items.forEach(item => {
                const isSelected = item.selected;
                const isDisabled = item.disabled;
                optionsHTML += `
                    <div class="multi-select-option${isSelected ? ' multi-select-selected' : ''}" data-value="${this._escapeHTML(item.value)}" data-group="${this._escapeHTML(groupName)}" role="option" aria-selected="${isSelected}" tabindex="-1" ${isDisabled ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                        <span class="multi-select-option-radio"></span>
                        <span class="multi-select-option-text">${item.html ? item.html : this._escapeHTML(item.text)}</span>
                    </div>
                `;
            });
        }
        let selectAllHTML = '';
        if (this.options.selectAll) {
            let enabledData = this.data.filter(d => !d.disabled);
            let allSelected = enabledData.length > 0 && enabledData.every(d => d.selected);
            selectAllHTML = `<div class="multi-select-all${allSelected ? ' multi-select-selected' : ''}" role="option" tabindex="-1">
                <span class="multi-select-option-radio"></span>
                <span class="multi-select-option-text">Select all</span>
            </div>`;
        }
        let template = `
            <div class="multi-select ${this.name}"${this.selectElement.id ? ' id="ms-' + this._escapeHTML(this.selectElement.id) + '"' : ''} style="${this.width ? 'width:' + this.width + ';' : ''}${this.height ? 'height:' + this.height + ';' : ''}" role="combobox" aria-haspopup="listbox" aria-expanded="false" data-theme="${this.options.theme}">
                <div class="multi-select-header" style="${this.width ? 'width:' + this.width + ';' : ''}${this.height ? 'height:' + this.height + ';' : ''}" tabindex="0">
                    <span class="multi-select-header-max">${this.options.max ? this.selectedValues.length + '/' + this.options.max : ''}</span>
                    <span class="multi-select-header-placeholder">${this._escapeHTML(this.placeholder)}</span>
                </div>
                <div class="multi-select-options" style="${this.options.dropdownWidth ? 'width:' + this.options.dropdownWidth + ';' : ''}${this.options.dropdownHeight ? 'height:' + this.options.dropdownHeight + ';' : ''}" role="listbox">
                    ${this.options.search ? '<input type="text" class="multi-select-search" placeholder="Search..." role="searchbox">' : ''}
                    ${selectAllHTML}
                    ${optionsHTML}
                </div>
            </div>
        `;
        let element = document.createElement('div');
        element.innerHTML = template;
        return element.firstElementChild;
    }

    _eventHandlers() {
        let headerElement = this.element.querySelector('.multi-select-header');
        const toggleDropdown = (forceClose = false) => {
            if (this.element.classList.contains('disabled')) return;
            if (forceClose || headerElement.classList.contains('multi-select-header-active')) {
                headerElement.classList.remove('multi-select-header-active');
                this.element.setAttribute('aria-expanded', 'false');
            } else {
                headerElement.classList.add('multi-select-header-active');
                this.element.setAttribute('aria-expanded', 'true');
            }
        };
        this.element.querySelectorAll('.multi-select-option').forEach(option => {
            option.onclick = (e) => {
                e.stopPropagation();
                if (this.element.classList.contains('disabled')) return;
                let dataItem = this.data.find(d => String(d.value) === String(option.dataset.value));
                if (!dataItem || dataItem.disabled) return;
                let selected = true;
                let clearSelected = false;
                if (!option.classList.contains('multi-select-selected')) {
                    // cleidigh 
                    // make multi select with data-max == 1 act as normal select
                    if (this.options.max && this.options.max == 1 && this.selectedValues.length >= this.options.max) {
                        this.element.querySelectorAll('.multi-select-option').forEach(option => {
                            option.classList.remove('multi-select-selected');
                            option.setAttribute('aria-selected', 'false');
                            let dataItem = this.data.find(d => String(d.value) === String(option.dataset.value));
                            dataItem.selected = false;
                        });

                    } else if (this.options.max && this.selectedValues.length >= this.options.max) {

                        if (!this._isBatching) this.options.onMaxReached(this.options.max);
                        return;
                    }
                    option.classList.add('multi-select-selected');
                    option.setAttribute('aria-selected', 'true');
                    dataItem.selected = true;
                } else {
                    option.classList.remove('multi-select-selected');
                    option.setAttribute('aria-selected', 'false');
                    dataItem.selected = false;
                    selected = false;
                }
                if (!this._isBatching) {
                    this._updateSelected();
                    this._syncOriginalSelect();
                    if (this.options.closeListOnItemSelect) {
                        if (this.options.search) {
                            this.element.querySelector('.multi-select-search').value = '';
                            this.element.querySelectorAll('.multi-select-option, .multi-select-group').forEach(opt => opt.style.display = 'flex');
                        }
                        toggleDropdown(true);
                    }
                }
                this.options.onChange(option.dataset.value, option.querySelector('.multi-select-option-text').innerHTML, option);
                if (selected) {
                    this.options.onSelect(option.dataset.value, option.querySelector('.multi-select-option-text').innerHTML, option);
                } else {
                    this.options.onUnselect(option.dataset.value, option.querySelector('.multi-select-option-text').innerHTML, option);
                }
            };
        });

        this.element.querySelectorAll('.multi-select-group').forEach(groupEl => {
            groupEl.onclick = (e) => {
                e.stopPropagation();
                if (this.element.classList.contains('disabled')) return;
                let groupName = groupEl.dataset.group;
                let isSelected = groupEl.classList.contains('multi-select-selected');
                let hitMax = false;
                this._isBatching = true;
                this.element.querySelectorAll('.multi-select-option').forEach(option => {
                    if (option.dataset.group === groupName && option.style.display !== 'none') {
                        let dataItem = this.data.find(d => String(d.value) === String(option.dataset.value));
                        if (dataItem && !dataItem.disabled && ((!isSelected && !dataItem.selected) || (isSelected && dataItem.selected))) {
                            if (this.options.max && this.selectedValues.length >= this.options.max && !isSelected) {
                                hitMax = true;
                                return;
                            }
                            option.click();
                        }
                    }
                });
                this._isBatching = false;
                this._updateSelected();
                this._syncOriginalSelect();
                if (this.options.closeListOnItemSelect) {
                    if (this.options.search) {
                        this.element.querySelector('.multi-select-search').value = '';
                        this.element.querySelectorAll('.multi-select-option, .multi-select-group').forEach(opt => opt.style.display = 'flex');
                    }
                    toggleDropdown(true);
                }
                if (hitMax) this.options.onMaxReached(this.options.max);
            };
        });
        headerElement.onclick = () => toggleDropdown();
        if (this.options.search) {
            let search = this.element.querySelector('.multi-select-search');
            search.oninput = () => {
                let searchValue = search.value.toLowerCase();
                let visibleGroups = new Set();
                this.element.querySelectorAll('.multi-select-option').forEach(option => {
                    const text = option.querySelector('.multi-select-option-text').textContent.toLowerCase();
                    if (text.includes(searchValue)) {
                        option.style.display = 'flex';
                        if (option.dataset.group) visibleGroups.add(option.dataset.group);
                    } else {
                        option.style.display = 'none';
                    }
                });
                this.element.querySelectorAll('.multi-select-group').forEach(group => {
                    if (visibleGroups.has(group.dataset.group) || group.querySelector('.multi-select-option-text').textContent.toLowerCase().includes(searchValue)) {
                        group.style.display = 'flex';
                        if (group.querySelector('.multi-select-option-text').textContent.toLowerCase().includes(searchValue)) {
                            this.element.querySelectorAll('.multi-select-option').forEach(opt => {
                                if (opt.dataset.group === group.dataset.group) opt.style.display = 'flex';
                            });
                        }
                    } else {
                        group.style.display = 'none';
                    }
                });
            };
        }
        if (this.options.selectAll) {
            let selectAllButton = this.element.querySelector('.multi-select-all');
            selectAllButton.onclick = (e) => {
                e.stopPropagation();
                if (this.element.classList.contains('disabled')) return;
                let isSelected = selectAllButton.classList.contains('multi-select-selected');
                let hitMax = false;
                this._isBatching = true;
                this.element.querySelectorAll('.multi-select-option').forEach(option => {
                    if (option.style.display !== 'none') {
                        let dataItem = this.data.find(d => String(d.value) === String(option.dataset.value));
                        if (dataItem && !dataItem.disabled && ((!isSelected && !dataItem.selected) || (isSelected && dataItem.selected))) {
                            if (this.options.max && this.selectedValues.length >= this.options.max && !isSelected) {
                                hitMax = true;
                                return;
                            }
                            option.click();
                        }
                    }
                });
                this._isBatching = false;
                this._updateSelected();
                this._syncOriginalSelect();
                if (this.options.closeListOnItemSelect) {
                    if (this.options.search) {
                        this.element.querySelector('.multi-select-search').value = '';
                        this.element.querySelectorAll('.multi-select-option, .multi-select-group').forEach(opt => opt.style.display = 'flex');
                    }
                    toggleDropdown(true);
                }
                if (hitMax) this.options.onMaxReached(this.options.max);
            };
        }
        if (this.selectElement.id) {
            if (this.labelClickHandler) {
                document.querySelectorAll(`label[for="${CSS.escape(this.selectElement.id)}"]`).forEach(label => {
                    label.removeEventListener('click', this.labelClickHandler);
                });
            }
            this.labelClickHandler = (e) => {
                e.preventDefault();
                toggleDropdown();
                headerElement.focus();
            };
            document.querySelectorAll(`label[for="${CSS.escape(this.selectElement.id)}"]`).forEach(label => {
                label.addEventListener('click', this.labelClickHandler);
            });
        }
        this.element.addEventListener('focusout', (e) => {
            if (!this.element.contains(e.relatedTarget)) {
                if (headerElement.classList.contains('multi-select-header-active')) {
                    headerElement.classList.remove('multi-select-header-active');
                    this.element.setAttribute('aria-expanded', 'false');
                }
            }
        });
        document.addEventListener('click', this.outsideClickHandler);
        headerElement.addEventListener('keydown', (e) => {
            if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
                e.preventDefault();
                toggleDropdown();
                const firstElement = this.element.querySelector('[role="searchbox"]') || this.element.querySelector('[role="option"]');
                if (firstElement) firstElement.focus();
            }
        });
        this.element.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                toggleDropdown(true);
                headerElement.focus();
            }
        });
        const optionsContainer = this.element.querySelector('.multi-select-options');
        optionsContainer.addEventListener('keydown', (e) => {
            const currentFocused = document.activeElement;
            if (currentFocused.closest('.multi-select-options')) {
                if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
                    e.preventDefault();
                    const direction = e.key === 'ArrowDown' ? 'nextElementSibling' : 'previousElementSibling';
                    let nextElement = currentFocused[direction];

                    while (nextElement && (nextElement.style.display === 'none' || nextElement.style.pointerEvents === 'none' || !nextElement.matches('[role="option"],[role="searchbox"]'))) {
                        nextElement = nextElement[direction];
                    }
                    if (nextElement) nextElement.focus();
                } else if (e.key === 'Enter') {
                    if (currentFocused.matches('[role="searchbox"]')) {
                        e.preventDefault();
                    } else if (currentFocused.matches('[role="option"]')) {
                        e.preventDefault();
                        currentFocused.click();
                    }
                } else if (e.key === ' ' && currentFocused.matches('[role="option"]')) {
                    e.preventDefault();
                    currentFocused.click();
                }
            }
        });
    }

    _updateHeader() {
        this.element.querySelectorAll('.multi-select-header-option, .multi-select-header-placeholder').forEach(el => el.remove());
        if (this.selectedValues.length > 0) {
            if (this.options.listAll) {
                this.selectedItems.forEach(item => {
                    const el = document.createElement('span');
                    el.className = 'multi-select-header-option';
                    el.dataset.value = item.value;
                    el.innerHTML = item.html ? item.html : this._escapeHTML(item.text);
                    this.element.querySelector('.multi-select-header').prepend(el);
                });
            } else {
                this.element.querySelector('.multi-select-header').insertAdjacentHTML('afterbegin', `<span class="multi-select-header-option">${this.selectedValues.length} selected</span>`);
            }
        } else {
            this.element.querySelector('.multi-select-header').insertAdjacentHTML('beforeend', `<span class="multi-select-header-placeholder">${this._escapeHTML(this.placeholder)}</span>`);
        }
        if (this.options.max) {
            this.element.querySelector('.multi-select-header-max').innerHTML = this.selectedValues.length + '/' + this.options.max;
        }
    }

    _updateSelectAll() {
        if (!this.options.selectAll) return;
        const selectAllBtn = this.element.querySelector('.multi-select-all');
        if (selectAllBtn) {
            const enabledData = this.data.filter(d => !d.disabled);
            const allSelected = enabledData.length > 0 && enabledData.every(d => d.selected);
            if (allSelected) selectAllBtn.classList.add('multi-select-selected');
            else selectAllBtn.classList.remove('multi-select-selected');
        }
    }

    _updateGroups() {
        this.element.querySelectorAll('.multi-select-group').forEach(groupEl => {
            const groupName = groupEl.dataset.group;
            const enabledItems = this.data.filter(d => d.group === groupName && !d.disabled);
            if (enabledItems.length > 0 && enabledItems.every(d => d.selected)) {
                groupEl.classList.add('multi-select-selected');
            } else {
                groupEl.classList.remove('multi-select-selected');
            }
        });
    }

    _updateSelected() {
        this._updateHeader();
        this._updateSelectAll();
        this._updateGroups();
        this._validate();
    }

    _validate() {
        let isValid = true;
        if (this.options.required) isValid = this.selectedValues.length > 0;
        if (this.options.min && this.selectedValues.length < this.options.min) isValid = false;
        if (!isValid) {
            this.element.classList.add('multi-select-invalid');
            if (this.selectElement && this.options.required) this.selectElement.setCustomValidity('Please fill out this field.');
        } else {
            this.element.classList.remove('multi-select-invalid');
            if (this.selectElement) this.selectElement.setCustomValidity('');
        }
    }

    _buildOriginalSelect() {
        if (!this.selectElement) return;
        this.selectElement.innerHTML = '';
        let groupedData = {};
        this.data.forEach(item => {
            let g = item.group || '';
            if (!groupedData[g]) groupedData[g] = [];
            groupedData[g].push(item);
        });
        for (const [groupName, items] of Object.entries(groupedData)) {
            let parent = this.selectElement;
            if (groupName) {
                let optgroup = document.createElement('optgroup');
                optgroup.label = groupName;
                this.selectElement.appendChild(optgroup);
                parent = optgroup;
            }
            items.forEach(item => {
                let opt = document.createElement('option');
                opt.value = item.value;
                opt.textContent = item.text !== undefined && item.text !== null ? item.text : (item.html ? item.html.replace(/<[^>]*>?/gm, '') : '');
                opt.selected = item.selected;
                opt.disabled = item.disabled || false;
                if (item.html) opt.setAttribute('data-html', item.html);
                parent.appendChild(opt);
            });
        }
    }

    _syncOriginalSelect() {
        if (!this.selectElement) return;
        let changed = false;
        for (let option of this.selectElement.options) {
            let dataItem = this.data.find(d => String(d.value) === String(option.value));
            if (dataItem && option.selected !== dataItem.selected) {
                option.selected = dataItem.selected;
                changed = true;
            }
        }
        if (changed) {
            this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    _outsideClick(event) {
        if (!this.selectElement.isConnected) {
            document.removeEventListener('click', this.outsideClickHandler);
            return;
        }
        const labelSelector = this.selectElement.id ? `label[for="${CSS.escape(this.selectElement.id)}"]` : null;
        const clickedOnLabel = labelSelector ? event.target.closest(labelSelector) : false;
        if (!this.element.contains(event.target) && !clickedOnLabel) {
            let headerElement = this.element.querySelector('.multi-select-header');
            if (headerElement.classList.contains('multi-select-header-active')) {
                headerElement.classList.remove('multi-select-header-active');
                this.element.setAttribute('aria-expanded', 'false');
            }
        }
    }

    select(value) {
        const option = Array.from(this.element.querySelectorAll('.multi-select-option')).find(el => String(el.dataset.value) === String(value));
        if (option && !option.classList.contains('multi-select-selected')) option.click();
    }

    unselect(value) {
        const option = Array.from(this.element.querySelectorAll('.multi-select-option')).find(el => String(el.dataset.value) === String(value));
        if (option && option.classList.contains('multi-select-selected')) option.click();
    }

    setValues(values) {
        const valArray = Array.isArray(values) ? values : [values];
        const stringValues = valArray.map(String);
        let changed = false;
        this.data.forEach(item => {
            const isSelected = stringValues.includes(String(item.value));
            if (item.selected !== isSelected && !item.disabled) {
                item.selected = isSelected;
                changed = true;
            }
        });
        if (changed) {
            this.refresh();
            this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    disable() {
        this.options.disabled = true;
        this.element.classList.add('disabled');
        this.element.querySelector('.multi-select-header').removeAttribute('tabindex');
        const searchInput = this.element.querySelector('.multi-select-search');
        if (searchInput) searchInput.disabled = true;
        if (this.selectElement) this.selectElement.disabled = true;
        let headerElement = this.element.querySelector('.multi-select-header');
        if (headerElement && headerElement.classList.contains('multi-select-header-active')) {
            headerElement.classList.remove('multi-select-header-active');
            this.element.setAttribute('aria-expanded', 'false');
        }
    }

    enable() {
        this.options.disabled = false;
        this.element.classList.remove('disabled');
        this.element.querySelector('.multi-select-header').setAttribute('tabindex', '0');
        const searchInput = this.element.querySelector('.multi-select-search');
        if (searchInput) searchInput.disabled = false;
        if (this.selectElement) this.selectElement.disabled = false;
    }

    destroy() {
        this.element.insertAdjacentElement('beforebegin', this.selectElement);
        this.element.remove();
        if (this.originalStyle) {
            this.selectElement.setAttribute('style', this.originalStyle);
        } else {
            this.selectElement.removeAttribute('style');
        }
        if (this.originalTabIndex !== null) {
            this.selectElement.setAttribute('tabindex', this.originalTabIndex);
        } else {
            this.selectElement.removeAttribute('tabindex');
        }
        if (this.selectElement.form && this.formResetHandler) {
            this.selectElement.form.removeEventListener('reset', this.formResetHandler);
        }
        if (this.selectElement.id && this.labelClickHandler) {
            document.querySelectorAll(`label[for="${CSS.escape(this.selectElement.id)}"]`).forEach(label => {
                label.removeEventListener('click', this.labelClickHandler);
            });
        }
        document.removeEventListener('click', this.outsideClickHandler);
        delete this.selectElement._multiSelect;
    }

    refresh() {
        this.element.insertAdjacentElement('beforebegin', this.selectElement);
        const newElement = this._template();
        this.element.replaceWith(newElement);
        this.element = newElement;
        this.element.appendChild(this.selectElement);
        this._buildOriginalSelect();
        this._updateSelected();
        this._eventHandlers();
    }

    addItem(item) {
        this.options.data.push(item);
        this.originalData.push(JSON.parse(JSON.stringify(item)));
        this.refresh();
    }

    addItems(items) {
        this.options.data.push(...items);
        this.originalData.push(...JSON.parse(JSON.stringify(items)));
        this.refresh();
    }

    async fetch(url, options = {}) {
        try {
            const response = await window.fetch(url, options);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            this.addItems(data);
            if (this.options.onload) {
                this.options.onload(data, this.options);
            }
        } catch (error) {
            console.error('MultiSelect Fetch Error:', error);
        }
    }

    removeItem(value) {
        this.options.data = this.options.data.filter(item => String(item.value) !== String(value));
        this.originalData = this.originalData.filter(item => String(item.value) !== String(value));
        this.refresh();
    }

    clear() {
        this.options.data = [];
        this.refresh();
        this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    }

    deselectAll() {
        let changed = false;
        this.data.forEach(item => {
            if (item.selected && !item.disabled) {
                item.selected = false;
                changed = true;
            }
        });
        if (changed) {
            this.refresh();
            this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    reset() {
        this.data = JSON.parse(JSON.stringify(this.originalData));
        this.refresh();
        this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    }

    selectAll() {
        let changed = false;
        this.data.forEach(item => {
            if (!item.selected && !item.disabled) {
                item.selected = true;
                changed = true;
            }
        });
        if (changed) {
            this.refresh();
            this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    get selectedValues() { return this.data.filter(d => d.selected).map(d => d.value); }
    get selectedItems() { return this.data.filter(d => d.selected); }
    get data() { return this.options.data; }
    set data(value) { this.options.data = value; }

    set selectElement(value) { this.options.selectElement = value; }
    get selectElement() { return this.options.selectElement; }

    set element(value) { this.options.element = value; }
    get element() { return this.options.element; }

    set placeholder(value) { this.options.placeholder = value; }
    get placeholder() { return this.options.placeholder; }

    set name(value) { this.options.name = value; }
    get name() { return this.options.name; }

    set width(value) { this.options.width = value; }
    get width() { return this.options.width; }

    set height(value) { this.options.height = value; }
    get height() { return this.options.height; }
}

document.querySelectorAll('[data-multi-select]').forEach(select => new MultiSelect(select));