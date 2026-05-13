import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

/**
 * Resolves indexed course mount directories (`{index}-{slug}`) under the data courses root.
 */
@Injectable()
export class CoursePathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) { }

    /**
     * The relative path to the courses root under the data root.
     */
    public relativePath(
    ): string {
        return ""
    }

    /**
     * Lists course paths under the courses mount root.
     *
     * @returns Paths of the courses in the data
     */
    async paths(): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths("courses", 
            this.relativePath()
        )
    }
}


