import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, defaultMapping, validate, exportCsv, isFormulaLike, safeCell, SAMPLE, INVALID_SAMPLE, LIMITS } from '../public/csv.js';

test('quoted commas, escaped quotes, multiline CRLF, BOM and trailing empty cells', () => {
  assert.deepEqual(parseCsv('\uFEFFa,b,c\r\n"a,b","line1\r\nline2","a""b"\r\nx,y,').rows, [['a,b', 'line1\r\nline2', 'a"b'], ['x','y','']]);
  assert.deepEqual(parseCsv('a,b\n"",z\n').rows, [['','z']]);
});
test('malformed CSV does not silently discard or reinterpret input', () => {
  for (const text of ['a,b\n"open,x', 'a,b\n"closed"x,y', 'a,b\nx"y,z', 'a,a\nx,y', 'a,\nx,y', 'a,b\nx', 'a,b\nx,y,z', 'a,b', '']) assert.throws(() => parseCsv(text));
});
test('bounded input rejects bytes, columns, rows, cells and unsupported controls', () => {
  assert.throws(() => parseCsv('a\n' + '界'.repeat(LIMITS.bytes)), /256 KiB/);
  assert.throws(() => parseCsv(Array.from({length:21},(_,i)=>'c'+i).join(',')+'\nx'), /20 columns/);
  assert.throws(() => parseCsv('a\n'+'x\n'.repeat(1001)), /1,000/);
  assert.throws(() => parseCsv('a\n'+'x'.repeat(2001)), /2,000/);
  assert.throws(() => parseCsv('a\nx\u0000'), /control/);
});
test('sample maps and exports a consistent five-column output', () => {
  const table = parseCsv(SAMPLE), results = validate(table, defaultMapping(table.headers));
  assert.equal(results.length,3); assert.ok(results.every(row=>row.errors.length===0));
  const out = parseCsv(exportCsv(results)); assert.deepEqual(out.headers,['sku','name','quantity','unit_price','currency']);
  assert.equal(out.rows[2][1],'Desk stand\nFoldable'); assert.equal(out.rows[0][3],'9.50');
});
test('invalid row sample blocks export and explains duplicate, quantity, price and currency', () => {
  const table = parseCsv(INVALID_SAMPLE), results = validate(table, defaultMapping(table.headers));
  assert.match(results[0].errors.join(' '),/Quantity/); assert.match(results[1].errors.join(' '),/duplicate/); assert.match(results[1].errors.join(' '),/Price/); assert.match(results[1].errors.join(' '),/Currency/);
  assert.deepEqual(results[2].escaped,['name']); assert.throws(()=>exportCsv(results),/every row/);
});
test('unmapped and reused source columns are rejected', () => {
  const table = parseCsv(SAMPLE), mapping = defaultMapping(table.headers);
  assert.throws(()=>validate(table,{...mapping,sku:-1})); assert.throws(()=>validate(table,{...mapping,name:mapping.sku}));
});
test('all spreadsheet formula initiators including whitespace and format prefixes are escaped', () => {
  for (const value of ['=1+1','+1','-1','@SUM(A1)','\t=2','\r\n=2','\u200b=2','＝1','＋1','－1','＠SUM(A1)']) { assert.equal(isFormulaLike(value),true); assert.ok(safeCell(value).startsWith('"\'')); }
  assert.equal(safeCell('<img src=x onerror=alert(1)>'),'"<img src=x onerror=alert(1)>"');
  assert.equal(safeCell('a"b'),'"a""b"'); assert.equal(isFormulaLike('ordinary text'),false);
});
test('schema rejects ambiguous numbers and case-insensitive duplicate SKUs; decimal conversion is exact text', () => {
  const table = parseCsv('sku,name,quantity,unit_price,currency\na,Good,01,1e3,usd\nA,Good,1,0001,mxn\nb,Good,0,0.1,jpy');
  const rows = validate(table,defaultMapping(table.headers)); assert.equal(rows[0].errors.length,2); assert.equal(rows[1].errors.length,2); assert.equal(rows[2].value.unit_price,'0.10'); assert.equal(rows[2].value.currency,'JPY');
});
