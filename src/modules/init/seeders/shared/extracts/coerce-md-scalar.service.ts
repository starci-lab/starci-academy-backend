import {
    Injectable,
} from "@nestjs/common"

@Injectable()
/**
 * Coerce markdown-extracted scalar values (often strings) into DB-friendly types.
 *
 * Note: The markdown extractor returns leaf bodies as raw strings. A markdown body of `null`
 * becomes the string `"null"`, which must be converted to SQL NULL for nullable DB columns.
 */
export class CoerceMdScalarService {
    /**
     * Convert a value into a SQL nullable string value (string or null).
     */
    toNullableString(
        value: unknown,
    ): string | undefined {
        if (
            value === null ||
            value === undefined
        ) {
            return undefined
        }
        if (typeof value === "string") {
            const t = value.trim()
            if (
                t === "" ||
                t.toLowerCase() === "null"
            ) {
                return undefined
            }
            return t
        }
        return undefined
    }

    /**
     * Convert a value into a required string value (string or fallback).
     */
    toRequiredString(
        value: unknown,
        fallback: string,
    ): string {
        return this.toNullableString(value) ?? fallback
    }

    /**
     * Convert a value into a SQL nullable string column value (string or null).
     */
    toNullableStringColumn(
        value: unknown,
    ): string | null {
        return this.toNullableString(value) ?? null
    }

    /**
     * Convert a value into a SQL nullable numeric value (number or null).
     */
    toNullableNumber(
        value: unknown,
    ): number | undefined {
        if (
            value === null ||
            value === undefined
        ) {
            return undefined
        }
        if (typeof value === "number") {
            return Number.isFinite(value) ? value : undefined
        }
        if (typeof value === "string") {
            const t = value.trim().toLowerCase()
            if (
                t === "" ||
                t === "null"
            ) {
                return undefined
            }
            const n = Number(t)
            return Number.isFinite(n) ? n : undefined
        }
        return undefined
    }

    /**
     * Convert a value into a required numeric value (number or fallback).
     */
    toRequiredNumber(
        value: unknown,
        fallback: number,
    ): number {
        return this.toNullableNumber(value) ?? fallback
    }

    /**
     * Convert a value into a SQL nullable numeric column value (number or null).
     */
    toNullableNumericColumn(
        value: unknown,
    ): number | null {
        const n = this.toNullableNumber(value)
        return n ?? null
    }

    /**
     * Unsafe enum cast (no validation). Prefer `toNullableEnum` / `toRequiredEnum`.
     */
    unsafeToEnum<T>(
        value: unknown,
    ): T {
        return value as T
    }

    /**
     * Convert a markdown scalar into an enum value (validated).
     *
     * Accepts either:
     * - Enum key: `"RawStream"` (works well with TS string enums)
     * - Enum value: `"rawStream"`
     *
     * Returns `undefined` for `null` / `""` / `"null"` or when no match.
     */
    toNullableEnum<
        TEnum extends Record<string, string | number>,
    >(
        value: unknown,
        enumObject: TEnum,
    ): TEnum[keyof TEnum] | undefined {
        const asString = this.toNullableString(value)
        if (!asString) {
            return undefined
        }

        // match by key (case-sensitive)
        if (asString in enumObject) {
            return enumObject[
                asString as keyof TEnum
            ] as TEnum[keyof TEnum]
        }

        // match by value (string or number)
        const values = Object.values(enumObject)
        const exact = values.find((v) => v === asString)
        if (exact !== undefined) {
            return exact as TEnum[keyof TEnum]
        }

        // allow numeric enums written as strings
        const maybeNumber = Number(asString)
        if (Number.isFinite(maybeNumber)) {
            const numMatch = values.find((v) => v === maybeNumber)
            if (numMatch !== undefined) {
                return numMatch as TEnum[keyof TEnum]
            }
        }

        return undefined
    }

    toRequiredEnum<
        TEnum extends Record<string, string | number>,
    >(
        value: unknown,
        enumObject: TEnum,
        fallback: TEnum[keyof TEnum],
    ): TEnum[keyof TEnum] {
        return this.toNullableEnum(
            value,
            enumObject,
        ) ?? fallback
    }

    /**
     * Convert a value into a nullable boolean.
     * Accepts `true`/`false` strings (case-insensitive), booleans, `1`/`0`.
     */
    toNullableBoolean(
        value: unknown,
    ): boolean | undefined {
        if (value === true || value === false) {
            return value
        }
        if (typeof value === "number") {
            if (value === 1) {
                return true
            }
            if (value === 0) {
                return false
            }
            return undefined
        }
        if (typeof value === "string") {
            const t = value.trim().toLowerCase()
            if (t === "true" || t === "1") return true
            if (t === "false" || t === "0") return false
        }
        return undefined
    }

    /**
     * Convert a value into a required boolean (boolean or fallback).
     */
    toRequiredBoolean(
        value: unknown,
        fallback: boolean,
    ): boolean {
        return this.toNullableBoolean(value) ?? fallback
    }

    /**
     * Convert a markdown scalar (e.g. a `# verified` day like `2026-05-30`) into a Date, or null
     * for `null` / `""` / `"null"` / an unparseable value.
     */
    toNullableDate(
        value: unknown,
    ): Date | null {
        const asString = this.toNullableString(value)
        if (!asString) {
            return null
        }
        // parse the ISO-ish day string; reject NaN dates so bad markdown becomes SQL NULL
        const parsed = new Date(asString)
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }
}
