import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

/** Resolves indexed AI model directories under `.mount/data/ai-models/`. */
@Injectable()
export class AiModelCatalogPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) {}

    /** Lists `{index}-{slug}/` folders under the ai-models mount root. */
    async paths(): Promise<Array<ResolvedFilePath>> {
        const paths = await this.pathResolverService.filePaths(
            "ai-models",
            "",
        )
        return paths.filter((entry) => !Number.isNaN(entry.orderIndex))
    }
}
