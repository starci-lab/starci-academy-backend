/**
 * Minimal shape of a multer in-memory file. Declared locally so the mock does
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

/** Success body returned on a completed single-file upload. */
export interface UploadedFileInfo {
    /** Original client-side filename. */
    originalName: string
    /** Server-side storage filename (uuid-prefixed). */
    filename: string
    /** Size in bytes. */
    size: number
    /** Detected MIME type. */
    mimetype: string
    /** Pseudo storage path for display. */
    path: string
}
