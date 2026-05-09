import {
    Injectable,
} from "@nestjs/common"
import {
    CoursePathService,
} from "./course.service"

/**
 * Resolves the personal-project-context mount directory under a course folder.
 */
@Injectable()
export class PersonalProjectContextPathService {
    constructor(
        private readonly coursePathService: CoursePathService,
    ) {}

    /**
     * The relative path to the personal-project-context root under the course root.
     *
     * @param courseRelativePath - Course relative path
     * @returns Path to the personal-project-context directory under the course root
     */
    public relativePath(
        courseRelativePath: string,
    ): string {
        const coursePath = this.coursePathService.relativePath()
        return `${coursePath}${courseRelativePath}/personal-project-context`
    }
}
