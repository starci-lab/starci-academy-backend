import {
    Injectable,
} from "@nestjs/common"
import {
    LessonVideoEntity,
    Locale,
    TranslationResolverService,
} from "@modules/databases"

/**
 * Applies translations to a lesson video row (GraphQL read path).
 */
@Injectable()
export class LessonVideoTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) { }

    /**
     * Applies translations to a lesson video row.
     * @param lessonVideo - The lesson video entity to transform.
     * @param locale - The locale to transform the lesson video to.
     * @param fallbackLocale - The fallback locale to use if the lesson video's default locale is not available.
     * @returns void.
     */
    transform(
        lessonVideo: LessonVideoEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ) {
        lessonVideo.title = this.translationResolver.resolve(
            {
                translations: lessonVideo.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        )
        lessonVideo.description = this.translationResolver.resolve(
            {
                translations: lessonVideo.translations,
                field: "description",
                locale,
                fallbackLocale,
            },
        )
        const caption = this.translationResolver.resolve(
            {
                translations: lessonVideo.translations,
                field: "caption",
                locale,
                fallbackLocale,
            },
        )
        lessonVideo.caption = caption?.trim()
    }
}
