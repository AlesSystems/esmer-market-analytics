import { Unzip, UnzipInflate, strFromU8, unzipSync } from "fflate";
import { Parser } from "saxen";
import { expenseColumns } from "./template";
import { Exact } from "../domain/money";
import { validDate } from "./validation";
export const MAX_EXPENSE_BYTES = 4 * 1024 * 1024;
const MAX_EXPANDED = 16 * 1024 * 1024;
type Element = { name: string; attrs: Record<string, string>; children: Element[]; text: string };
const invalid = () => { throw new Error("WORKBOOK_INVALID"); };
function xml(bytes: Uint8Array): Element {
  const parser = new Parser(), stack: Element[] = []; let root: Element | undefined, count = 0;
  parser.ns({ "http://schemas.openxmlformats.org/spreadsheetml/2006/main": "s", "http://schemas.openxmlformats.org/package/2006/relationships": "r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships": "o" });
  parser.on("error", invalid); parser.on("warn", invalid); parser.on("attention", invalid); parser.on("cdata", invalid);
  parser.on("openTag", (name, attrs, decode) => {
    if (++count > 180000 || stack.length > 20) invalid();
    const node: Element = { name, attrs: Object.fromEntries(Object.entries(attrs()).map(([k, v]) => [k, decode(v)])), children: [], text: "" };
    if (stack.length) stack.at(-1)!.children.push(node); else { if (root) invalid(); root = node; }
    stack.push(node);
  });
  parser.on("text", (value, decode) => { if (stack.length) stack.at(-1)!.text += decode(value); else if (value.trim()) invalid(); });
  parser.on("closeTag", name => { if (stack.pop()?.name !== name) invalid(); });
  parser.parse(strFromU8(bytes));
  if (!root || stack.length) invalid();
  return root!;
}
const all = (node: Element, name: string): Element[] => [...(node.name === name ? [node] : []), ...node.children.flatMap(child => all(child, name))];
function archive(bytes: Uint8Array): Map<string, Uint8Array> {
  if (!bytes.length || bytes.length > MAX_EXPENSE_BYTES) invalid();
  let declared = 0;
  const expected = new Map<string, number>();
  unzipSync(bytes, { filter: file => {
    declared += file.originalSize;
    if (expected.has(file.name) || expected.size >= 64 || declared > MAX_EXPANDED) invalid();
    expected.set(file.name, file.originalSize); return false;
  } });
  const files = new Map<string, Uint8Array>(); let total = 0, entries = 0;
  const unzip = new Unzip(file => {
    if (!expected.has(file.name) || ++entries > 64 || file.originalSize !== undefined && file.originalSize > MAX_EXPANDED || files.has(file.name) || file.name.includes("..") || /(?:vbaProject|externalLinks|embeddings)/i.test(file.name)) invalid();
    const chunks: Uint8Array[] = []; let length = 0;
    files.set(file.name, new Uint8Array());
    file.ondata = (error, chunk, final) => {
      if (error) invalid();
      total += chunk.length; length += chunk.length;
      if (total > MAX_EXPANDED || file.originalSize !== undefined && length > file.originalSize) invalid();
      chunks.push(chunk);
      if (final) { if (length !== expected.get(file.name)) invalid(); const output = new Uint8Array(length); let offset = 0; for (const part of chunks) { output.set(part, offset); offset += part.length; } files.set(file.name, output); }
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  for (let start = 0; start < bytes.length; start += 65536) unzip.push(bytes.subarray(start, start + 65536), start + 65536 >= bytes.length);
  if (!entries || files.size !== expected.size) invalid();
  return files;
}
export type Cell = { value: string; numeric: boolean; date1904?: boolean };
export function readExpenseWorkbook(bytes: Uint8Array): Cell[][] {
  const files = archive(bytes), documents = new Map<string, Element>();
  for (const [name, data] of files) if (name.endsWith(".xml") || name.endsWith(".rels")) {
    const document = xml(data); documents.set(name, document);
    const relationshipIds = all(document, "r:Relationship").map(r => r.attrs.Id);
    if (new Set(relationshipIds).size !== relationshipIds.length) invalid();
    if (all(document, "s:f").length || all(document, "r:Relationship").some(row => row.attrs.TargetMode === "External")) invalid();
  }
  const book = documents.get("xl/workbook.xml"), sheet = documents.get("xl/worksheets/sheet1.xml");
  if (!book || book.name !== "s:workbook" || !sheet || sheet.name !== "s:worksheet" || all(book, "s:sheet").length !== 1 || [...files.keys()].filter(name => /^xl\/worksheets\/[^/]+\.xml$/.test(name)).length !== 1) invalid();
  const date1904 = all(book!, "s:workbookPr").some(row => row.attrs.date1904 === "1" || row.attrs.date1904 === "true");
  const relationships = documents.get("xl/_rels/workbook.xml.rels");
  const sheetId = all(book!, "s:sheet")[0].attrs["o:id"];
  const relationship = relationships && all(relationships, "r:Relationship").find(r => r.attrs.Id === sheetId);
  if (!relationship || !["worksheets/sheet1.xml", "/xl/worksheets/sheet1.xml"].includes(relationship.attrs.Target) || relationship.attrs.Type !== "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet") invalid();
  const shared = documents.get("xl/sharedStrings.xml");
  const strings = shared ? all(shared, "s:si").map(si => all(si, "s:t").map(t => t.text).join("")) : [];
  const result: Cell[][] = [];
  const rows = all(sheet!, "s:row");
  if (rows.length > 5001) invalid();
  let lastRow = 0;
  for (const row of rows) {
    const ordinal = Number(row.attrs.r); if (!Number.isSafeInteger(ordinal) || ordinal <= lastRow || ordinal > 5001) invalid(); lastRow = ordinal;
    const values: Cell[] = []; const used = new Set<number>();
    for (const c of row.children) {
      if (c.name !== "s:c") invalid();
      const match = /^([A-N])([1-9]\d*)$/.exec(c.attrs.r); if (!match || Number(match[2]) !== ordinal) invalid();
      const index = match![1].charCodeAt(0) - 65; if (used.has(index)) invalid(); used.add(index);
      const t = c.attrs.t; let value = "";
      if (c.children.some(child => !["s:v", "s:is"].includes(child.name)) || all(c, "s:v").length > 1 || all(c, "s:is").length > 1 || (t === "inlineStr" ? all(c, "s:v").length > 0 : all(c, "s:is").length > 0)) invalid();
      if (t === "s") { const ref = all(c, "s:v")[0]?.text; if (!ref || !/^\d+$/.test(ref) || strings[Number(ref)] === undefined) invalid(); value = strings[Number(ref)]; }
      else if (t === "inlineStr") value = all(c, "s:t").map(n => n.text).join("");
      else if (t === undefined || t === "n") value = all(c, "s:v")[0]?.text ?? "";
      else invalid();
      if (value.length > 1000) invalid();
      values[index] = { value: value.trim(), numeric: t === undefined || t === "n", date1904 };
    }
    while (result.length < ordinal - 1) result.push([]);
    result.push(values);
  }
  if (result[0]?.length !== expenseColumns.length || expenseColumns.some((name, i) => result[0][i]?.value !== name)) invalid();
  return result.slice(1);
}
export function decimalCell(cell: Cell | undefined): string {
  if (!cell?.value) invalid();
  let text = cell!.value;
  if (cell!.numeric) { if (!/^(?:0|[1-9]\d{0,39})(?:\.\d{1,30})?(?:[eE][+-]?\d{1,2})?$/.test(text)) invalid(); }
  else { if (!/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:\.\d{3})+)(?:,\d{1,30})?$/.test(text)) invalid(); text = text.replaceAll(".", "").replace(",", "."); }
  const value = new Exact(text).toFixed(); if (!/^(?:0|[1-9]\d{0,39})(?:\.\d{1,30})?$/.test(value)) invalid(); return value;
}
export function dateCell(cell: Cell | undefined): string {
  if (!cell) invalid();
  if (cell!.numeric) {
    if (!/^\d+$/.test(cell!.value)) invalid();
    const serial = Number(cell!.value);
    if (!Number.isSafeInteger(serial) || serial < (cell!.date1904 ? 0 : 1) || serial > 2957003 || !cell!.date1904 && serial === 60) invalid();
    const epoch = Date.UTC(cell!.date1904 ? 1904 : 1899, cell!.date1904 ? 0 : 11, cell!.date1904 ? 1 : 31);
    const date = new Date(epoch + (serial - (!cell!.date1904 && serial > 60 ? 1 : 0)) * 86400000).toISOString().slice(0, 10);
    if (!validDate(date)) invalid(); return date;
  }
  const text = cell!.value, match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text), date = match ? `${match[3]}-${match[2]}-${match[1]}` : text;
  if (!validDate(date)) invalid(); return date;
}
