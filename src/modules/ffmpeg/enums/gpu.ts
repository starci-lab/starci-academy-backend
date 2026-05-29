/**
 * GPU vendor types supported for hardware-accelerated encoding.
 */
export enum GpuVendor {
    /** NVIDIA GPU; uses NVENC hardware encoding. */
    Nvidia = "nvidia",
    /** AMD GPU; uses AMF/VAAPI hardware encoding. */
    Amd = "amd",
    /** Intel GPU; uses Quick Sync Video hardware encoding. */
    Intel = "intel",
    /** No supported GPU detected; falls back to software encoding. */
    None = "none",
}
