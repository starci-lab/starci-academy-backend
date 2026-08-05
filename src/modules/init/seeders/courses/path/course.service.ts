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
 * Resolves indexed course mount directories (`{index}-{slug}`) under the data courses root.
 */
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


