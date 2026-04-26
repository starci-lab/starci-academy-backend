import {
    Injectable,
} from "@nestjs/common"
import {
    ModuleEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"
import {
    ChallengeResolverService,
} from "./challenge-resolver.service"
import {
    ContentResolverService,
} from "./content-resolver.service"
import {
    LessonVideoResolverService,
} from "./lesson-video-resolver.service"
import {
    PreviewContentResolverService,
} from "./preview-content-resolver.service"

/**
 * Applies loaded translations for a module row and delegates nested entities to focused resolvers.
 */
@Injectable()
export class ModuleResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly contentResolver: ContentResolverService,
        private readonly lessonVideoResolver: LessonVideoResolverService,
        private readonly challengeResolver: ChallengeResolverService,
        private readonly previewContentResolver: PreviewContentResolverService,
    ) {}

    transform(
        moduleEntity: ModuleEntity,
        locale: Locale,
    ): ModuleEntity {
        const fallbackLocale = moduleEntity.defaultLocale ?? Locale.En

        moduleEntity.title = this.translationResolver.resolve(
            {
                translations: moduleEntity.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        )
        moduleEntity.description = this.translationResolver.resolve(
            {
                translations: moduleEntity.translations,
                field: "description",
                locale,
                fallbackLocale,
            },
        )

        if (moduleEntity.contents?.length) {
            moduleEntity.contents = moduleEntity.contents.map((content) => {
                this.contentResolver.transform(
                    content,
                    locale,
                    fallbackLocale,
                )
                return content
            })
        }

        if (moduleEntity.previewContents?.length) {
            moduleEntity.previewContents = moduleEntity.previewContents.map((previewContent) => {
                this.previewContentResolver.transform(
                    previewContent,
                    locale,
                    fallbackLocale,
                )
                return previewContent
            })
        }

        if (moduleEntity.lessonVideos?.length) {
            moduleEntity.lessonVideos = moduleEntity.lessonVideos.map((lessonVideo) => {
                this.lessonVideoResolver.transform(
                    lessonVideo,
                    locale,
                    fallbackLocale,
                )
                return lessonVideo
            })
        }

        if (moduleEntity.challenges?.length) {
            moduleEntity.challenges = moduleEntity.challenges.map((challenge) => {
                this.challengeResolver.transform(
                    challenge,
                    locale,
                    fallbackLocale,
                )
                return challenge
            })
        }

        return moduleEntity
    }
}
