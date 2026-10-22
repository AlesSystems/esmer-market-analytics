import { formatShare, shares } from "./geometry";
import { Swatch } from "./ChartFrame";
import { count } from "../format";

export type CompositionPart = { key: string; label: string; value: number; color: string | "unknown" };
export type CompositionBarProps = {
  parts: CompositionPart[];
  formatValue?: (value: number) => string;
  ariaLabel?: string;
  /** Short Turkish text shown when there is nothing to compose. */
  empty?: string;
};


export function CompositionBar({ parts, formatValue = count, ariaLabel, empty = "Gösterilecek veri yok." }: CompositionBarProps) {
  const percents = shares(parts.map((part) => part.value));
  if (!parts.some((part) => part.value > 0)) return <p className="viz-empty">{empty}</p>;
  const label = ariaLabel ?? `Dağılım: ${parts.map((part, index) => `${part.label} ${formatShare(percents[index])}`).join(", ")}`;
  return (
    <div className="viz-comp">
      <div className="viz-comp-bar" role="img" aria-label={label}>
        {parts.map((part) => part.value > 0 && (
          <span key={part.key} className={part.color === "unknown" ? "viz-comp-part viz-hatch" : "viz-comp-part"} style={{ flexGrow: part.value, background: part.color === "unknown" ? undefined : part.color }} />
        ))}
      </div>
      <ul className="viz-comp-legend">
        {parts.map((part, index) => (
          <li key={part.key}>
            <Swatch color={part.color} />
            <span className="viz-comp-label">{part.label}</span>
            <strong>{formatValue(part.value)}</strong>
            <span className="viz-comp-share">{formatShare(percents[index])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
