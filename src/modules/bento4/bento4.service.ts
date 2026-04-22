// @ts-nocheck
import {
    pathsConfig 
} from "@config"
import {
    Injectable, Logger 
} from "@nestjs/common"
import {
    join 
} from "path"
import {
    execaCommand 
} from "execa"

/**
 * Bento4 service.
 */
@Injectable()
export class Bento4Service {
    private readonly logger = new Logger(Bento4Service.name)

    /**
     * Check if video has fragments.
     * @param assetId - Asset ID.
     * @param videoName - Video name.
     * @returns True if video has fragments, false otherwise.
     */
    async checkFragments(assetId: string, videoName: string) {
        const videoPath = join(
            pathsConfig().processMpegDashTasksDirectory,
            assetId,
            videoName,
        )

        const { stdout, stderr } = await execaCommand(
            `mp4info "${videoPath}"`,
            {
                shell: true 
            }
        )
        const execResult = stdout || stderr
        const lines = execResult.split("\n")

        for (const line of lines) {
            const lineData = line.toString()

            if (lineData.includes("fragments:  yes")) {
                return false
            }

            if (lineData.includes("fragments:  no")) {
                return true
            }

            if (lineData.includes("No movie found in the file")) {
                throw new Error("No movie found in the file.")
            }
        }
        return false
    }

    /**
     * Fragment video.
     * @param assetId - Asset ID.
     * @param videoName - Video name.
     */
    async fragmentVideo(assetId: string, videoName: string) {
        const videoPath = join(
            pathsConfig().processMpegDashTasksDirectory,
            assetId,
            videoName,
        )
        const outputDir = join(
            pathsConfig().processMpegDashTasksDirectory,
            assetId,
            `${videoName}_fragmented`,
        )

        const { stdout, stderr } = await execaCommand(
            `mp4fragment --fragment-duration 4000 "${videoPath}" "${outputDir}"`,
            {
                shell: true 
            }
        )
        const execResult = stdout || stderr
        const lines = execResult.split("\n")

        for (const line of lines) {
            const lineData = line.toString()

            if (lineData.includes("ERROR"))
                throw new Error("Line data includes ERROR.")
        }
    }

    /**
     * Generate MPEG-DASH manifest from fragments.
     * @param assetId - Asset ID.
     * @param fragmentedVideoNames - Fragmented video names.
     */
    async generateMpegDashManifestFromFragments(
        assetId: string,
        fragmentedVideoNames: string[],
    ) {
        const fragmentedPaths = fragmentedVideoNames.map((videoName) =>
            join(
                pathsConfig().processMpegDashTasksDirectory,
                assetId,
                `${videoName}_fragmented`,
            ),
        )
        const line = fragmentedPaths.map((path) => `"${path}"`).join(" ")

        const outputDir = join(
            pathsConfig().processMpegDashTasksDirectory,
            assetId,
        )

        const { stdout, stderr } = await execaCommand(
            `mp4dash --mpd-name manifest.mpd ${line} -o "${outputDir}" --use-segment-timeline --subtitles --force`,
            {
                shell: true 
            }
        )
        const execResult = stdout || stderr
        const lines = execResult.split("\n")

        for (const line of lines) {
            const lineData = line.toString()

            if (lineData.includes("ERROR"))
                throw new Error("Line data includes error.")
        }
    }
}
