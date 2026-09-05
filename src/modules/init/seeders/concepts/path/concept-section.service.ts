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
/** Resolves ordered section folders below one concept mount folder. */
export class ConceptSectionPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) {}

    async paths(conceptRelativePath: string): Promise<Array<ResolvedFilePath>> {
        return this.pathResolverService.filePaths(
            "concepts",
            `${conceptRelativePath}/sections`,
        )
    }
}
