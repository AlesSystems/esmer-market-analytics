export function decimal(value: string, minimum = 0) {
  const [integer, fraction = ""] = value.split(".");
  const digits = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const tail = fraction.padEnd(minimum, "0");
  return tail ? `${digits},${tail}` : digits;
}
export const count = (value: number) => value.toLocaleString("tr-TR");
export const money = (value: string) => `${decimal(value, 2)} ₺`;
const dateFormatter = new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC" });
export const date = (value: string) => dateFormatter.format(new Date(value));
export const quantity = (value: { piece: string; kg: string }) => `${decimal(value.piece)} adet · ${decimal(value.kg)} kg`;
export const percent = (value: string | null) => value === null ? "Karşılaştırılamıyor" : `%${decimal(value)}`;
/** True for a decimal string that is exactly zero ("0", "0.00", "-0.0"). A string test, never arithmetic. */
export const isZeroDecimal = (value: string) => /^-?0+(\.0+)?$/.test(value);
