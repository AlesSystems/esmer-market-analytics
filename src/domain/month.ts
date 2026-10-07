export type SelectedMonth = string;
export function validSelectedMonth(value: unknown): value is SelectedMonth {
  return typeof value === "string" && /^(?:19[0-9]{2}|[2-9][0-9]{3})-(?:0[1-9]|1[0-2])$/.test(value) && value < "9999";
}
