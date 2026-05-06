import {
    AbstractEntity 
} from "@modules/databases"

/**
 * Sanitize the primitive fields of an object.
 * @param obj - The object to sanitize. It must be an instance of AbstractEntity.
 * @returns The sanitized object.
 */
export const sanitizePrimitiveFields = <T extends AbstractEntity>(
    obj: T
): Omit<T, "createdAt" | "updatedAt" | "id"> => {
    // remove all entries that are key or object
    const sanitized = Object.fromEntries(
        Object.entries(obj).filter(([, value]) => {
            return typeof value !== "object"
        }),
    )
    // remove the id if it is present
    if (sanitized.id) {
        delete sanitized.id
    }
    // remove the createdAt and updatedAt if they are present
    if (sanitized.createdAt) {
        delete sanitized.createdAt
    }
    if (sanitized.updatedAt) {
        delete sanitized.updatedAt
    }
    return sanitized as Omit<T, "createdAt" | "updatedAt" | "id">
}