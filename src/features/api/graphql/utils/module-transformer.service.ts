import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    ModuleEntity,
    TranslationResolverService,
} from "@modules/databases"
import {
    ChallengeTransformerService,
} from "./challenge-transformer.service"
import {
    ContentTransformerService,
} from "./content-transformer.service"
import {
    LessonVideoTransformerService,
} from "./lesson-video-transformer.service"
import {
    PreviewContentTransformerService,
} from "./preview-content-transformer.service"

/**
 * Applies loaded translations for a module row and delegates nested entities to focused transformers.
 */
@Injectable()
export class ModuleTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly contentTransformer: ContentTransformerService,
        private readonly lessonVideoTransformer: LessonVideoTransformerService,
        private readonly challengeTransformer: ChallengeTransformerService,
        private readonly previewContentTransformer: PreviewContentTransformerService,
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
                this.contentTransformer.transform(
                    content,
                    locale,
                    fallbackLocale,
                )
                return content
            })
        }

        if (moduleEntity.previewContents?.length) {
            moduleEntity.previewContents = moduleEntity.previewContents.map((previewContent) => {
                this.previewContentTransformer.transform(
                    previewContent,
                    locale,
                    fallbackLocale,
                )
                return previewContent
            })
        }

        if (moduleEntity.lessonVideos?.length) {
            moduleEntity.lessonVideos = moduleEntity.lessonVideos.map((lessonVideo) => {
                this.lessonVideoTransformer.transform(
                    lessonVideo,
                    locale,
                    fallbackLocale,
                )
                return lessonVideo
            })
        }

        if (moduleEntity.challenges?.length) {
            moduleEntity.challenges = moduleEntity.challenges.map((challenge) => {
                this.challengeTransformer.transform(
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
