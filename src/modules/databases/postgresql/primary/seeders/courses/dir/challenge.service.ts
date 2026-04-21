import type {
    ChallengeDirPathParams,
    ChallengeDirPathResult,
    ChallengeDirIndexesParams,
} from "./types"
import {
    ChallengeDirNameNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import fs from "fs"
import {
    ContentDirService,
} from "./content.service"

/**
 * Resolves indexed content folders under a content’s `challenges/` directory (`{index}-{slug}` or legacy `{index}`).
 */
@Injectable()
export class ChallengeDirService {
    constructor(
        private readonly contentDirService: ContentDirService,
    ) { }

    /**
     * Absolute path to `challenges/` for the given course and module index.
     *
     * @param courseIndex - Course order index on the mount
     * @param moduleIndex - Module order index on the mount
     * @returns Path to the course’s contents directory
     */
    private root(
        courseIndex: number,
        moduleIndex: number,
        contentIndex: number,
    ): string {
        return `${this.contentDirService.path(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
            },
        ).path}/challenges`
    }

    /**
     * Resolves the challenge folder for course, module, and challenge order index.
     */
    path(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
        }: ChallengeDirPathParams,
    ): ChallengeDirPathResult {
        const root = this.root(
            courseIndex,
            moduleIndex,
            contentIndex,
        )
        // list valid `{n}-{slug}` children (validates uniqueness of indices)
        const dirNames = fs.readdirSync(root)
        const dirName = dirNames.find(
            (dirName) => dirName.startsWith(`${challengeIndex}-`),
        )
        if (!dirName) {
            throw new ChallengeDirNameNotFoundException(
                {
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
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
     * Lists challenge folder indices under `challenges/`.
     */
    indexes(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ChallengeDirIndexesParams,
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
