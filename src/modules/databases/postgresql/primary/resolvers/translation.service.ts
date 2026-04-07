import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
} from "../enums"
import {
    ResolveTranslationOptions,
} from "../types"


/**
 * Resolves translated values from loaded `translations` arrays (no DB I/O).
 */
@Injectable()
export class TranslationResolverService {
    /**
     * Resolves the value for `field` from `translations`, preferring `locale` then `fallbackLocale`.
     *
     * @param translations - Translations to resolve from.
     * @param field - Field name on the parent entity (e.g. `"title"`, `"content"`).
     * @param locale - Requested locale.
     * @param fallbackLocale - Usually the parent entity's `defaultLocale`.
     * @returns The matching `value`, or `undefined` if neither locale has the field.
     */
    resolve(
        {
            translations,
            field,
            locale,
            fallbackLocale,
        }: ResolveTranslationOptions,
    ): string {
        // if no translations, return empty string
        if (!translations?.length) {
            return ""
        }
        // pick the translation for the given locale
        const pick = (locale: Locale): string | undefined =>
            translations.find(
                (translation) => translation.field === field && translation.locale === locale,
            )?.value       
        // return the translation for the given locale or the fallback locale
        return pick(locale) ?? pick(fallbackLocale) ?? ""
    }
}
