import { parseCsv, defaultMapping, validate, exportCsv, FIELDS, LIMITS, SAMPLE, INVALID_SAMPLE } from './csv.js';
const byId = id => document.getElementById(id);
const source = byId('source'), status = byId('status');
let table = null, results = null, fileEpoch = 0;
function element(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
function message(text, kind = '') { status.textContent = text; status.className = kind; }
function reset() { table = null; results = null; byId('mapping').replaceChildren(element('p', 'Read the source columns to configure mapping.')); byId('preview').replaceChildren(); byId('issues').replaceChildren(); byId('validate').disabled = true; byId('download').disabled = true; }
source.addEventListener('input', () => { fileEpoch++; reset(); message('Source changed. Read columns again.'); });
for (const [id, sample] of [['sample', SAMPLE], ['invalid', INVALID_SAMPLE]]) byId(id).addEventListener('click', () => { fileEpoch++; source.value = sample; byId('file').value = ''; reset(); message('Sample loaded. Select Read columns to continue.'); });
byId('file').addEventListener('change', async event => {
  const file = event.target.files[0], epoch = ++fileEpoch;
  reset(); source.value = '';
  if (!file) { message('No file selected. Load the sample or choose a CSV.'); return; }
  if (file.size > LIMITS.bytes) { message('File exceeds the 256 KiB limit.', 'error'); return; }
  message('Reading the file locally…');
  try { const bytes = await file.arrayBuffer(); const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); if (epoch !== fileEpoch) return; source.value = text; message('File loaded locally. Select Read columns to continue.'); }
  catch { if (epoch === fileEpoch) message('Could not read this UTF-8 file. Try a UTF-8 CSV export.', 'error'); }
});
byId('parse').addEventListener('click', () => {
  reset();
  try {
    table = parseCsv(source.value);
    const mapping = defaultMapping(table.headers), form = byId('mapping'); form.replaceChildren();
    for (const field of FIELDS) {
      const label = element('label', field), select = element('select'); select.id = `map-${field}`; label.htmlFor = select.id;
      const empty = element('option', 'Choose source column'); empty.value = '-1'; select.append(empty);
      table.headers.forEach((header, index) => { const option = element('option', header); option.value = String(index); select.append(option); });
      select.value = String(mapping[field]);
      select.addEventListener('change', () => { results = null; byId('download').disabled = true; byId('preview').replaceChildren(); byId('issues').replaceChildren(); message('Mapping changed. Validate rows again.'); });
      form.append(label, select);
    }
    byId('validate').disabled = false; message(`${table.rows.length} data rows read. Review mapping, then validate.`);
  } catch (error) { message(error.message, 'error'); }
});
byId('validate').addEventListener('click', () => {
  results = null; byId('download').disabled = true; byId('preview').replaceChildren(); byId('issues').replaceChildren();
  try {
    const mapping = Object.fromEntries(FIELDS.map(field => [field, Number(byId(`map-${field}`).value)]));
    results = validate(table, mapping);
    const invalid = results.filter(r => r.errors.length), escaped = results.filter(r => r.escaped.length);
    const grid = element('table'), caption = element('caption', 'Normalized output preview — first 10 rows'); grid.append(caption);
    const head = element('thead'), tr = element('tr'); for (const field of ['Row', ...FIELDS, 'Result']) { const th = element('th', field); th.scope = 'col'; tr.append(th); } head.append(tr); grid.append(head);
    const body = element('tbody');
    for (const row of results.slice(0, 10)) { const tr = element('tr'); tr.append(element('td', String(row.row))); for (const f of FIELDS) tr.append(element('td', row.value[f])); tr.append(element('td', row.errors.length ? 'Needs correction' : row.escaped.length ? 'Ready · escaped on export' : 'Ready', row.errors.length ? 'error' : 'success')); body.append(tr); }
    grid.append(body); byId('preview').replaceChildren(grid);
    if (invalid.length) {
      message(`${invalid.length} of ${results.length} rows need correction. Export is blocked. Edit the source, read columns and validate again.`, 'error');
      const list = element('ul'); for (const row of invalid.slice(0, 25)) list.append(element('li', `Data row ${row.row}: ${row.errors.join(' ')}`)); byId('issues').append(list);
      if (invalid.length > 25) byId('issues').append(element('p', 'Only the first 25 invalid rows are listed.'));
    } else { byId('download').disabled = false; message(`${results.length} rows validated. ${escaped.length} rows contain formula-like text that will be escaped on export. Ready to download.`, escaped.length ? 'warning' : 'success'); }
  } catch (error) { message(error.message, 'error'); }
});
byId('download').addEventListener('click', () => {
  try { const csv = exportCsv(results), blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), link = element('a'); link.href = url; link.download = 'csv-bridge-inventory.csv'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); message('Download prepared locally. Check the exported file before importing it into another system.', 'success'); }
  catch (error) { message(error.message, 'error'); }
});
