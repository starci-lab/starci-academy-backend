import {
    Injectable,
} from "@nestjs/common"
import {
    ContentEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"
import {
    LessonVideoResolverService,
} from "./lesson-video-resolver.service"
import {
    ChallengeResolverService,
} from "./challenge-resolver.service"

/**
 * Applies translations to a content row and its references.
 */
@Injectable()
export class ContentResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly lessonVideoResolver: LessonVideoResolverService,
        private readonly challengeResolver: ChallengeResolverService,
    ) {}

    transform(
        content: ContentEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        content.title = this.translationResolver.resolve(
            {
                translations: content.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        )
        content.description = this.translationResolver.resolve(
            {
                translations: content.translations,
                field: "description",
                locale,
                fallbackLocale,
            },
        )
        content.body = this.translationResolver.resolve(
            {
                translations: content.translations,
                field: "body",
                locale,
                fallbackLocale,
            },
        )
        const contentFallback = content.defaultLocale ?? fallbackLocale
        if (content.references?.length) {
            content.references = content.references.map((reference) => {
                const refFallback = reference.defaultLocale ?? contentFallback
                const translatedAlias = this.translationResolver.resolve(
                    {
                        translations: reference.translations,
                        field: "alias",
                        locale,
                        fallbackLocale: refFallback,
                    },
                )
                reference.alias = translatedAlias !== ""
                    ? translatedAlias
                    : reference.alias
                return reference
            })
        }
        if (content.lessons?.length) {
            content.lessons = content.lessons.map((lesson) => {
                this.lessonVideoResolver.transform(
                    lesson,
                    locale,
                    contentFallback,
                )
                return lesson
            })
        }
        if (content.challenges?.length) {
            content.challenges = content.challenges.map((challenge) => {
                this.challengeResolver.transform(
                    challenge,
                    locale,
                    contentFallback,
                )
                return challenge
            })
        }
    }
}
