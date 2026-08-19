import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/** Maps a locale code to the full language name injected into a grading prompt. */
const LOCALE_LANGUAGE_MAP: Record<string, string> = {
    [Locale.En]: "English",
    [Locale.Vi]: "Vietnamese (Tiếng Việt)",
}

/**
 * Resolve the human-readable language name a grading prompt should be written in, shared by the
 * git, Google-Docs, and milestone-task grade steps. Defaults an absent locale to {@link Locale.En}
 * before the lookup, and falls back to "English" for any locale the map does not recognize --
 * identical to each grade step's own (formerly duplicated) inline map.
 *
 * @param locale - The payload's locale, possibly absent.
 * @returns The resolved language name.
 */
export const resolveTargetLanguage = (
    locale: Locale | undefined,
): string => {
    const resolvedLocale = locale ?? Locale.En
    return LOCALE_LANGUAGE_MAP[resolvedLocale] ?? "English"
}
