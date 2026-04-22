import {
    Injectable 
} from "@nestjs/common"
import ffmpeg from "fluent-ffmpeg"
import {
    join 
} from "path"
import type {
    EncodeProfile 
} from "./types"

/**
 * Service for encoding video.
 */
@Injectable()
export class FfmpegService {
    /**
     * Encode video.
     * @param profile - Encode profile.
     */
    private encodeVideo(profile: EncodeProfile) {
        return new Promise((resolve, reject) => {
            ffmpeg(profile.inputPath)
                .videoCodec("libx264")
                .videoBitrate(profile.maxRate)
                .size(profile.resolution)
                .audioCodec("aac")
                .format("mp4")
                .audioBitrate(profile.audioBitrate)
                .audioFrequency(profile.audioFrequency)
                .audioChannels(profile.audioChannels)
                .addOutputOptions([
                    "-profile:v main",
                    "-level 4.0",
                    "-crf 22",
                    "-r 25",
                    "-keyint_min 25",
                    "-g 50",
                    "-pix_fmt yuv420p",
                    "-sc_threshold 0",
                    "-movflags +faststart",
                    `-maxrate ${profile.maxRate}`,
                    `-bufsize ${profile.bufSize}`
                ])
                .save(profile.outputPath)
                .on("end",
                    resolve)
                .on("error",
                    reject)
        })
    }

    /**
     * Encode video at multiple bitrates.
     * @param assetId - Asset ID.
     * @param videoName - Video name.
     */
    async encodeAtMultipleBitrates(assetId: string, videoName: string) {
        const profiles: Array<EncodeProfile> = [
            // {
            //     inputPath: videoPath,
            //     outputPath: join(outputDir, "1080.mp4"),
            //     ...videoInfos["1080.mp4"]
            // },
            // {
            //     inputPath: videoPath,
            //     outputPath: join(outputDir, "720.mp4"),
            //     ...videoInfos["720.mp4"]
            // },
            // {
            //     inputPath: videoPath,
            //     outputPath: join(outputDir, "480.mp4"),
            //     ...videoInfos["480.mp4"]
            // },
            // {
            //     inputPath: videoPath,
            //     outputPath: join(outputDir, "360.mp4"),
            //     ...videoInfos["360.mp4"]
            // },
            // {
            //     inputPath: videoPath,
            //     outputPath: join(outputDir, "240.mp4"),
            //     ...videoInfos["240.mp4"]
            // },
        ]
        const promises: Array<Promise<void>> = []
    }
}
