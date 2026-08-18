import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/** A Vietnamese/English pair of the same value, to be resolved by recipient locale. */
export interface LocaleVariants<T> {
    vi: T
    en: T
}

/**
 * Pick the Vietnamese or English variant of a value by locale.
 *
 * Used to localize email subject lines (the body copy is localized inside the
 * Pug template via the `locale` context var). Defaults to English for any
 * non-Vietnamese locale so a missing/unknown locale never blanks the subject.
 *
 * @param locale - The recipient locale, may be undefined.
 * @param variants - The `{ vi, en }` pair to choose from.
 * @returns The localized value.
 */
export const pickLocale = <T>(
    locale: Locale | undefined | null,
    variants: LocaleVariants<T>,
): T => (locale === Locale.Vi ? variants.vi : variants.en)
