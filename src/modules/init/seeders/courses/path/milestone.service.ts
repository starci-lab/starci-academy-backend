import {
    Injectable,
} from "@nestjs/common"
import {
    CoursePathService,
} from "./course.service"

/**
 * Resolves the milestone mount directory under a course's `milestones/` folder.
 */
@Injectable()
export class MilestonePathService {
    constructor(
        private readonly coursePathService: CoursePathService,
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
}
