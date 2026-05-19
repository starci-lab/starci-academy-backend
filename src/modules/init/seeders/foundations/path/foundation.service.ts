import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"
import type {
    FoundationPathParams,
} from "./types"
import {
    FoundationCategoryPathService,
} from "./foundation-category.service"

/** Subfolder under each category that holds foundation items (`0-docker/foundations/`). */
const FOUNDATIONS_ITEMS_DIR = "foundations"

/**
 * Resolves indexed foundation item folders under a category’s `foundations/` folder
 * (`{category}/foundations/{index}-{slug}/`), mirroring `ModulePathService` + `modules/`.
 */
@Injectable()
export class FoundationPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
        private readonly foundationCategoryPathService: FoundationCategoryPathService,
    ) {}

    /**
     * Relative path to foundation items under a category root.
     */
    public relativePath(
        categoryRelativePath: string,
    ): string {
        const categoryRoot = this.foundationCategoryPathService.relativePath()
        return `${categoryRoot}${categoryRelativePath}/${FOUNDATIONS_ITEMS_DIR}`
    }

    /**
     * Paths of foundation item folders under `{category}/foundations/`.
     */
    async paths(
        {
            categoryRelativePath,
        }: FoundationPathParams,
    ): Promise<Array<ResolvedFilePath>> {
        const paths = await this.pathResolverService.filePaths(
            "foundations",
            this.relativePath(categoryRelativePath),
        )
        return paths.filter((entry) => !Number.isNaN(entry.orderIndex))
    }
}
