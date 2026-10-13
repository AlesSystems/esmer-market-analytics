import type { CSSProperties, ReactNode } from "react";
import { rankLayout, UNKNOWN } from "./geometry";

export type RankRow = {
  id: string;
  label: string;
  /** Decimal string, or null when unknown (drawn as a hatched stub, never as zero). */
  value: string | null;
  detail?: string;
  /** Receives the clicked button so callers can capture a return receipt for it. */
  onSelect?: (button: HTMLButtonElement) => void;
  /** Rendered as data-focus-key on the row button, so focus can be restored after the view is rebuilt. */
  focusKey?: string;
};
export type RankBarsProps = {
  rows: RankRow[];
  color: string;
  formatValue: (value: string) => string;
  /** Shared scale cap so bars stay comparable across metric switches. */
  max?: number;
  ariaLabel?: string;
  empty?: string;
};

export function RankBars({ rows, color, formatValue, max, ariaLabel = "Sıralama", empty = "Gösterilecek veri yok." }: RankBarsProps) {
  if (rows.length === 0) return <p className="viz-empty">{empty}</p>;
  const layout = rankLayout(rows, max);
  return (
    <ul className="viz-rows" aria-label={ariaLabel} style={{ "--viz-bar": color } as CSSProperties}>
      {rows.map((row, index) => {
        const span = layout.rows[index];
        const unknown = span.kind === "unknown";
        const cls = unknown ? "viz-bar viz-bar--unknown viz-hatch" : span.negative ? "viz-bar viz-bar--negative" : "viz-bar viz-bar--value";
        const body: ReactNode = (
          <>
            <span className="viz-row-label">{row.label}{row.detail && <small>{row.detail}</small>}</span>
            <span className="viz-track" aria-hidden="true">
              <i className="viz-zero" style={{ left: `${layout.zero}%` }} />
              <i className={cls} style={{ left: `${span.left}%`, width: `${span.width}%` }} />
            </span>
            <strong className={unknown ? "viz-row-value viz-row-value--unknown" : "viz-row-value"}>{unknown ? UNKNOWN : formatValue(row.value as string)}</strong>
          </>
        );
        return (
          <li key={row.id} data-state={unknown ? "unknown" : "value"}>
            {row.onSelect ? <button type="button" className="viz-row" data-focus-key={row.focusKey} onClick={(event) => row.onSelect?.(event.currentTarget)}>{body}</button> : <div className="viz-row">{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}
