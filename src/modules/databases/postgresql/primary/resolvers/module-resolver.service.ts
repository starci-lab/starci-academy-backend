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
    ContentResolverService,
} from "./content-resolver.service"
import {
    PreviewContentResolverService,
} from "./preview-content-resolver.service"

@Injectable()
/**
 * Applies loaded translations for a module row and delegates nested entities to focused resolvers.
 */
export class ModuleResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly contentResolver: ContentResolverService,
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
        delete (moduleEntity as Partial<ModuleEntity>).translations

        moduleEntity.contents = (moduleEntity.contents ?? []).map(
            (content) => {
                this.contentResolver.transform(
                    content,
                    locale,
                    fallbackLocale,
                )
                return content
            },
        )

        if (moduleEntity.previewContents?.length) {
            moduleEntity.previewContents = moduleEntity.previewContents.map(
                (previewContent) => {
                    this.previewContentResolver.transform(
                        previewContent,
                        locale,
                        fallbackLocale,
                    )
                    return previewContent
                })
        }
        return moduleEntity
    }
}
