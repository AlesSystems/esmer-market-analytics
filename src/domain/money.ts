import Decimal from "decimal.js";

// Synthetic input bounds keep products and 100,000-row sums below 100 significant digits.
export const Exact = Decimal.clone({ precision: 100, rounding: Decimal.ROUND_HALF_UP, toExpNeg: -100, toExpPos: 100 });
export const sum = (values: string[]) => values.reduce((total, value) => total.plus(value), new Exact(0)).toFixed();
export const rounded = (value: string, places = 2) => new Exact(value).toDecimalPlaces(places).toFixed();
export function percentageChange(current: string, previous: string): string | null {
  return new Exact(previous).gt(0) ? new Exact(current).minus(previous).div(previous).times(100).toDecimalPlaces(2).toFixed() : null;
}
