import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
} from "../../shared/path/resolver.service"
import {
    ResolvedFilePath,
} from "../../shared/path/types"
import type {
    ModulePathParams,
} from "./types/module"
import {
    CoursePathService 
} from "./course.service"
    
@Injectable()
/**
 * Resolves indexed module mount directories under a course's `modules/` folder.
 */
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
        return await this.pathResolverService.filePaths("courses", 
            this.relativePath(courseRelativePath)
        )
    }
}


