export const LIMITS = Object.freeze({ bytes: 262144, rows: 1000, columns: 20, cell: 2000 });
export const FIELDS = Object.freeze(['sku', 'name', 'quantity', 'unit_price', 'currency']);
export const SAMPLE = 'Item code,Product,Units,Price,Money\r\nCB-101,"USB-C cable, 2m",12,9.50,USD\r\nHB-202,Travel hub,4,34.00,USD\r\nST-303,"Desk stand\nFoldable",8,22.50,USD';
export const INVALID_SAMPLE = 'Item code,Product,Units,Price,Money\nCB-101,USB-C cable,twelve,9.50,USD\nCB-101,Repeated item,4,34.005,XYZ\nST-303,"=HYPERLINK(""https://example.invalid"")",8,22.50,USD';

export function parseCsv(input) {
  if (typeof input !== 'string') throw new Error('CSV input must be text.');
  if (new TextEncoder().encode(input).length > LIMITS.bytes) throw new Error('File exceeds the 256 KiB limit.');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(input)) throw new Error('Unsupported control characters in CSV.');
  let text = input.replace(/^\uFEFF/u, '');
  if (!text.trim()) throw new Error('Add CSV text or load the sample.');
  const rows = [];
  let row = [], cell = '', mode = 'start';
  function append(c) { cell += c; if (cell.length > LIMITS.cell) throw new Error('A cell exceeds 2,000 characters.'); }
  function endCell() { row.push(cell); if (row.length > LIMITS.columns) throw new Error('CSV exceeds 20 columns.'); cell = ''; mode = 'start'; }
  function endRow() { endCell(); rows.push(row); row = []; if (rows.length > LIMITS.rows + 1) throw new Error('CSV exceeds 1,000 data rows.'); }
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (mode === 'quoted') {
      if (c === '"') { if (text[i + 1] === '"') { append('"'); i++; } else mode = 'closed'; }
      else append(c);
    } else if (c === ',') endCell();
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; endRow(); }
    else if (mode === 'closed') throw new Error('Unexpected text after a closing quote.');
    else if (c === '"') { if (mode !== 'start') throw new Error('Quotes must start at the beginning of a cell.'); mode = 'quoted'; }
    else { append(c); mode = 'plain'; }
  }
  if (mode === 'quoted') throw new Error('Unclosed quoted cell.');
  if (cell || row.length || mode === 'closed') endRow();
  const headers = rows.shift().map(x => x.trim());
  if (headers.some(x => !x)) throw new Error('Each column needs a header.');
  if (new Set(headers.map(x => x.toLowerCase())).size !== headers.length) throw new Error('Column headers must be unique.');
  if (!rows.length) throw new Error('Add at least one data row.');
  for (const [index, values] of rows.entries()) if (values.length !== headers.length) throw new Error(`Data row ${index + 1} has ${values.length} columns; expected ${headers.length}.`);
  return { headers, rows };
}

export function defaultMapping(headers) {
  const aliases = { sku: ['sku', 'item code', 'code'], name: ['name', 'product', 'item name'], quantity: ['quantity', 'units', 'qty'], unit_price: ['unit_price', 'price', 'unit price'], currency: ['currency', 'money'] };
  return Object.fromEntries(FIELDS.map(field => [field, headers.findIndex(h => aliases[field].includes(h.trim().toLowerCase()))]));
}

export function validate(table, mapping) {
  if (!mapping || FIELDS.some(f => !Number.isInteger(mapping[f]) || mapping[f] < 0 || mapping[f] >= table.headers.length)) throw new Error('Map every output field to a source column.');
  if (new Set(FIELDS.map(f => mapping[f])).size !== FIELDS.length) throw new Error('Choose a different source column for every output field.');
  const seen = new Set();
  return table.rows.map((source, index) => {
    const value = Object.fromEntries(FIELDS.map(f => [f, source[mapping[f]].trim()]));
    const errors = [];
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/.test(value.sku)) errors.push('SKU: use 1–40 letters, digits, dots, underscores or hyphens.');
    const key = value.sku.toUpperCase();
    if (seen.has(key)) errors.push('SKU: duplicate in this file.');
    seen.add(key);
    if (!value.name || value.name.length > 200) errors.push('Name: use 1–200 characters.');
    if (!/^(0|[1-9]\d{0,6})$/.test(value.quantity) || Number(value.quantity) > 1000000) errors.push('Quantity: use a whole number from 0 to 1,000,000.');
    if (!/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(value.unit_price)) errors.push('Price: use a nonnegative decimal with up to 2 decimal places.');
    value.currency = value.currency.toUpperCase();
    if (!['USD', 'MXN', 'JPY', 'EUR'].includes(value.currency)) errors.push('Currency: choose USD, MXN, JPY or EUR.');
    if (!errors.some(x => x.startsWith('Price:'))) {
      const [integer, decimal = ''] = value.unit_price.split('.');
      value.unit_price = `${integer}.${decimal.padEnd(2, '0')}`;
    }
    const escaped = FIELDS.filter(f => isFormulaLike(value[f]));
    return { row: index + 1, value, errors, escaped };
  });
}

// Include leading whitespace, invisible format characters and full-width formula initiators.
// Quoting CSV alone does not prevent spreadsheet formula execution.
export function isFormulaLike(value) { return /^[\s\p{Cf}]*[=+\-@＝＋－＠]/u.test(String(value)); }
export function safeCell(value) {
  let text = String(value);
  if (isFormulaLike(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function exportCsv(results) {
  if (!Array.isArray(results) || !results.length || results.some(x => x.errors.length)) throw new Error('Resolve every row issue before downloading.');
  return '\uFEFF' + [FIELDS, ...results.map(x => FIELDS.map(f => x.value[f]))].map(row => row.map(safeCell).join(',')).join('\r\n') + '\r\n';
}
