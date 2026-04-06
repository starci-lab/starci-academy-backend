import type {
    CourseDirPathResult,
} from "./types"
import {
    CourseDirNameNotFoundException,
} from "@modules/exceptions"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import fs from "fs"

/**
 * Resolves indexed course mount directories (`{index}-{slug}`) under the data courses root.
 */
@Injectable()
export class CourseDirService {
    /**
     * Absolute path to the courses mount root.
     *
     * @returns Data courses directory
     */
    private root(): string {
        return envConfig().mountPath.data.courses
    }

    /**
     * Resolves the course folder for a given order index.
     *
     * @param courseIndex - Leading index in `{courseIndex}-{slug}` folder names
     * @returns Display slug and absolute course path
     *
     * @example
     * service.path(0)
     */
    path(
        courseIndex: number,
    ): CourseDirPathResult {
        const root = this.root()

        // list valid `{n}-{slug}` children (validates uniqueness of indices)
        const dirNames = fs.readdirSync(root)
        const dirName = dirNames.find(
            (dirName) => dirName.startsWith(`${courseIndex}-`),
        )
        if (!dirName) {
            throw new CourseDirNameNotFoundException(
                {
                    courseIndex,
                },
            )
        }

        // map to consumer shape (displayId = slug segment)
        return {
            displayId: dirName.slice(dirName.indexOf("-") + 1),
            path: `${root}/${dirName}`,
        }
    }

    /**
     * Lists course indexes under the courses mount root.
     *
     * @returns Sorted course indexes
     */
    indexes(): Array<number> {
        return fs.readdirSync(
            this.root()).map(
            (dirName) => {
                const [index] = dirName.split("-")
                return parseInt(index)
            }
        )
    }
}
