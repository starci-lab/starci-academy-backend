/**
 * Returns a shallow copy of `obj` without the given keys.
 */
export const deleteFields = <
    T extends object,
    K extends keyof T,
>(
        obj: T,
        fields: Array<K>,
    ): Omit<T, K> => {
    const result = {
        ...obj,
    }
    for (const field of fields) {
        delete result[field]
    }
    return result
}
