import { bridgeLayout, UNKNOWN, type BridgeStep } from "./geometry";

export type { BridgeStep };
export type BridgeProps = {
  steps: BridgeStep[];
  formatValue: (value: string) => string;
  ariaLabel?: string;
  empty?: string;
};

const operator = { total: "", minus: "−", result: "=", unknown: "" } as const;

export function Bridge({ steps, formatValue, ariaLabel = "Satıştan katkıya köprü", empty = "Gösterilecek veri yok." }: BridgeProps) {
  if (steps.length === 0) return <p className="viz-empty">{empty}</p>;
  const layout = bridgeLayout(steps);
  return (
    <ol className="viz-rows viz-bridge" aria-label={ariaLabel}>
      {steps.map((step, index) => {
        const span = layout.rows[index];
        const missing = step.value === null;
        const reversal = step.kind === "minus" && step.value?.startsWith("-") === true;
        const sign = reversal ? "+" : operator[step.kind];
        const cls = missing || step.kind === "unknown" ? "viz-bar viz-bar--unknown viz-hatch" : `viz-bar viz-bar--${step.kind}`;
        const text = missing ? UNKNOWN : formatValue(step.kind === "minus" ? (step.value as string).replace(/^-/, "") : (step.value as string));
        return (
          <li key={index} data-state={missing || step.kind === "unknown" ? "unknown" : "value"}>
            <div className="viz-row">
              <span className="viz-row-label"><b aria-hidden="true">{sign}</b>{step.label}{step.detail && <small>{step.detail}</small>}</span>
              <span className="viz-track" aria-hidden="true">
                <i className="viz-zero" style={{ left: `${layout.zero}%` }} />
                <i className={cls} style={{ left: `${span.left}%`, width: `${span.width}%` }} />
              </span>
              <strong className={missing ? "viz-row-value viz-row-value--unknown" : "viz-row-value"}>{step.kind === "minus" && !missing ? `${sign} ${text}` : text}</strong>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
