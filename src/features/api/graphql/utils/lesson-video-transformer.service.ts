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
    ) {}

    transform(
        lessonVideo: LessonVideoEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
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
    }
}
