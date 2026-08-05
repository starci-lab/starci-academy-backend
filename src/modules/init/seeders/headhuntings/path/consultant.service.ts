import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"
import {
    HeadhuntingCompanyPathService,
} from "./headhunting-company.service"
import {
    HEADHUNTINGS_MOUNT_DIR,
} from "./constants"
import type {
    ConsultantPathParams,
} from "./types"

/** Subfolder under each company that holds headhunting profiles. */
const CONSULTANTS_ITEMS_DIR = "consultants"

@Injectable()
/**
 * Resolves indexed headhunter folders under `{company}/consultants/{index}-{slug}/`.
 */
export class ConsultantPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
        private readonly headhuntingCompanyPathService: HeadhuntingCompanyPathService,
    ) {}

    /**
     * Relative path to headhunter items under a company root.
     */
    public relativePath(
        companyRelativePath: string,
    ): string {
        const companyRoot = this.headhuntingCompanyPathService.relativePath()
        return `${companyRoot}${companyRelativePath}/${CONSULTANTS_ITEMS_DIR}`
    }

    /**
     * Paths of headhunter folders under `{company}/consultants/`.
     */
    async paths(
        {
            companyRelativePath,
        }: ConsultantPathParams,
    ): Promise<Array<ResolvedFilePath>> {
        const paths = await this.pathResolverService.filePaths(
            HEADHUNTINGS_MOUNT_DIR,
            this.relativePath(companyRelativePath),
        )
        return paths.filter((entry) => !Number.isNaN(entry.orderIndex))
    }
}
