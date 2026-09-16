import type { Availability, RequestError } from "../domain/contracts";
export const APP_URL = "esmer://app/index.html";
export async function handleRequest(
  trustedSender: boolean,
  operation: unknown,
  payload: unknown,
  getAvailability: () => Promise<Availability>,
): Promise<Availability | RequestError> {
  if (!trustedSender)
    return {
      status: "rejected",
      code: "UNTRUSTED_SENDER",
      message: "Bu pencerenin işlem yapma izni yok.",
    };
  if (operation !== "getAvailability")
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
  return getAvailability();
}
