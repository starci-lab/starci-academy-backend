import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ContentEntity,
    ContentTranslationEntity,
    ContentReferenceEntity,
    ContentReferenceTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"

/**
 * Inserts/updates/deletes content-level tables:
 * contents, content_translations, content_references, content_reference_translations.
 */
@Injectable()
export class ContentInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single content and its direct child tables.
     * Challenges and lessons are NOT handled here.
     */
    async insert(
        content: DeepPartial<ContentEntity>
    ): Promise<void> {
        const contentId = content.id as string

        /** 1. Upsert the content row (strip nested relations) */
        const {
            translations,
            references,
            challenges: _challenges,
            lessons: _lessons,
            module,
            ...rest
        } = content

        await this.upsertService.upsertUuid(
            ContentEntity,
            [{
                ...rest,
                /** Re-attach only the FK reference */
                ...(module ? { module } : {}),
            }],
        )

        /** 2. Upsert content translations */
        if (translations) {
            await this.upsertService.upsertTranslation(
                ContentTranslationEntity,
                translations,
                {
                    contentId
                },
            )
        }

        /** 3. Upsert content references + their translations */
        if (references) {
            for (const reference of references) {
                const {
                    translations: referenceTranslations,
                    ...referenceData
                } = reference
                await this.upsertService.upsertUuid(
                    ContentReferenceEntity,
                    [referenceData],
                )
                if (referenceTranslations?.length) {
                    await this.upsertService.upsertTranslation<ContentReferenceTranslationEntity>(
                        ContentReferenceTranslationEntity,
                        referenceTranslations,
                        { contentReferenceId: reference.id },
                    )
                }
            }
            await this.upsertService.deleteStaleUuid<ContentReferenceEntity>(
                ContentReferenceEntity,
                references.map((reference) => reference.id as string),
                { content: { id: contentId } },
            )
        }
    }

    /**
     * Delete stale contents for a module.
     */
    async deleteStale(
        ids: Array<string>,
        moduleId: string,
    ): Promise<void> {
        await this.upsertService.deleteStaleUuid<ContentEntity>(
            ContentEntity,
            ids,
            { module: { id: moduleId } },
        )
    }
}
