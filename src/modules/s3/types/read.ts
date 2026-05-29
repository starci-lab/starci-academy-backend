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

/** Params for reading and parsing a JSON object from S3. */
export interface ReadJsonParams {
    /** The key of the object to read. */
    key: string
    /** The provider to use for reading. */
    provider: S3Provider
}

/** Params for reading from S3 as Buffer. */
export interface ReadBufferParams {
    /** The key of the object to read. */
    key: string
    /** The provider to use for reading. */
    provider: S3Provider
}

/** Params for listing objects from S3. */
export interface ListParams {
    /** The key of the object to list. */
    key: string
    /** The provider to use for listing. */
    provider: S3Provider
}