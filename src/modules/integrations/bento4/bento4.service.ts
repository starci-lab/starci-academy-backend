import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    join,
} from "path"
import {
    execaCommand,
} from "execa"
import {
    platform,
} from "os"
import {
    Bento4Mp4DashException,
    Bento4Mp4FragmentException,
    Bento4NoMovieFoundException,
} from "@modules/exceptions"

/**
 * Resolve the Bento4 binary directory based on the project root.
 */
function bento4BinDir(): string {
    return join(process.cwd(),
        ".exe",
        "Bento4",
        "bin")
}

/**
 * Resolve the Bento4 utils directory (Python scripts).
 */
function bento4UtilsDir(): string {
    return join(process.cwd(),
        ".exe",
        "Bento4",
        "utils")
}

/**
 * Get the correct executable name (with .exe on Windows).
 */
function exe(name: string): string {
    return platform() === "win32" ? `${name}.exe` : name
}

@Injectable()
/**
 * Bento4 service for MPEG-DASH packaging.
 * Uses binaries from .exe/Bento4/bin/ directory.
 */
export class Bento4Service {
    private readonly logger = new Logger(Bento4Service.name)

    /**
     * Check if video has fragments.
     * @param taskDir - Working directory for this task.
     * @param videoName - Video file name (e.g. "1080.mp4").
     * @returns True if fragmentation is required, false if already fragmented.
     */
    async checkFragments(taskDir: string, videoName: string): Promise<boolean> {
        const videoPath = join(taskDir,
            videoName)
        const mp4info = join(bento4BinDir(),
            exe("mp4info"))

        const { stdout, stderr } = await execaCommand(
            `"${mp4info}" "${videoPath}"`,
            {
                shell: true 
            },
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
                throw new Bento4NoMovieFoundException({
                })
            }
        }
        return false
    }

    /**
     * Fragment video.
     * @param taskDir - Working directory for this task.
     * @param videoName - Video file name (e.g. "1080.mp4").
     */
    async fragmentVideo(taskDir: string, videoName: string): Promise<void> {
        const videoPath = join(taskDir,
            videoName)
        const outputPath = join(taskDir,
            `${videoName}_fragmented`)
        const mp4fragment = join(bento4BinDir(),
            exe("mp4fragment"))

        const { stdout, stderr } = await execaCommand(
            `"${mp4fragment}" --fragment-duration 4000 "${videoPath}" "${outputPath}"`,
            {
                shell: true 
            },
        )
        const execResult = stdout || stderr
        const lines = execResult.split("\n")

        for (const line of lines) {
            const lineData = line.toString()
            if (lineData.includes("ERROR")) {
                throw new Bento4Mp4FragmentException({
                    stderr: lineData,
                })
            }
        }
    }

    /**
     * Generate MPEG-DASH manifest from fragmented videos.
     * Uses the mp4-dash.py Python script from Bento4 utils.
     * @param taskDir - Working directory for this task.
     * @param videoNames - List of video file names to include.
     */
    async generateMpegDashManifestFromFragments(
        taskDir: string,
        videoNames: ReadonlyArray<string>,
    ): Promise<void> {
        const fragmentedPaths = videoNames.map((videoName) =>
            join(taskDir,
                `${videoName}_fragmented`),
        )
        const line = fragmentedPaths.map((path) => `"${path}"`).join(" ")
        const mp4dash = join(bento4UtilsDir(),
            "mp4-dash.py")

        const { stdout, stderr } = await execaCommand(
            `python "${mp4dash}" --mpd-name manifest.mpd ${line} -o "${taskDir}" --use-segment-timeline --subtitles --force --exec-dir="${bento4BinDir()}"`,
            {
                shell: true 
            },
        )
        const execResult = stdout || stderr
        const lines = execResult.split("\n")

        for (const line of lines) {
            const lineData = line.toString()
            if (lineData.includes("ERROR")) {
                throw new Bento4Mp4DashException({
                    stderr: lineData,
                })
            }
        }
    }
}
