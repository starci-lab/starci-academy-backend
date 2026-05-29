import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
} from "./resolver.service"
import type {
    ModulePathParams,
    ResolvedFilePath,
} from "./types"
import {
    CoursePathService 
} from "./course.service"
    
/**
 * Resolves indexed module mount directories under a course’s `modules/` folder.
 */
@Injectable()
export class ModulePathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
        private readonly coursePathService: CoursePathService,
    ) {}

    /**
     * The relative path to the module root under the course root.
     *
     * @param courseRelativePath - Course relative path
     * @returns Path to the module root under the course root
     */
    public relativePath(
        courseRelativePath: string,
    ): string {
        const coursePath = this.coursePathService.relativePath()
        return `${coursePath}${courseRelativePath}/modules`
    }

    /**
     * Paths of the modules in the course.
     *
     * @param courseRelativePath - Course relative path
     * @returns Paths of the modules in the course
     * @returns Paths of the modules in the course
     */
    async paths(
        {
            courseRelativePath,
        }: ModulePathParams,
    ): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths(
            this.relativePath(courseRelativePath)
        )
    }
}
