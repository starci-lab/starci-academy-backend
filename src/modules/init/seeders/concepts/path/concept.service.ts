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
/** Resolves `concepts/<index>-<slug>/` from the active init snapshot. */
export class ConceptPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) {}

    async paths(): Promise<Array<ResolvedFilePath>> {
        return this.pathResolverService.filePaths("concepts",
            "")
    }
}
