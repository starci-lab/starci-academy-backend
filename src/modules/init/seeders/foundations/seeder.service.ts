import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    FoundationCategoryInsertService,
} from "./inserts/foundation-category-insert.service"
import {
    FoundationInsertService,
} from "./inserts/foundation-insert.service"
import {
    FoundationCategoryParserService,
} from "./parsers/foundation-category.service"
import {
    FoundationParserService,
} from "./parsers/foundation.service"
import {
    SeedScopeService,
} from "../../scope/seed-scope.service"

@Injectable()
/**
 * Wraps the full foundations init seed pipeline (parse -> upsert per table).
 * Keeps orchestration colocated under `seeders/foundations` instead of `SeedersService`.
 */
export class FoundationSeederService {
    constructor(
        private readonly foundationCategoryParserService: FoundationCategoryParserService,
        private readonly foundationParserService: FoundationParserService,
        private readonly foundationCategoryInsertService: FoundationCategoryInsertService,
        private readonly foundationInsertService: FoundationInsertService,
        private readonly seedScopeService: SeedScopeService,
    ) { }

    /**
     * Parse foundation markdown sources and upsert PostgreSQL (categories -> foundations).
     */
    async seed(): Promise<void> {
        if (!this.seedScopeService.isFoundationsSeederEnabled()) {
            return
        }
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
            await this.foundationCategoryInsertService.insert(category)

            /** 2. Upsert foundation-level tables */
            const foundations = (category.foundations ?? []) as Array<DeepPartial<FoundationEntity>>
            for (const foundation of foundations) {
                /** Inject FK relation so TypeORM populates the category_id column */
                foundation.category = {
                    id: categoryId,
                }
                await this.foundationInsertService.insert(foundation)
            }
        }
    }
}
