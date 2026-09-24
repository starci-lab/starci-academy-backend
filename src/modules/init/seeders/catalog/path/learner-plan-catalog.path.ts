import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
} from "../../shared/path/resolver.service"
import type {
    ResolvedFilePath,
} from "../../shared/path/types"

@Injectable()
/** Resolves ordered learner-plan folders from the data gitmount. */
export class LearnerPlanCatalogPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) {}

    async paths(): Promise<Array<ResolvedFilePath>> {
        return (await this.pathResolverService.filePaths("learner-plans",
            ""))
            .filter((entry) => !Number.isNaN(entry.orderIndex))
    }
}
