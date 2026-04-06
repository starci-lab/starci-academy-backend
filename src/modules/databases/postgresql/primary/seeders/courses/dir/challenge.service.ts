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
    ModuleDirService,
} from "./module.service"

/**
 * Resolves indexed content folders under a module’s `contents/` directory (`{index}-{slug}` or legacy `{index}`).
 */
@Injectable()
export class ChallengeDirService {
    constructor(
        private readonly moduleDirService: ModuleDirService,
    ) {}

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
    ): string {
        return `${this.moduleDirService.path(
            {
                courseIndex,
                moduleIndex,
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
            challengeIndex,
        }: ChallengeDirPathParams,
    ): ChallengeDirPathResult {
        const root = this.root(
            courseIndex,
            moduleIndex,
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
                    challengeIndex,
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
     * Lists challenge folder indices under `challenges/`.
     */
    indexes(
        {
            courseIndex,
            moduleIndex,
        }: ChallengeDirIndexesParams,
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
