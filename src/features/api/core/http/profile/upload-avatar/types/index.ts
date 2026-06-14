import type {
    UserEntity,
} from "@modules/databases"

/**
 * Minimal shape of a multer in-memory file. Declared locally so the module does
 * not depend on `@types/multer` (which is not installed in this workspace).
 */
export interface MulterFile {
    /** Original client-side filename. */
    originalname: string
    /** Detected MIME type. */
    mimetype: string
    /** Size in bytes. */
    size: number
    /** Buffered file contents (memory storage). */
    buffer: Buffer
}

/** Params for uploading and persisting a user's avatar. */
export interface UploadAvatarParams {
    /** The authenticated user whose avatar is being replaced. */
    user: UserEntity
    /** The uploaded multipart file (memory storage), or undefined when absent. */
    file: MulterFile | undefined
}

/** Result of a successful avatar upload. */
export interface UploadAvatarResult {
    /** Public URL of the stored avatar, also persisted on the user row. */
    url: string
}
