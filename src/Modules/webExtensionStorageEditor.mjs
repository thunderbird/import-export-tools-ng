/**
 * A simple storage editor, either opened in a new tab or popup, displaying all
 * entries in the specified storage area. Boolean values can be toggled inline,
 * other values can be edited with save/cancel controls.
 *
 * Entries grouped inside an object are flattened into dotted leaf rows, so a key
 * `debug` holding `{ something: true, other: false }` is shown and edited as the
 * individual entries `debug.something` and `debug.other`, just like flat dotted
 * keys. Editing a leaf patches its parent object in place. Arrays and empty
 * objects are kept as a single JSON-editable entry.
 *
 * This file acts both as the module loaded by the consumer (for example a
 * background page) and as the script loaded by the editor popup (`viewer=1`).
 *
 * See the README and the open() JSDoc below for usage.
 */

/**
 * Open a storage editor showing entries in a browser.storage area.
 *
 * @param {Object} [options] - Options for opening the viewer.
 * @param {"local"|"sync"|"session"} [options.storageArea="local"] - The storage
 *    area to inspect.
 * @param {"tab"|"popup"} [options.type="tab"] - Open as a tab or popup window.
 * @param {string} [options.baseFilter=""] - Base filter limiting the shown
 *    entries.
 * @param {string} [options.footerText] - Footer text for the viewer. When
 *    omitted, a sensible default is used.
 * @returns {Promise<void>} Resolves after the tab or popup has been created.
 */
