import {
    Locale,
} from "../enums"

/**
 * Minimal shape shared by all *TranslationEntity rows (locale + field + value).
 */
export interface AbstractTranslation {
    /**
     * Locale of the translation.
     */
    locale: Locale
    /**
     * Target field name being translated.
     */
    field: string
    /**
     * Translated value for the target field.
     */
    value: string
}


/**
 * Options for resolving a translation.
 */
export interface ResolveTranslationOptions {
    /**
     * Translation rows to resolve from.
     */
    translations: ReadonlyArray<AbstractTranslation> | undefined | null
    /**
     * Target field name to resolve.
     */
    field: string
    /**
     * Locale to resolve.
     */
    locale: Locale
    /**
     * Fallback locale to resolve if the target locale is not found.
     */
    fallbackLocale: Locale
}