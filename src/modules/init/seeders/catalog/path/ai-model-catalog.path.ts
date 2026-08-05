import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

@Injectable()
/** Resolves indexed AI model directories under `.mount/data/ai-models/`. */
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
