import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    ModuleEntity,
    TranslationResolverService,
} from "@modules/databases"

/**
 * Applies loaded `translations` onto base fields for a module tree.
 *
 * Mutates the passed entities in-place (safe for request-scoped GraphQL reads).
 */
@Injectable()
export class ModuleTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
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
                content.title = this.translationResolver.resolve(
                    {
                        translations: content.translations,
                        field: "title",
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
                return content
            })
        }

        if (moduleEntity.previewContents?.length) {
            moduleEntity.previewContents = moduleEntity.previewContents.map((previewContent) => {
                previewContent.data = this.translationResolver.resolve(
                    {
                        translations: previewContent.translations,
                        field: "data",
                        locale,
                        fallbackLocale,
                    },
                )
                return previewContent
            })
        }

        if (moduleEntity.lessonVideos?.length) {
            moduleEntity.lessonVideos = moduleEntity.lessonVideos.map((lessonVideo) => {
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
                return lessonVideo
            })
        }

        return moduleEntity
    }
}

