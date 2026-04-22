import type {
    LessonVideoDirPathParams,
    LessonVideoDirPathResult,
    LessonVideoDirIndexesParams,
} from "./types"
import {
    LessonVideoDirNameNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import fs from "fs"
import {
    ContentDirService,
} from "./content.service"

/**
 * Resolves indexed content folders under a content’s `lesson-videos/` directory (`{index}-{slug}` or legacy `{index}`).
 */
@Injectable()
export class LessonVideoDirService {
    constructor(
        private readonly contentDirService: ContentDirService,
    ) {}

    /**
     * Absolute path to `lesson-videos/` for the given course and module index.
     *
     * @param courseIndex - Course order index on the mount
     * @param moduleIndex - Module order index on the mount
     * @returns Path to the course’s lesson-videos directory
     */
    private root(
        courseIndex: number,
        moduleIndex: number,
        contentIndex: number,
    ): string {
        return `${
            this.contentDirService.path(
                {
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                },
            ).path}/lesson-videos`
    }

    /**
     * Resolves the lesson-video folder for course, module, and lesson-video order index.
     */
    path(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            lessonVideoIndex,
        }: LessonVideoDirPathParams,
    ): LessonVideoDirPathResult {
        const root = this.root(
            courseIndex,
            moduleIndex,
            contentIndex,
        )
        // list valid `{n}-{slug}` children (validates uniqueness of indices)
        const dirNames = fs.readdirSync(root)
        const dirName = dirNames.find(
            (dirName) => dirName.startsWith(`${lessonVideoIndex}-`),
        )
        if (!dirName) {
            throw new LessonVideoDirNameNotFoundException(
                {
                    courseIndex,
                    moduleIndex,
                    lessonVideoIndex,
                },
            )
        }
        const displayId = dirName.slice(dirName.indexOf("-") + 1)
        return {
            displayId,
            path: `${root}/${dirName}`,
        }
    }
    /**
     * Lists lesson-video folder indices under `lesson-videos/`.
     */
    indexes(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
        }: LessonVideoDirIndexesParams,
    ): Array<number> {
        const root = this.root(
            courseIndex,
            moduleIndex,
            contentIndex,
        )
        if (!fs.existsSync(root)) {
            return []
        }
        return fs.readdirSync(root).map(
            (dirName) => {
                const [index] = dirName.split("-")
                return parseInt(index)
            }
        )
    }
}
