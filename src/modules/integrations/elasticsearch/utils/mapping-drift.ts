/**
 * Declared-vs-live index mapping comparison.
 *
 * An Elasticsearch index can only be given a mapping at creation time. When a document is written
 * to an index that does not exist yet, Elasticsearch auto-creates it from its DYNAMIC defaults --
 * every string becomes `text` + `.keyword`, every number becomes `long`, and a `completion` field
 * silently degrades into a plain object. The index then looks healthy while autocomplete is dead
 * and every sort/aggregation on a declared `keyword` field fails with `Fielddata is disabled`.
 *
 * These helpers make that divergence detectable instead of invisible.
 */

/** A single declared field whose live mapping disagrees with the declaration. */
export interface IndexMappingDrift {
    /** Name of the drifted field as declared in the mapping file. */
    field: string
    /** Compact signature of the field definition the code declares. */
    declared: string
    /** Compact signature Elasticsearch actually holds (`missing` when the field is absent). */
    live: string
}

/** Inputs for {@link diffIndexMapping}. */
export interface DiffIndexMappingParams {
    /** `mappings` block declared in `mappings/*.mapping.ts`. */
    declared?: Record<string, unknown>
    /** `mappings` block read back from the live index. */
    live?: Record<string, unknown>
}

/** Loose shape of one field definition inside a `properties` block. */
interface MappingField {
    /** Elasticsearch field type; absent means an implicit `object`. */
    type?: string
    /** `false` disables the inverted index for the field. */
    index?: boolean
    /** `false` stores the field without indexing any of its contents. */
    enabled?: boolean
    /** Declared multi-fields (e.g. a `keyword` subfield beside a `text` field). */
    fields?: Record<string, MappingField>
}

/**
 * Read the `properties` block out of a `mappings` object.
 *
 * @param mappings - A `mappings` block (declared or live).
 * @returns The field definitions keyed by field name, or an empty record.
 */
function readProperties(
    mappings?: Record<string, unknown>,
): Record<string, MappingField> {
    const properties = mappings?.properties
    if (!properties || typeof properties !== "object") {
        return {
        }
    }
    return properties as Record<string, MappingField>
}

/**
 * Render a field definition as a short, comparable signature.
 *
 * Only the parts a declaration actually pins down are rendered -- type, `index`, `enabled` and the
 * declared multi-fields -- so extra sub-fields Elasticsearch adds on its own never read as drift.
 *
 * @param field - The field definition to describe.
 * @param subFields - Multi-field names to include (the declared ones).
 * @returns A signature such as `text fields:{keyword:keyword}`.
 */
function describeField(
    field: MappingField | undefined,
    subFields: Array<string>,
): string {
    if (!field) {
        return "missing"
    }
    // an object field may omit `type` entirely -- Elasticsearch treats that as `object`
    const parts: Array<string> = [field.type ?? "object"]
    if (field.index === false) {
        parts.push("index:false")
    }
    if (field.enabled === false) {
        parts.push("enabled:false")
    }
    if (subFields.length > 0) {
        const rendered = subFields
            .map((name) => `${name}:${field.fields?.[name]?.type ?? "missing"}`)
            .join(",")
        parts.push(`fields:{${rendered}}`)
    }
    return parts.join(" ")
}

/**
 * Compare a declared mapping against the mapping an index actually carries.
 *
 * Only declared fields are checked. Fields Elasticsearch added dynamically on top of the
 * declaration are legitimate (every mapping in this codebase sets `dynamic: true`) and are ignored.
 *
 * @param params - The declared and live `mappings` blocks.
 * @returns One entry per declared field whose live definition differs; empty when the index matches.
 *
 * @example
 * diffIndexMapping({ declared, live })
 * // [{ field: "suggest", declared: "completion", live: "object" }]
 */
export function diffIndexMapping(
    {
        declared,
        live,
    }: DiffIndexMappingParams,
): Array<IndexMappingDrift> {
    const declaredProperties = readProperties(declared)
    const liveProperties = readProperties(live)
    const drifts: Array<IndexMappingDrift> = []
    for (const [field,
        declaredField] of Object.entries(declaredProperties)) {
        // compare only the multi-fields the declaration itself pins down
        const subFields = Object.keys(declaredField.fields ?? {
        }).sort()
        const declaredSignature = describeField(declaredField,
            subFields)
        const liveSignature = describeField(liveProperties[field],
            subFields)
        if (declaredSignature !== liveSignature) {
            drifts.push({
                field,
                declared: declaredSignature,
                live: liveSignature,
            })
        }
    }
    return drifts
}
