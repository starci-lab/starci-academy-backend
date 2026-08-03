/** Decoded parts of an opaque global id. */
export interface DecodedGlobalId {
    /** Entity class name (e.g. "ContentEntity") — the index namespace. */
    entityName: string
    /** Primary key (UUID) of the entity. */
    id: string
}

/**
 * Encode an entity reference into an opaque global id (Relay-style): base64url of
 * `"<entityName>:<id>"`. The client treats it as opaque and hands it back to
 * {@link fromGlobalId} via the route resolver.
 *
 * @param entityName - Entity class name (the index namespace).
 * @param id - Primary key of the entity.
 * @returns The opaque global id string.
 */
export const toGlobalId = (
    entityName: string,
    id: string,
): string => Buffer.from(`${entityName}:${id}`,
    "utf8").toString("base64url")

/**
 * Decode a global id produced by {@link toGlobalId}. Returns `null` when the
 * token is malformed (bad base64 or missing separator).
 *
 * @param globalId - The opaque global id.
 * @returns The decoded `{ entityName, id }`, or `null` when invalid.
 */
export const fromGlobalId = (
    globalId: string,
): DecodedGlobalId | null => {
    // base64url-decode back to "<entityName>:<id>"; bail on any decode error
    let raw: string
    try {
        raw = Buffer.from(globalId,
            "base64url").toString("utf8")
    } catch {
        return null
    }
    // split on the FIRST colon only — ids never contain a leading colon segment
    const separatorIndex = raw.indexOf(":")
    if (separatorIndex <= 0 || separatorIndex === raw.length - 1) {
        return null
    }
    return {
        entityName: raw.slice(0,
            separatorIndex),
        id: raw.slice(separatorIndex + 1),
    }
}
