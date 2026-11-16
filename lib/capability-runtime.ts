// Shared vocabulary between a capability contract and the panel that renders
// it. The panel knows these shapes; it never knows which capability it is
// showing, which is what keeps a site's subject matter out of the runtime.

export type CapabilityInput = {
  id: string;
  kind: "file" | "text" | "number" | "select";
  label: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  accept?: string[];
  multiple?: boolean;
  options?: { value: string; label: string }[];
  multiline?: boolean;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: string;
};

export type CapabilityOutput = {
  kind: "file" | "text" | "value" | "table";
  label: string;
  downloadName?: string;
  mimeType?: string;
};

export type CapabilityContract = {
  id: string;
  title: string;
  summary: string;
  operation: string;
  params: Record<string, string | number | boolean | string[]>;
  execution: "client" | "server";
  privacy: "in-browser" | "upload-ephemeral";
  privacyNote: string;
  inputs: CapabilityInput[];
  outputs: CapabilityOutput[];
  states: { idle: string; working: string; success: string; error: string; empty: string };
  validation: { id: string; rule: string; message: string }[];
  limits: { maxInputBytes?: number; maxItems?: number; notes?: string };
  telemetry: string[];
};

export type CapabilityValue = string | File | File[] | null;

export type DatasetRow = {
  cells: string[];
  status?: "working" | "expired" | "unconfirmed" | string;
  recordKey?: string;
  evidenceRefs?: string[];
  observedAt?: string;
  sourceUrl?: string;
};
export type Dataset = { columns: string[]; rows: DatasetRow[]; lastCheckedAt?: string };

export type CapabilityRunContext = {
  params: Record<string, string | number | boolean | string[]>;
  dataset?: Dataset;
};

export type CapabilityResult = {
  status: "success" | "error" | "empty";
  message?: string;
  detail?: string;
  diagnostics?: { label: string; value: string }[];
  file?: { url: string; name: string; bytes: number; mimeType: string };
  text?: string;
  value?: { label: string; value: string; status?: string };
  table?: Dataset & { total: number };
};

export type CapabilityRunner = (
  values: Record<string, CapabilityValue>,
  context: CapabilityRunContext,
) => Promise<CapabilityResult>;

export function paramString(params: CapabilityRunContext["params"], key: string, fallback = ""): string {
  const value = params[key];
  return typeof value === "string" ? value : fallback;
}

export function paramNumber(params: CapabilityRunContext["params"], key: string, fallback: number): number {
  const value = Number(params[key]);
  return Number.isFinite(value) ? value : fallback;
}

export function paramList(params: CapabilityRunContext["params"], key: string): string[] {
  const value = params[key];
  return Array.isArray(value) ? value.map(String) : [];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
