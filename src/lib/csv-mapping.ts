export type EntityType = "resource" | "project";
export type ConfidenceLevel = "exact" | "high" | "medium";

export interface MappingResult {
  dbField: string | null;
  confidence: ConfidenceLevel | null;
}

const RESOURCE_FIELDS = ["name", "role", "team", "capacity", "status", "createdAt"] as const;
const PROJECT_FIELDS = ["name", "client", "color", "status", "createdAt"] as const;

export type ResourceField = (typeof RESOURCE_FIELDS)[number];
export type ProjectField = (typeof PROJECT_FIELDS)[number];

export function getFieldsForEntity(entityType: EntityType): readonly string[] {
  return entityType === "resource" ? RESOURCE_FIELDS : PROJECT_FIELDS;
}

const SYNONYMS: Record<string, string[]> = {
  name: ["full_name", "resource_name", "project_name", "nom", "label", "fullname", "ressource"],
  role: ["position", "title", "job", "job_title", "function", "poste", "jobtitle"],
  team: ["department", "group", "squad", "equipe", "unit", "service", "dept"],
  capacity: ["hours", "weekly_hours", "fte", "disponibilite", "capacite", "weeklyhours", "hrs"],
  client: ["customer", "company", "account", "organization", "societe", "organisation", "entreprise"],
  color: ["colour", "hex", "couleur", "hexcolor"],
  status: ["state", "statut", "lifecycle", "enabled", "actif"],
  createdAt: ["created", "created_at", "creation_date", "date_creation", "date", "created_on", "createdat", "creationdate"],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s_\-./]+/g, "").trim();
}

function matchField(
  csvHeader: string,
  dbFields: readonly string[],
): MappingResult {
  const headerLower = csvHeader.trim().toLowerCase();
  const headerNorm = normalize(csvHeader);

  for (const field of dbFields) {
    if (headerLower === field.toLowerCase()) {
      return { dbField: field, confidence: "exact" };
    }
  }

  for (const field of dbFields) {
    if (headerNorm === normalize(field)) {
      return { dbField: field, confidence: "exact" };
    }
  }

  for (const field of dbFields) {
    const synonyms = SYNONYMS[field];
    if (!synonyms) continue;
    for (const syn of synonyms) {
      if (headerNorm === normalize(syn)) {
        return { dbField: field, confidence: "high" };
      }
    }
  }

  for (const field of dbFields) {
    const fieldNorm = normalize(field);
    if (headerNorm.includes(fieldNorm) && fieldNorm.length >= 3) {
      return { dbField: field, confidence: "medium" };
    }
  }

  for (const field of dbFields) {
    const synonyms = SYNONYMS[field];
    if (!synonyms) continue;
    for (const syn of synonyms) {
      const synNorm = normalize(syn);
      if (headerNorm.includes(synNorm) && synNorm.length >= 3) {
        return { dbField: field, confidence: "medium" };
      }
    }
  }

  return { dbField: null, confidence: null };
}

export interface AutoMappingEntry {
  csvHeader: string;
  dbField: string | null;
  confidence: ConfidenceLevel | null;
}

/**
 * Compute auto-mapping from CSV headers to DB fields.
 * Each DB field is assigned at most once; higher-confidence matches win.
 */
export function computeAutoMapping(
  csvHeaders: string[],
  entityType: EntityType,
): AutoMappingEntry[] {
  const dbFields = getFieldsForEntity(entityType);

  const candidates: {
    csvHeader: string;
    dbField: string | null;
    confidence: ConfidenceLevel | null;
    score: number;
  }[] = csvHeaders.map((h) => {
    const result = matchField(h, dbFields);
    const score = result.confidence === "exact" ? 3 : result.confidence === "high" ? 2 : result.confidence === "medium" ? 1 : 0;
    return { csvHeader: h, ...result, score };
  });

  candidates.sort((a, b) => b.score - a.score);

  const claimed = new Set<string>();
  const output: AutoMappingEntry[] = [];

  for (const c of candidates) {
    if (c.dbField && !claimed.has(c.dbField)) {
      claimed.add(c.dbField);
      output.push({ csvHeader: c.csvHeader, dbField: c.dbField, confidence: c.confidence });
    } else {
      output.push({ csvHeader: c.csvHeader, dbField: null, confidence: null });
    }
  }

  const headerOrder = new Map(csvHeaders.map((h, i) => [h, i]));
  output.sort((a, b) => (headerOrder.get(a.csvHeader) ?? 0) - (headerOrder.get(b.csvHeader) ?? 0));

  return output;
}

const ACTIVE_VALUES = new Set(["active", "actif", "yes", "oui", "1", "true", "enabled", "on"]);
const ARCHIVED_VALUES = new Set(["archived", "archivé", "archive", "inactive", "inactif", "no", "non", "0", "false", "disabled", "off"]);

export function normalizeStatus(value: string): "ACTIVE" | "ARCHIVED" {
  const v = value.trim().toLowerCase();
  if (ARCHIVED_VALUES.has(v)) return "ARCHIVED";
  if (ACTIVE_VALUES.has(v)) return "ACTIVE";
  return "ACTIVE";
}

export function parseDate(value: string): Date | null {
  if (!value.trim()) return null;
  const d = new Date(value.trim());
  if (!isNaN(d.getTime())) return d;

  const ddmmyyyy = value.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (ddmmyyyy) {
    const parsed = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}
