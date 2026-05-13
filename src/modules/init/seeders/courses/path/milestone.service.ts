import {
    Injectable,
} from "@nestjs/common"
import {
    CoursePathService,
} from "./course.service"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

/**
 * Resolves the milestone mount directory under a course's `milestones/` folder.
 */
@Injectable()
export class MilestonePathService {
    constructor(
        private readonly coursePathService: CoursePathService,
        private readonly pathResolverService: PathResolverService,
    ) {}

    /**
     * The relative path to the milestone root under the course root.
     *
     * @param courseRelativePath - Course relative path
     * @returns Path to the milestones directory under the course root
     */
    public relativePath(
        courseRelativePath: string,
    ): string {
        const coursePath = this.coursePathService.relativePath()
        return `${coursePath}${courseRelativePath}/milestones`
    }

    /**
     * Finds paths for all milestones under a given course.
     */
    public async paths({
        courseRelativePath,
    }): Promise<Array<ResolvedFilePath>> {
        const basePath = this.relativePath(courseRelativePath)
        const dirs = await this.pathResolverService.filePaths("courses",
            basePath)
        return dirs
            .filter((d) => /^\d+$/.test(String(d.orderIndex)))
            .sort((a, b) => a.orderIndex - b.orderIndex)
    }
}


