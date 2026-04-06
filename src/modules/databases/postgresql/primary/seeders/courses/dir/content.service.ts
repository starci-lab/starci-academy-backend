import type {
    ContentDirIndexesParams,
    ContentDirPathParams,
    ContentDirPathResult,
} from "./types"
import {
    ContentDirNameNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import fs from "fs"
import {
    ModuleDirService,
} from "./module.service"

/**
 * Resolves indexed content folders under a module’s `contents/` directory (`{index}-{slug}` or legacy `{index}`).
 */
@Injectable()
export class ContentDirService {
    constructor(
        private readonly moduleDirService: ModuleDirService,
    ) {}

    /**
     * Absolute path to `contents/` for the given course and module index.
     *
     * @param courseIndex - Course order index on the mount
     * @param moduleIndex - Module order index on the mount
     * @returns Path to the course’s contents directory
     */
    private root(
        courseIndex: number,
        moduleIndex: number,
    ): string {
        return `${this.moduleDirService.path(
            {
                courseIndex,
                moduleIndex,
            },
        ).path}/contents`
    }

    /**
     * Resolves the content folder for course, module, and content order index.
     */
    path(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ContentDirPathParams,
    ): ContentDirPathResult {
        const root = this.root(
            courseIndex,
            moduleIndex,
        )
        // list valid `{n}-{slug}` children (validates uniqueness of indices)
        const dirNames = fs.readdirSync(root)
        const dirName = dirNames.find(
            (dirName) => dirName.startsWith(`${contentIndex}-`),
        )
        if (!dirName) {
            throw new ContentDirNameNotFoundException(
                {
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                },
            )
        }
        const displayId = dirName.split("-")[1]
        return {
            displayId,
            path: `${root}/${dirName}`,
        }
    }
    /**
     * Lists content folder indices under `contents/`.
     */
    indexes(
        {
            courseIndex,
            moduleIndex,
        }: ContentDirIndexesParams,
    ): Array<number> {
        return fs.readdirSync(
            this.root(
                courseIndex,
                moduleIndex,
            )).map(
            (dirName) => {
                const [index] = dirName.split("-")
                return parseInt(index)
            }
        )
    }
}
