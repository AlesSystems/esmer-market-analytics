import type { Availability, ImportOutcome, RequestError } from "../domain/contracts";
export const APP_URL = "esmer://app/index.html";
export async function handleRequest(
  trustedSender: boolean,
  operation: unknown,
  payload: unknown,
  getAvailability: () => Promise<Availability>,
  importPackage?: () => Promise<ImportOutcome>,
): Promise<Availability | ImportOutcome | RequestError> {
  if (!trustedSender)
    return {
      status: "rejected",
      code: "UNTRUSTED_SENDER",
      message: "Bu pencerenin işlem yapma izni yok.",
    };
  if (operation !== "getAvailability" && (operation !== "importPackage" || !importPackage))
    return {
      status: "rejected",
      code: "UNKNOWN_OPERATION",
      message: "Bu işlem desteklenmiyor.",
    };
  if (payload !== null)
    return {
      status: "rejected",
      code: "INVALID_PAYLOAD",
      message: "İstek geçerli değil.",
    };
  return operation === "importPackage" ? importPackage!() : getAvailability();
}
