import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
} from "../enums/locale"

/** One locale variant of a personal project context row. */
export interface PersonalProjectContextTranslation {
    /** Locale this variant is written in. */
    locale: Locale
    /** Body text for that locale. */
    content: string
}

/**
 * The shape {@link PersonalProjectContextResolverService} actually reads.
 *
 * Declared here rather than imported because no `PersonalProjectContextEntity`
 * exists: this file imported one from the `../entities` barrel, which resolved
 * (the barrel was there) while never exporting that symbol -- a TS2305 masked by
 * the repo's pre-existing error count and by `diagnostics: false` in ts-jest. It
 * survived at runtime only because the import was erased as a type. Retiring the
 * barrel turned it into a hard TS2307, which is how it finally surfaced.
 */
export interface PersonalProjectContextRow {
    /** Locale variants to resolve against, when the row was loaded with them. */
    translations?: Array<PersonalProjectContextTranslation>
    /** Resolved body text, written by {@link PersonalProjectContextResolverService.transform}. */
    content?: string
}

@Injectable()
/**
 * Applies locale content resolution to personal project context rows.
 */
export class PersonalProjectContextResolverService {
    /**
     * Transforms a personal project context row to the requested locale.
     * @param context - The personal project context row to transform.
     * @param locale - The locale to transform the context to.
     * @returns The transformed personal project context row.
     */
    transform(
        context: PersonalProjectContextRow,
        locale: Locale,
    ): PersonalProjectContextRow {
        const requested = context.translations?.find(
            (translation) => translation.locale === locale,
        )?.content
        const fallback = context.translations?.find(
            (translation) => translation.locale === Locale.En,
        )?.content ?? ""

        context.content = requested ?? fallback

        delete context.translations

        return context
    }
}
