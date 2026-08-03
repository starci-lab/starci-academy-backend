/**
 * Interface for encode profile.
 */
export interface EncodeProfile {
    /**
     * Input path.
     */
    inputPath: string;
    /**
     * Output path.
     */
    outputPath: string;
    /**
     * Resolution.
     */
    resolution: string;
    /**
     * Audio bitrate.
     */
    audioBitrate: string;
    /**
     * Audio frequency.
     */
    audioFrequency: number;
    /**
     * Audio channels.
     */
    audioChannels: number;
    /**
     * Max rate.
     */
    maxRate: string,
    /**
     * Buffer size.
     */
    bufSize: string,
}
