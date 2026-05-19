import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationCategoryEntity,
    FoundationEntity,
} from "@modules/databases"
import {
    RetryService,
} from "@modules/mixin"
import {
    FoundationCategoryInsertService,
    FoundationInsertService,
} from "./inserts"
import {
    FoundationCategoryParserService,
    FoundationParserService,
} from "./parsers"

/**
 * Wraps the full foundations init seed pipeline (parse → upsert per table).
 * Keeps orchestration colocated under `seeders/foundations` instead of `SeedersService`.
 */
@Injectable()
export class FoundationSeederService {
    constructor(
        private readonly foundationCategoryParserService: FoundationCategoryParserService,
        private readonly foundationParserService: FoundationParserService,
        private readonly foundationCategoryInsertService: FoundationCategoryInsertService,
        private readonly foundationInsertService: FoundationInsertService,
        private readonly retryService: RetryService,
    ) { }

    /**
     * Parse foundation markdown sources and upsert PostgreSQL (categories → foundations).
     */
    async seed(): Promise<void> {
        /** The categories to seed. */
        const categories: Array<DeepPartial<FoundationCategoryEntity>> = []
        /** The category results to seed. */
        const categoryResults = await this.foundationCategoryParserService.parseMany()
        /** We push the categories to the array by parsing the category results. */
        for (const categoryResult of categoryResults) {
            categories.push(categoryResult.data)
        }
        /** We parse the foundations for each category. */
        for (const categoryResult of categoryResults) {
            /** The foundations to seed. */
            const foundations: Array<DeepPartial<FoundationEntity>> = []
            /** The foundation results to seed. */
            const foundationResults = await this.foundationParserService.parseMany(
                {
                    categoryRelativePath: categoryResult.relativePath,
                    categoryIndex: categoryResult.index,
                },
            )
            /** We push the foundations to the array by parsing the foundation results. */
            for (const foundationResult of foundationResults) {
                foundations.push(foundationResult.data)
            }

            /** Attach foundations to the current category. */
            const category = categories.find(
                (entry) => entry.id === categoryResult.data.id,
            )
            if (category) {
                category.foundations = foundations
            }
        }

        /** Upsert each category and its children table-by-table. */
        for (const category of categories) {
            const categoryId = category.id as string

            /** 1. Upsert category-level tables */
            await this.retryService.retry({
                action: async () => {
                    await this.foundationCategoryInsertService.insert(category)
                },
            })

            /** 2. Upsert foundation-level tables */
            const foundations = (category.foundations ?? []) as Array<DeepPartial<FoundationEntity>>
            for (const foundation of foundations) {
                /** Inject FK relation so TypeORM populates the category_id column */
                foundation.category = {
                    id: categoryId,
                }
                await this.retryService.retry({
                    action: async () => {
                        await this.foundationInsertService.insert(foundation)
                    },
                })
            }
            /** Delete stale foundations */
            await this.retryService.retry({
                action: async () => {
                    await this.foundationInsertService.deleteStale(
                        foundations.map((foundation) => foundation.id as string),
                        categoryId,
                    )
                },
            })
        }
    }
}
