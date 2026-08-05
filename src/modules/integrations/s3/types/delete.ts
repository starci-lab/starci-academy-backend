import {
    S3Provider,
} from "../enums/s3"

/** Params for batch-deleting objects from S3. */
export interface DeleteObjectsParams {
    /** The full object keys to delete (e.g. `courses/<id>/vi.json`). */
    keys: Array<string>
    /** The provider whose bucket the keys live in. */
    provider: S3Provider
}
