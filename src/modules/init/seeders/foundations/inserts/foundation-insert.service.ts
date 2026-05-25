import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationEntity,
    FoundationTagEntity,
    FoundationTagTranslationEntity,
    FoundationTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "../../courses"

/**
 * Inserts/updates/deletes foundation-level tables:
 * foundations, foundation_translations, foundation_tags, foundation_tag_translations.
 */
@Injectable()
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

        await this.upsertService.upsertUuid(
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
            await this.upsertService.upsertTranslation(
                FoundationTranslationEntity,
                translations,
                {
                    foundationId,
                },
            )
        }

        /** 3. Upsert foundation tags + their translations */
        if (tags) {
            for (const tag of tags) {
                const {
                    translations: tagTranslations,
                    ...tagData
                } = tag
                await this.upsertService.upsertUuid(
                    FoundationTagEntity,
                    [tagData],
                )
                if (tagTranslations?.length) {
                    await this.upsertService.upsertTranslation<FoundationTagTranslationEntity>(
                        FoundationTagTranslationEntity,
                        tagTranslations,
                        {
                            foundationTagId: tag.id,
                        },
                    )
                }
            }
            await this.upsertService.deleteStaleUuid<FoundationTagEntity>(
                FoundationTagEntity,
                tags.map(
                    (tag: FoundationTagEntity) => tag.id ?? "",
                ),
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
        await this.upsertService.deleteStaleUuid<FoundationEntity>(
            FoundationEntity,
            ids,
            {
                category: {
                    id: categoryId,
                },
            },
        )
    }
}
