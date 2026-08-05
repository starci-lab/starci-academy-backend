import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
} from "../../shared/path/resolver.service"
import {
    ResolvedFilePath,
} from "../../shared/path/types"
import {
    HEADHUNTINGS_MOUNT_DIR,
} from "./constants"

@Injectable()
/**
 * Resolves indexed headhunting company directories under `.mount/data/headhuntings/`.
 */
export class HeadhuntingCompanyPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) {}

    /**
     * Relative path inside the data mount for companies (root of `headhuntings/`).
     */
    public relativePath(): string {
        return ""
    }

    /**
     * Lists company directories (`{index}-{slug}/`) under the mount root.
     */
    async paths(): Promise<Array<ResolvedFilePath>> {
        const paths = await this.pathResolverService.filePaths(
            HEADHUNTINGS_MOUNT_DIR,
            this.relativePath(),
        )
        return paths.filter((entry) => !Number.isNaN(entry.orderIndex))
    }
}
