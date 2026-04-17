import {
    S3Provider 
} from "../enums"

/** Params for building a public URL. */
export interface BuildPublicUrlParams {
    /** The key of the object. */
    key: string
    /** The provider to use. */
    provider: S3Provider
}

/** Params for building a signed GET URL. */
export interface BuildSignedGetUrlParams {
    /** The key of the object. */
    key: string
    /** The provider to use. */
    provider: S3Provider
}

/** Params for building a signed PUT URL. */
export interface BuildSignedPutUrlParams {
    /** The key of the object. */
    key: string
    /** The provider to use. */
    provider: S3Provider
    /** The content type of the object. */
    contentType?: string
}
