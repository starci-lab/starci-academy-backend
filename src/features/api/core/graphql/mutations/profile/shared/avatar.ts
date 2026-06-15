/**
 * Avatar upload constants shared by the generate/verify presign-url mutations.
 */

/**
 * MIME types accepted for avatar uploads. The generate mutation rejects anything
 * outside this allow-list before minting an upload URL.
 */
export const ALLOWED_AVATAR_MIME_TYPES: ReadonlyArray<string> = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
]

/**
 * Map of accepted MIME type → file extension baked into the S3 object key, so
 * stored keys stay clean regardless of any client-supplied filename.
 */
export const AVATAR_MIME_EXTENSION: Readonly<Record<string, string>> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
}

/** Object-key prefix all avatars live under (per-user folder appended). */
export const AVATAR_KEY_PREFIX = "avatars"
