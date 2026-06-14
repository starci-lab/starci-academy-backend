/**
 * MIME types accepted for avatar uploads. Anything outside this allow-list is
 * rejected before hitting S3 so the avatar column only ever points at an image.
 */
export const ALLOWED_AVATAR_MIME_TYPES: ReadonlyArray<string> = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
]

/**
 * Map of accepted MIME type → file extension used when building the S3 object
 * key. Keeps stored keys clean regardless of the original client filename.
 */
export const AVATAR_MIME_EXTENSION: Readonly<Record<string, string>> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
}
