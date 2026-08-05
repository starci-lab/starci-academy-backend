import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationTagTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-tag-translation.entity"
import {
    FoundationTagEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-tag.entity"
import {
    FoundationTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-translation.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"

@Injectable()
/**
 * Inserts/updates/deletes foundation-level tables:
 * foundations, foundation_translations, foundation_tags, foundation_tag_translations.
 */
export class FoundationInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single foundation and its direct child tables.
     */
    async insert(
        foundation: DeepPartial<FoundationEntity>,
    ): Promise<void> {
        const foundationId = foundation.id as string

        /** 1. Upsert the foundation row (strip nested relations) */
        const {
            translations,
            tags,
            category,
            ...rest
        } = foundation

        await this.upsertService.upsertMany(
            FoundationEntity,
            [{
                ...rest,
                /** Re-attach only the FK reference */
                ...(category ? {
                    category,
                } : {
                }),
            }],
        )

        /** 2. Upsert foundation translations */
        if (translations) {
            await this.upsertService.upsertTranslationMany(
                FoundationTranslationEntity,
                translations,
                {
                    foundationId,
                },
            )
        }

        /** 3. Upsert foundation tags + their translations */
        if (tags) {
            const tagRows: Array<DeepPartial<FoundationTagEntity>> = []
            for (const tag of tags) {
                const {
                    translations: tagTranslations,
                    ...tagData
                } = tag
                tagRows.push(tagData)
                if (tagTranslations?.length) {
                    await this.upsertService.upsertTranslationMany<FoundationTagTranslationEntity>(
                        FoundationTagTranslationEntity,
                        tagTranslations,
                        {
                            foundationTagId: tag.id,
                        },
                    )
                }
            }
            await this.upsertService.upsertMany(
                FoundationTagEntity,
                tagRows,
                {
                    foundation: {
                        id: foundationId,
                    },
                },
            )
        }
    }

    /**
     * Delete stale foundations for a category.
     */
    async deleteStale(
        ids: Array<string>,
        categoryId: string,
    ): Promise<void> {
        await this.upsertService.upsertMany<FoundationEntity>(
            FoundationEntity,
            ids.map((id) => ({
                id,
            })),
            {
                category: {
                    id: categoryId,
                },
            },
        )
    }
}
