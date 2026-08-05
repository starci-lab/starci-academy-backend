import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/** One locale-specific markdown extract paired with its locale tag. */
export interface LocaleJson<T extends Record<string, unknown>> {
    /** Parsed JSON from `{locale}.md`. */
    json: T
    /** Locale that produced `json`. */
    locale: Locale
}

/** One translation row emitted beside the canonical (English) scalar fields. */
export interface MergeJsonTranslationRow {
    /** Locale of the translated value. */
    locale: Locale
    /** Translatable field name (dot-path when nested), e.g. `"title"`, `"meta.author"`. */
    field: string
    /** Translated scalar stored on the entity translation table. */
    value: string
}

/**
 * Canonical mount JSON with optional `translations` at every object level -- root
 * and each array item that received locale rows from `translateFields`.
 */
export type MergeJsonResult<T> =
    T extends Array<infer Item>
        ? Array<
            Item extends Record<string, unknown>
                ? MergeJsonResult<Item>
                : Item
        >
        : T extends Record<string, unknown>
            ? {
                [K in keyof T]: MergeJsonResult<T[K]>
            } & {
                /** Locale rows for scalar fields at this level (not inside a child array). */
                translations?: Array<MergeJsonTranslationRow>
            }
            : T

/** Inputs for building one canonical object + `translations` from locale extracts. */
export interface MergeJsonParams<T extends Record<string, unknown>> {
    /** Locale extracts -- English/default locale drives the canonical scalar fields. */
    jsons: Array<LocaleJson<T>>
    /**
     * Dot-paths to translatable scalar leaves, e.g. `"title"`, `"meta.author"`,
     * `"prerequisites.text"`, `"qnas.question"`. Paths through an array attach
     * `translations` on each item (matched by `orderIndex`); others attach on
     * the root `translations` array.
     */
    translateFields: Array<string>
}
