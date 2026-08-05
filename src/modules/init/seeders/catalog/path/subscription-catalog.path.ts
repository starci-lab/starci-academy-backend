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
/** Resolves indexed subscription tier folders under `.mount/data/subcriptions/`. */
export class SubscriptionCatalogPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) {}

    /** Lists `{index}-{slug}/` folders under the subcriptions mount root. */
    async paths(): Promise<Array<ResolvedFilePath>> {
        const paths = await this.pathResolverService.filePaths(
            "subcriptions",
            "",
        )
        return paths.filter((entry) => !Number.isNaN(entry.orderIndex))
    }
}
