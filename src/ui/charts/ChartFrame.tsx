import { useState, type ReactNode } from "react";

export type LegendItem = { key: string; label: string; color: string | "unknown" };
export type ChartTable = {
  caption: string;
  columns: { label: string; numeric?: boolean }[];
  rows: ReactNode[][];
};
export type ChartFrameProps = {
  title: string;
  /** One line under the title. */
  summary?: string;
  /** Rendered only for two or more entries. Use color "unknown" for the hatched swatch. */
  legend?: LegendItem[];
  /** Exact values as a real table. The Grafik/Tablo toggle appears only when rows exist. */
  table?: ChartTable;
  defaultView?: "chart" | "table";
  headingLevel?: "h2" | "h3" | "h4";
  className?: string;
  children?: ReactNode;
};

export function Swatch({ color }: { color: string }) {
  return <i aria-hidden="true" className={color === "unknown" ? "viz-swatch viz-hatch" : "viz-swatch"} style={color === "unknown" ? undefined : { background: color }} />;
}

export function ChartFrame({ title, summary, legend, table, defaultView = "chart", headingLevel: Heading = "h3", className, children }: ChartFrameProps) {
  const [view, setView] = useState(defaultView);
  const toggle = Boolean(table && table.rows.length > 0);
  const showTable = toggle && view === "table";
  return (
    <figure className={className ? `viz-frame ${className}` : "viz-frame"}>
      <header className="viz-head">
        <div className="viz-heading">
          <Heading className="viz-title">{title}</Heading>
          {summary && <p className="viz-summary">{summary}</p>}
        </div>
        {toggle && (
          <div className="viz-toggle" role="group" aria-label="Görünüm">
            <button type="button" aria-pressed={!showTable} onClick={() => setView("chart")}>Grafik</button>
            <button type="button" aria-pressed={showTable} onClick={() => setView("table")}>Tablo</button>
          </div>
        )}
      </header>
      {!showTable && legend && legend.length >= 2 && (
        <ul className="viz-legend">
          {legend.map((item) => <li key={item.key}><Swatch color={item.color} />{item.label}</li>)}
        </ul>
      )}
      {showTable && table ? (
        <div className="viz-table-wrap" role="region" aria-label={table.caption} tabIndex={0}>
          <table className="viz-table">
            <caption className="viz-sr">{table.caption}</caption>
            <thead><tr>{table.columns.map((column) => <th key={column.label} scope="col" className={column.numeric ? "viz-num" : undefined}>{column.label}</th>)}</tr></thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className={table.columns[cellIndex]?.numeric ? "viz-num" : undefined}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="viz-body">{children}</div>}
    </figure>
  );
}
