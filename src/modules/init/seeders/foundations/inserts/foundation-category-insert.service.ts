import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationCategoryTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category-translation.entity"
import {
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"

@Injectable()
/**
 * Inserts/updates foundation category rows and category_translations.
 * Child foundations are NOT handled here.
 */
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

        await this.upsertService.upsertMany(
            FoundationCategoryEntity,
            [rest],
        )

        /** 2. Upsert category translations */
        if (translations) {
            await this.upsertService.upsertTranslationMany(
                FoundationCategoryTranslationEntity,
                translations,
                {
                    categoryId,
                },
            )
        }
    }
}
