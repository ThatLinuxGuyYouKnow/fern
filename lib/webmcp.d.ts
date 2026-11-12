/* Minimal typings for the WebMCP imperative API (Chrome origin trial).
   Full typings: npm package `webmcp-types`. */
interface WebMcpToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
    debugging?: boolean;
  };
  execute: (args: Record<string, unknown>, ctx: { signal: AbortSignal }) => Promise<string | null>;
}
interface DocumentWithModelContext extends Document {
  modelContext?: {
    registerTool: (tool: WebMcpToolDef, opts?: { signal?: AbortSignal; exposedTo?: string[] }) => Promise<void>;
  };
}
