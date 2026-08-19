/**
 * Type guard for values whose `String()` conversion is meaningful -- i.e.
 * never collapses to the default Object stringification `"[object Object]"`.
 *
 * A `typeof value === "object"` check on an `unknown` does NOT let TypeScript
 * narrow the *other* branch away from objects: `unknown` isn't a union, so
 * negative typeof narrowing only removes `null` from it, leaving the
 * remaining type effectively `{} | undefined` -- objects and arrays are
 * still admitted by the type checker even though the runtime guard already
 * excluded them. Sonar's `String()`-stringification rule (S6551) reads that
 * static type, not the runtime guard, so it keeps firing on code that is
 * actually safe.
 *
 * Listing every non-object `typeof` branch here narrows POSITIVELY instead,
 * which TypeScript does track correctly -- callers get a type-checker-backed
 * guarantee (not just a runtime one) that `String(value)` never sees an
 * object.
 *
 * @param value - The value to test.
 * @returns Whether `value` is a primitive (or function) `String()` handles meaningfully.
 */
export const isStringifiablePrimitive = (
    value: unknown,
): value is string | number | boolean | bigint | symbol | undefined | ((...args: Array<unknown>) => unknown) => (
    typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
    || typeof value === "bigint"
    || typeof value === "symbol"
    || value === undefined
    || typeof value === "function"
)
