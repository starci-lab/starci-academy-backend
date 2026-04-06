import type {
    ModuleDirPathParams,
    ModuleDirPathResult,
} from "./types"
import {
    ModuleDirNameNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    CourseDirService,
} from "./course.service"
import fs from "fs"

/**
 * Resolves indexed module mount directories under a course’s `modules/` folder.
 */
@Injectable()
export class ModuleDirService {
    constructor(
        private readonly courseDirService: CourseDirService,
    ) {}

    /**
     * Absolute path to `modules/` for the given course index.
     *
     * @param courseIndex - Course order index on the mount
     * @returns Path to the course’s modules directory
     */
    private root(
        courseIndex: number,
    ): string {
        return `${this.courseDirService.path(courseIndex).path}/modules`
    }

    /**
     * Resolves the module folder for a course and module order index.
     *
     * @param param - Course and module indices
     * @returns Display slug and absolute module path
     *
     * @example
     * service.path({ courseIndex: 0, moduleIndex: 1 })
     */
    path(
        {
            courseIndex,
            moduleIndex,
        }: ModuleDirPathParams,
    ): ModuleDirPathResult {
        const root = this.root(
            courseIndex,
        )
        // list valid `{n}-{slug}` children (validates uniqueness of indices)
        const dirNames = fs.readdirSync(root)
        const dirName = dirNames.find(
            (dirName) => dirName.startsWith(`${moduleIndex}-`),
        )
        if (!dirName) {
            throw new ModuleDirNameNotFoundException(
                {
                    courseIndex,
                    moduleIndex,
                },
            )
        }
        return {
            displayId: dirName.split("-")[1],
            path: `${root}/${dirName}`,
        }
    }
}
