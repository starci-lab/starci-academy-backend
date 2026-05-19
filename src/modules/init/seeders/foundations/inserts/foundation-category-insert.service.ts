import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationCategoryEntity,
    FoundationCategoryTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "../../courses"

/**
 * Inserts/updates foundation category rows and category_translations.
 * Child foundations are NOT handled here.
 */
@Injectable()
export class FoundationCategoryInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert one category and its translations.
     */
    async insert(
        category: DeepPartial<FoundationCategoryEntity>,
    ): Promise<void> {
        const categoryId = category.id as string

        /** 1. Upsert the category row (strip nested relations) */
        const {
            translations,
            ...rest
        } = category

        await this.upsertService.upsertUuid(
            FoundationCategoryEntity,
            [rest],
        )

        /** 2. Upsert category translations */
        if (translations) {
            await this.upsertService.upsertTranslation(
                FoundationCategoryTranslationEntity,
                translations,
                {
                    categoryId,
                },
            )
        }
    }
}
