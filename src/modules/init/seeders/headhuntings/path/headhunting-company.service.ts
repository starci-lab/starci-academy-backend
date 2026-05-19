import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

/** Mount folder name under `.mount/data/`. */
export const HEADHUNTINGS_MOUNT_DIR = "headhuntings"

/**
 * Resolves indexed headhunting company directories under `.mount/data/headhuntings/`.
 */
@Injectable()
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
