/**
 * Map of lower-cased file extension (with leading dot) to the HTTP `Content-Type`
 * stored on the uploaded S3 object, so the browser renders the asset inline.
 */
export const ASSET_CONTENT_TYPE_BY_EXTENSION: Readonly<Record<string, string>> = {
    /** PNG raster image. */
    ".png": "image/png",
    /** JPEG raster image. */
    ".jpg": "image/jpeg",
    /** JPEG raster image (alternate extension). */
    ".jpeg": "image/jpeg",
    /** WebP raster image. */
    ".webp": "image/webp",
    /** GIF raster image. */
    ".gif": "image/gif",
    /** SVG vector image. */
    ".svg": "image/svg+xml",
    /** ICO favicon. */
    ".ico": "image/x-icon",
}

/** Fallback `Content-Type` used when an asset's extension is not recognized. */
export const ASSET_DEFAULT_CONTENT_TYPE = "application/octet-stream"
