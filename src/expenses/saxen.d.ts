declare module "saxen" {
  export class Parser {
    ns(namespaces: Record<string, string>): void;
    on(event: "openTag", handler: (name: string, attributes: () => Record<string, string>, decode: (value: string) => string, selfClosing: boolean) => void): void;
    on(event: "closeTag", handler: (name: string) => void): void;
    on(event: "text", handler: (value: string, decode: (value: string) => string) => void): void;
    on(event: "error" | "warn" | "attention" | "cdata", handler: (value: unknown) => void): void;
    parse(xml: string): void;
  }
}
