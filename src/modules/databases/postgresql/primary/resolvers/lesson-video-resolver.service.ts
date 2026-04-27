import {
    Injectable,
} from "@nestjs/common"
import {
    LessonVideoEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

/**
 * Applies translations to a lesson video row.
 */
@Injectable()
export class LessonVideoResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) { }

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
        delete (lessonVideo as Partial<LessonVideoEntity>).translations
    }
}
