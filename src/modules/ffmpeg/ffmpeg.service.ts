import {
    Injectable,
    Logger,
} from "@nestjs/common"
import ffmpeg from "fluent-ffmpeg"
import {
    join,
} from "path"
import type {
    EncodeProfile,
} from "./types"
import {
    GpuVendor,
} from "./enums"
import {
    GpuService,
} from "./gpu.service"

ffmpeg.setFfmpegPath(
    join(process.cwd(),
        "node_modules",
        "ffmpeg-static",
        process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"),
)

/**
 * Service for encoding video using FFmpeg.
 * Automatically uses GPU-accelerated encoding (NVENC/AMF/QSV) when available,
 * with software (libx264) fallback.
 */
@Injectable()
export class FfmpegService {
    private readonly logger = new Logger(FfmpegService.name)

    constructor(
        private readonly gpuService: GpuService,
    ) {}

    /**
     * Standard multi-bitrate encode profiles for MPEG-DASH packaging.
     */
    public readonly profiles: ReadonlyArray<Omit<EncodeProfile, "inputPath" | "outputPath">> = [
        {
            resolution: "1920x1080",
            maxRate: "5000k",
            bufSize: "10000k",
            audioBitrate: "192k",
            audioFrequency: 48000,
            audioChannels: 2,
        },
        {
            resolution: "1280x720",
            maxRate: "2800k",
            bufSize: "5600k",
            audioBitrate: "128k",
            audioFrequency: 48000,
            audioChannels: 2,
        },
        {
            resolution: "854x480",
            maxRate: "1400k",
            bufSize: "2800k",
            audioBitrate: "128k",
            audioFrequency: 48000,
            audioChannels: 2,
        },
        {
            resolution: "640x360",
            maxRate: "800k",
            bufSize: "1600k",
            audioBitrate: "96k",
            audioFrequency: 44100,
            audioChannels: 2,
        },
    ]

    /** Output filenames matching each profile. */
    public readonly videoNames: ReadonlyArray<string> = [
        "1080.mp4",
        "720.mp4",
        "480.mp4",
        "360.mp4",
    ]

    /**
     * Build output options based on GPU vendor.
     * NVENC/AMF/QSV use different flags than libx264.
     */
    private buildOutputOptions(profile: EncodeProfile, vendor: GpuVendor): Array<string> {
        const common = [
            "-r 25",
            "-keyint_min 25",
            "-g 50",
            "-sc_threshold 0",
            "-movflags +faststart",
            `-maxrate ${profile.maxRate}`,
            `-bufsize ${profile.bufSize}`,
        ]

        switch (vendor) {
        case GpuVendor.Nvidia:
            return [
                "-profile:v main",
                "-level 4.0",
                "-rc vbr",
                "-cq 22",
                "-pix_fmt yuv420p",
                ...common,
            ]
        case GpuVendor.Amd:
            return [
                "-profile:v main",
                "-level 4.0",
                "-rc vbr_peak",
                "-quality balanced",
                "-pix_fmt yuv420p",
                ...common,
            ]
        case GpuVendor.Intel:
            return [
                "-profile:v main",
                "-level 4.0",
                "-global_quality 22",
                "-pix_fmt nv12",
                ...common,
            ]
        default:
            // Software (libx264) fallback
            return [
                "-profile:v main",
                "-level 4.0",
                "-crf 22",
                "-pix_fmt yuv420p",
                ...common,
            ]
        }
    }

    /**
     * Encode a single video at a given profile.
     */
    private encodeVideo(profile: EncodeProfile, codec: string, vendor: GpuVendor): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(profile.inputPath)
                .videoCodec(codec)
                .videoBitrate(profile.maxRate)
                .size(profile.resolution)
                .audioCodec("aac")
                .format("mp4")
                .audioBitrate(profile.audioBitrate)
                .audioFrequency(profile.audioFrequency)
                .audioChannels(profile.audioChannels)
                .addOutputOptions(this.buildOutputOptions(profile,
                    vendor))
                .save(profile.outputPath)
                .on("end",
                    () => {
                        resolve()
                    })
                .on("error",
                    reject)
        })
    }

    /**
     * Encode video at multiple bitrate profiles.
     * Uses GPU encoder if available, otherwise falls back to libx264.
     * @param taskDir - The task working directory containing the source video.
     * @param filename - Name of the source video file.
     */
    async encodeAtMultipleBitrates(
        taskDir: string,
        filename: string,
    ): Promise<void> {
        const { vendor, hwEncoder, name } = this.gpuService.gpuInfo
        const codec = hwEncoder ?? "libx264"

        this.logger.log(
            `Encoding with ${codec} (GPU: ${name}, vendor: ${vendor})`,
        )

        const inputPath = join(taskDir,
            filename)
        const profiles: Array<EncodeProfile> = this.profiles.map(
            (profile, idx) => ({
                ...profile,
                inputPath,
                outputPath: join(taskDir,
                    this.videoNames[idx]),
            }),
        )

        for (const profile of profiles) {
            await this.encodeVideo(profile,
                codec,
                vendor)
        }
    }
}
