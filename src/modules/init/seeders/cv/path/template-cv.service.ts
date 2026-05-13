import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

/**
 * Resolves indexed template CV mount directories (`{index}-{slug}`) under the data `cv/` root.
 */
@Injectable()
export class TemplateCvPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) { }

    /**
     * The relative path to the CV templates root under the data root.
     */
    public relativePath(): string {
        return ""
    }

    /**
     * Lists template paths under the CV mount root.
     */
    async paths(): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths(
            "cv",
            this.relativePath(),
        )
    }
}
