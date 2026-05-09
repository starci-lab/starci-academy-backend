import {
    Injectable,
} from "@nestjs/common"
import {
    PersonalProjectContextEntity,
} from "../entities"
import {
    Locale,
} from "../enums"

/**
 * Applies locale content resolution to personal project context rows.
 */
@Injectable()
export class PersonalProjectContextResolverService {
    /**
     * Transforms a personal project context row to the requested locale.
     * @param context - The personal project context row to transform.
     * @param locale - The locale to transform the context to.
     * @returns The transformed personal project context row.
     */
    transform(
        context: PersonalProjectContextEntity,
        locale: Locale,
    ): PersonalProjectContextEntity {
        const requested = context.translations?.find(
            (translation) => translation.locale === locale,
        )?.content
        const fallback = context.translations?.find(
            (translation) => translation.locale === Locale.En,
        )?.content ?? ""

        ;(context as PersonalProjectContextEntity & { content?: string }).content =
            requested ?? fallback

        delete (context as Partial<PersonalProjectContextEntity>).translations

        return context
    }
}
