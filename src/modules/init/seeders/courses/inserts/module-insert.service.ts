import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ModuleEntity,
    ModuleTranslationEntity,
    PreviewContentEntity,
    PreviewContentTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"

/**
 * Inserts/updates/deletes module-level tables:
 * modules, module_translations, preview_contents, preview_content_translations.
 */
@Injectable()
export class ModuleInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single module and all its direct child tables.
     * Contents/challenges/lessons are NOT handled here.
     */
    async insert(
        module: DeepPartial<ModuleEntity>
    ): Promise<void> {
        const moduleId = module.id as string

        /** 1. Upsert the module row (strip nested relations) */
        const {
            translations,
            previewContents,
            contents: _contents,
            ...rest
        } = module

        await this.upsertService.upsertUuid(
            ModuleEntity,
            [rest],
        )

        /** 2. Upsert module translations */
        if (translations) {
            await this.upsertService.upsertTranslation(
                ModuleTranslationEntity,
                translations,
                { moduleId },
            )
        }

        /** 3. Upsert preview contents + their translations */
        if (previewContents) {
            for (const previewContent of previewContents) {
                const {
                    translations: previewContentTranslations,
                    ...previewContentData
                } = previewContent
                await this.upsertService.upsertUuid(
                    PreviewContentEntity,
                    [previewContentData],
                )
                if (previewContentTranslations?.length) {
                    await this.upsertService.upsertTranslation<PreviewContentTranslationEntity>(
                        PreviewContentTranslationEntity,
                        previewContentTranslations,
                        { previewContentId: previewContent.id },
                    )
                }
            }
            await this.upsertService.deleteStaleUuid<PreviewContentEntity>(
                PreviewContentEntity,
                (previewContents as Array<DeepPartial<PreviewContentEntity>>).map((previewContent) => previewContent.id as string),
                { module: { id: moduleId } },
            )
        }
    }

    /**
     * Delete stale modules for a course.
     */
    async deleteStale(
        ids: Array<string>,
        courseId: string,
    ): Promise<void> {
        await this.upsertService.deleteStaleUuid<ModuleEntity>(
            ModuleEntity,
            ids,
            { course: { id: courseId } },
        )
    }
}
