import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

/**
 * Resolves indexed foundation category directories under `.mount/data/foundations/`.
 */
@Injectable()
export class FoundationCategoryPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) {}

    /**
     * Relative path inside the data mount for foundation categories.
     */
    public relativePath(): string {
        return ""
    }

    /**
     * Lists category directories (`{index}-{slug}/`) under the foundations mount root.
     */
    async paths(): Promise<Array<ResolvedFilePath>> {
        const paths = await this.pathResolverService.filePaths(
            "foundations",
            this.relativePath(),
        )
        return paths.filter((entry) => !Number.isNaN(entry.orderIndex))
    }
}
