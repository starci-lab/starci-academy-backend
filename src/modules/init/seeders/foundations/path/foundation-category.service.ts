import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
} from "../../shared/path/resolver.service"
import {
    ResolvedFilePath,
} from "../../shared/path/types"

@Injectable()
/**
 * Resolves indexed foundation category directories under `.mount/data/foundations/`.
 */
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
