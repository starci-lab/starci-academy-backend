import {
    GpuVendor,
} from "../enums/gpu"

/**
 * Detected GPU information.
 */
export interface GpuInfo {
    /** GPU vendor (nvidia, amd, intel, none). */
    vendor: GpuVendor
    /** Full GPU name string (e.g. "NVIDIA GeForce RTX 4090"). */
    name: string
    /** The ffmpeg video codec to use for this GPU. */
    hwEncoder: string | null
}
