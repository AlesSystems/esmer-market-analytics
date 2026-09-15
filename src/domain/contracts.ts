export type Availability =
  | {
      status: "ready";
      store: "empty";
      liveConnection: "disabled";
    }
  | {
      status: "unavailable";
      code: "SERVICE_UNAVAILABLE";
      message: string;
    };
export type RequestError = {
  status: "rejected";
  code: "UNTRUSTED_SENDER" | "UNKNOWN_OPERATION" | "INVALID_PAYLOAD";
  message: string;
};
export interface DesktopApi {
  getAvailability(): Promise<Availability | RequestError>;
}
