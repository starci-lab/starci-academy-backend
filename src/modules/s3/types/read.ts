import {
    S3Provider 
} from "../enums"

/** Payload for reading from S3. */
export interface ReadTextParams {
    /** The key of the object to read. */
    key: string
    /** The provider to use for reading. */
    provider: S3Provider
}

export interface ReadJsonParams {
    /** The key of the object to read. */
    key: string
    /** The provider to use for reading. */
    provider: S3Provider
}