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
     * @returns The matching `value`, or empty string if neither locale has the field.
     */
    resolve(
        {
            translations,
            field,
            locale,
            fallbackLocale,
        }: ResolveTranslationOptions,
    ): string {
        if (!translations?.length) {
            return ""
        }
        const pick = (targetLocale: Locale): string | undefined =>
            translations.find(
                (translation) => translation.field === field && translation.locale === targetLocale,
            )?.value
        return pick(locale) ?? pick(fallbackLocale) ?? ""
    }
}