export async function open(options = {}) {
  const storageArea = options?.storageArea || "local";
  const type = options?.type || "tab";
  const baseFilter = options?.baseFilter || "";
  const footerText = options?.footerText || "Click ✎ to edit values. Press ✓ to save or ESC to cancel. Boolean values can be toggled.";

  /**
   * Escape a string so caller-provided text cannot inject HTML markup.
   *
   * @param {string} s - The text to escape.
   * @returns {string} The escaped text.
   */
  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const safeFooter = escapeHtml(footerText);

  // use the same module file as the page script (?viewer=1)
  const moduleUrlWithParams = `${import.meta.url}?viewer=1&storageArea=${encodeURIComponent(storageArea)}&baseFilter=${encodeURIComponent(baseFilter)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Storage Viewer</title>
<style>
    body {
        font-family: system-ui, sans-serif;
        font-size: 13px;
        margin: 0;
        padding: 0;
        background: #f9f9fb;
        color: #222;
    }
    header,
        footer {
        padding: 6px 10px;
        background: #eee;
    }
    header {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    input.filter {
        flex: 1;
        padding: 2px 4px;
        font-family: monospace;
    }
    button {
        cursor: pointer;
        padding: 2px 6px;
        font-size: 13px;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 6px;
    }
    th,
    td {
        padding: 6px 8px;
        border-bottom: 1px solid #ddd;
        vertical-align: top;
    }
    th {
        background: #f0f0f0;
        position: sticky;
        top: 0;
        text-align: left;
    }
    tr:hover {
        background: #f5f5ff;
    }
    .key {
        font-family: monospace;
    }
    .type {
        font-family: monospace;
        width: 8em;
        text-align: left;
    }
    .controls {
        text-align: right;
        white-space: nowrap;
    }
    .editBtn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
    }
    .row-editing {
        background: #e8f0fe !important;
    }
    .error {
        color: red;
        font-size: 11px;
    }
    textarea,
    input {
        width: 100%;
        font-family: monospace;
        box-sizing: border-box;
    }
</style>
</head>
<body>
<header>
  <input class="filter" placeholder="Filter keys..." value="">
</header>

<table>
  <thead><tr><th>Key</th><th>Type</th><th>Value</th><th></th></tr></thead>
  <tbody id="entries"></tbody>
</table>

<footer>
<p>${safeFooter}</p>
</footer>

<!-- load this same module as the page script; it will detect viewer=1 and run the UI code -->
<script type="module" src="${moduleUrlWithParams}"></script>
</body>
</html>
`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  if (type === "popup") {
    await browser.windows.create({ url, type: "popup", width: 800, height: 500 });
  } else {
    await browser.tabs.create({ url });
  }

  // Revoke the blob URL after a short delay to avoid leaking object URLs.
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

/**
 * A value stored in a storage area. It can be any JSON-compatible type.
 *
 * @typedef {boolean|number|string|Array|Object} JSONValue
 */

/**
 * A single flattened storage entry, identifying one editable leaf.
 *
 * @typedef {object} LeafEntry
 * @property {string} topKey - The real top-level storage key.
 * @property {string[]} subPath - The property path within that key's value.
 * @property {JSONValue} value - The leaf value found at that path.
 */

function init() {
  const params = new URL(import.meta.url).searchParams;
  const storageArea = params.get('storageArea') || 'local';
  const baseFilter = params.get('baseFilter') || '';
  let userFilter = (document.querySelector('.filter') && document.querySelector('.filter').value) ? document.querySelector('.filter').value.trim() : '';

  const storage = browser.storage[storageArea];
  const tbody = document.getElementById("entries");

  // Maps rowId -> <tr>. Using a Map (instead of querying the DOM by row id)
  // keeps lookups safe for dotted/quoted keys that would break CSS selectors.
  const rowsById = new Map();

  /**
   * Whether a value is a non-null, non-array object.
   *
   * @param {JSONValue} v - The value to test.
   * @returns {boolean} True for a plain object that can be flattened.
   */
  function isPlainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }

  /**
   * Classify a value into one of the editor's row types.
   *
   * @param {JSONValue} v - The value to classify.
   * @returns {"object"|"boolean"|"number"|"string"} The row type.
   */
  function getType(v) {
    if (v !== null && typeof v === "object") {
      return "object";
    }
    if (v === true || v === false) {
      return "boolean";
    }
    if (typeof v === "number") {
      return "number";
    }
    return "string";
  }

  /**
   * Format a value for the single-line display cell.
   *
   * @param {JSONValue} v - The value to format.
   * @returns {string} A compact, human-readable representation.
   */
  function formatDisplayValue(v) {
    return getType(v) === "object" ? JSON.stringify(v) : String(v);
  }

  /**
   * Format a value for the editable field (objects as pretty JSON).
   *
   * @param {JSONValue} v - The value to format.
   * @returns {string} The editable representation.
   */
  function formatEditorValue(v) {
    return getType(v) === "object" ? JSON.stringify(v, null, 2) : String(v);
  }

  /**
   * Flatten a raw storage object into individual editable leaves.
   *
   * A grouped object such as `{ debug: { something: true } }` becomes a leaf
   * `debug.something`, so it is displayed and edited exactly like a flat dotted
   * key. Plain objects are recursed into. Arrays and empty objects are kept as a
   * single JSON leaf. Each leaf keeps its real top-level key and property path
   * separately, so the displayed dotted key never has to be split back apart and
   * keys that themselves contain dots stay unambiguous when written back.
   *
   * @param {Object<string, JSONValue>} all - The raw storage.get(null) result.
   * @returns {LeafEntry[]} One entry per editable leaf.
   */
  function collectLeaves(all) {
    const leaves = [];

    /**
     * Recurse into one value, appending its leaves to the outer list.
     *
     * @param {string} topKey - The top-level storage key being walked.
     * @param {string[]} subPath - The property path reached so far.
     * @param {JSONValue} value - The value at that path.
     * @returns {void}
     */
    const walk = (topKey, subPath, value) => {
      if (isPlainObject(value) && Object.keys(value).length > 0) {
        for (const [k, v] of Object.entries(value)) {
          walk(topKey, [...subPath, k], v);
        }
      } else {
        leaves.push({ topKey, subPath, value });
      }
    };
    for (const [topKey, value] of Object.entries(all)) {
      walk(topKey, [], value);
    }
    return leaves;
  }

  /**
   * Build the dotted key shown in the editor for a leaf.
   *
   * @param {string} topKey - The real top-level storage key.
   * @param {string[]} subPath - The property path within that key's value.
   * @returns {string} The displayed dotted key.
   */
  function displayKey(topKey, subPath) {
    return [topKey, ...subPath].join(".");
  }

  /**
   * Build a stable identity for a leaf's row.
   *
   * Encoding the path as JSON avoids collisions between, for example, a flat
   * "a.b" key and a nested a then b. Including the type means a value that
   * changes type recreates the row, and thus its input or textarea editor.
   *
   * @param {string} topKey - The real top-level storage key.
   * @param {string[]} subPath - The property path within that key's value.
   * @param {JSONValue} value - The leaf value.
   * @returns {string} The row identity.
   */
  function getRowId(topKey, subPath, value) {
    return JSON.stringify([topKey, subPath]) + "::" + getType(value);
  }

  /**
   * Write a single leaf back into storage.
   *
   * For a nested leaf the parent object is re-read, cloned and patched, so
   * sibling entries are preserved and concurrent changes to other keys in the
   * same object are not clobbered.
   *
   * @param {string} topKey - The real top-level storage key.
   * @param {string[]} subPath - The property path within that key's value.
   * @param {JSONValue} newValue - The value to store at that path.
   * @returns {Promise<void>} Resolves once the write completes.
   */
  async function writeLeaf(topKey, subPath, newValue) {
    if (subPath.length === 0) {
      await storage.set({ [topKey]: newValue });
      return;
    }
    const data = await storage.get(topKey);
    const root = isPlainObject(data[topKey]) ? structuredClone(data[topKey]) : {};
    let node = root;
    for (let i = 0; i < subPath.length - 1; i++) {
      const k = subPath[i];
      if (!isPlainObject(node[k])) node[k] = {};
      node = node[k];
    }
    node[subPath[subPath.length - 1]] = newValue;
    await storage.set({ [topKey]: root });
  }

  /**
   * Build a table row for one leaf and wire up its edit controls.
   *
   * @param {string} topKey - The real top-level storage key.
   * @param {string[]} subPath - The property path within that key's value.
   * @param {JSONValue} value - The leaf value to display.
   * @returns {HTMLTableRowElement} The row, not yet attached to the table.
   */
  function createRow(topKey, subPath, value) {
    const key = displayKey(topKey, subPath);
    const tr = document.createElement("tr");
    const tdKey = document.createElement("td");
    const tdType = document.createElement("td");
    const tdVal = document.createElement("td");
    const tdCtrl = document.createElement("td");
    const displayValue = formatDisplayValue(value);
    const editorValue = formatEditorValue(value);
    const rowType = getType(value);

    tdKey.className = "key";
    tdType.className = "type";
    tdCtrl.className = "controls";
    tdKey.textContent = key;
    tdType.textContent = rowType;

    const displayArea = document.createElement("div");
    displayArea.className = "displayArea";
    displayArea.textContent = displayValue;

    const editArea = document.createElement("div");
    editArea.className = "editArea";
    editArea.style.display = "none";

    let editorEl;
    if (rowType === "object") {
      editorEl = document.createElement("textarea");
      editorEl.rows = 5;
    } else {
      editorEl = document.createElement("input");
      editorEl.type = "text";
    }
    // Force the editor content to the last saved value.
    editorEl.value = editorValue;
    editArea.appendChild(editorEl);

    const errorBox = document.createElement("div");
    errorBox.className = "error";

    const editBtn = document.createElement("button");
    editBtn.className = "editBtn";

    tdVal.append(displayArea, editArea, errorBox);
    tdCtrl.appendChild(editBtn);
    tr.append(tdKey, tdType, tdVal, tdCtrl);

    // Store the current value in data attributes for change detection.
    tr.dataset.displayValue = displayValue;
    tr.dataset.editorValue = editorValue;

    tr.tabIndex = 0;

    attachEditHandler(tr, topKey, subPath, rowType);
    return tr;
  }

  async function loadEntries() {
    const all = await storage.get(null);
    const seen = new Set();

    for (const { topKey, subPath, value } of collectLeaves(all)) {
      const key = displayKey(topKey, subPath);
      if (!(key.includes(baseFilter) && key.includes(userFilter))) {
        continue;
      }

      const rowId = getRowId(topKey, subPath, value);
      seen.add(rowId);

      const displayValue = formatDisplayValue(value);
      const editorValue = formatEditorValue(value);

      let tr = rowsById.get(rowId);
      if (tr) {
        if (tr.dataset.displayValue !== displayValue) {
          tr.dataset.displayValue = displayValue;
          tr.dataset.editorValue = editorValue;

          const displayArea = tr.querySelector(".displayArea");
          if (displayArea) displayArea.textContent = displayValue;
          // Don't overwrite a value the user is currently editing. The fresh
          // value is kept in the dataset and shown if the edit is cancelled.
          if (!tr.classList.contains("row-editing")) {
            const editorEl = tr.querySelector(".editArea textarea, .editArea input");
            if (editorEl) editorEl.value = editorValue;
          }
        }
      } else {
        tr = createRow(topKey, subPath, value);
        rowsById.set(rowId, tr);
      }
      tbody.appendChild(tr);
    }

    // Remove any rows that are no longer present or visible.
    for (const [rowId, tr] of rowsById) {
      if (!seen.has(rowId)) {
        tr.remove();
        rowsById.delete(rowId);
      }
    }
  }

  /**
   * Wire up the toggle or edit controls for one leaf's row.
   *
   * @param {HTMLTableRowElement} tr - The row to attach handlers to.
   * @param {string} topKey - The real top-level storage key.
   * @param {string[]} subPath - The property path within that key's value.
   * @param {"object"|"boolean"|"number"|"string"} type - The leaf's type.
   * @returns {void}
   */
  function attachEditHandler(tr, topKey, subPath, type) {
    const editBtn = tr.querySelector(".editBtn");
    const displayArea = tr.querySelector(".displayArea");
    const editArea = tr.querySelector(".editArea");
    const errorBox = tr.querySelector(".error");

    /**
     * Persist a new value for this leaf and refresh the row's display.
     *
     * @param {JSONValue} newValue - The value to store.
     * @returns {Promise<void>} Resolves once the write completes.
     */
    async function setValue(newValue) {
      await writeLeaf(topKey, subPath, newValue);
      const displayValue = formatDisplayValue(newValue);
      const editorValue = formatEditorValue(newValue);
      displayArea.textContent = displayValue;
      tr.dataset.displayValue = displayValue;
      tr.dataset.editorValue = editorValue;
    }

    const editorEl = editArea.querySelector("textarea, input");

    if (type === "boolean") {
      editBtn.textContent = "⇄";
      editBtn.title = "Toggle";
      editBtn.addEventListener('click', async () => {
        errorBox.style.display = "none";
        try {
          await setValue(tr.dataset.displayValue === "true" ? false : true);
          tr.classList.add('row-editing');
          setTimeout(() => tr.classList.remove('row-editing'), 300);
        } catch (err) {
          errorBox.textContent = "Toggle failed: " + err;
          errorBox.style.display = "";
        }
      });
      return;
    }

    editBtn.textContent = "✎";
    editBtn.title = "Edit";

    tr.addEventListener('keydown', (ev) => {
      if (ev.key === "Escape" && tr.classList.contains("row-editing")) {
        cancelEdit();
      }
    });

    editorEl.addEventListener('keydown', (ev) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        cancelEdit();
        return;
      }

      // Object types are edited as multiline, so Enter cannot be used to save.
      if (type !== "object" && ev.key === "Enter") {
        ev.preventDefault();
        saveEdit();
        return
      }

      // Use Ctrl/Cmd+S to save an object instead.
      if (type == "object" && (ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
        ev.preventDefault();
        saveEdit();
        return;
      }
    });

    editBtn.addEventListener('click', () => {
      if (!tr.classList.contains('row-editing')) {
        enterEdit();
      } else {
        saveEdit();
      }
    });

    function enterEdit() {
      tr.classList.add('row-editing');
      editorEl.value = tr.dataset.editorValue;
      displayArea.style.display = "none";
      editArea.style.display = "";
      errorBox.style.display = "none";
      editBtn.textContent = "✓";
      editorEl.focus();
      //try { editorEl.select(); } catch (e) { }
    }

    function cancelEdit() {
      tr.classList.remove('row-editing');
      displayArea.style.display = "";
      editArea.style.display = "none";
      errorBox.style.display = "none";
      editBtn.textContent = "✎";
    }

    async function saveEdit() {
      try {
        let newVal;
        if (type === "object") {
          newVal = JSON.parse(editorEl.value);
        } else if (type === "number") {
          newVal = Number(editorEl.value);
          if (!Number.isFinite(newVal)) throw new Error("Value is not a number");
        } else {
          newVal = editorEl.value;
        }
        await setValue(newVal);
        cancelEdit();
      } catch (err) {
        errorBox.textContent = "Save failed: " + err;
        errorBox.style.display = "";
      }
    }
  }

  const filterInput = document.querySelector(".filter");
  filterInput.addEventListener("input", (e) => {
    userFilter = e.target.value.trim();
    loadEntries();
  });

  // Auto-refresh on any change in this area. A single changed top-level key can
  // map to many flattened rows, so re-read and re-render rather than trying to
  // match raw change keys against the (flattened) filters.
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== storageArea) return;
    loadEntries();
  });

  loadEntries();
}

/**
 * When the module is loaded as a page script (`viewer=1`), run the viewer init
 * code.
 */
const moduleParams = new URL(import.meta.url).searchParams;
if (moduleParams.has('viewer')) {
  init();
}
