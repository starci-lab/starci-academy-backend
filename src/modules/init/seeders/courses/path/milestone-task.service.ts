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
/**
 * Resolves the milestone-tasks mount directory under a milestone folder.
 */
export class MilestoneTaskPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) { }

    /**
     * Resolves the relative path to tasks under a milestone.
     */
    public relativePath(
        courseRelativePath: string,
        milestoneRelativePath: string,
    ): string {
        return `${milestoneRelativePath}/tasks`
    }

    /**
     * Finds paths for all tasks under a given milestone.
     */
    public async paths({
        milestoneRelativePath,
    }): Promise<Array<ResolvedFilePath>> {
        const basePath = `${milestoneRelativePath}/tasks`
        const dirs = await this.pathResolverService.filePaths("courses",
            basePath)
        return dirs
            .filter((d) => /^\d+$/.test(String(d.orderIndex)))
            .sort((a, b) => a.orderIndex - b.orderIndex)
    }
}



