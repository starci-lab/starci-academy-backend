/**
 * Remaps a TS string enum to `{ [value]: value }` so Nest `registerEnumType`
 * publishes wire names (`ASC`) instead of identifiers (`Asc`). Without this,
 * `valuesMap` keyed by the enum value would not match schema member names.
 */
export const createEnumType = (
    enumType: object,
): Record<string, string | number> => {
    const lowerCaseEnumType = {
    }
    for (const key in enumType) {
        // lower the first letter of the key
        const lowerCaseKey = enumType[key]
        lowerCaseEnumType[lowerCaseKey] = enumType[key]
    }
    return lowerCaseEnumType
}
