import type {
    ObjectCannedACL,
    PutObjectAclCommandOutput,
} from "@aws-sdk/client-s3"
import type {
    S3Provider 
} from "../enums"
import {
    Readable 
} from "stream"

/** Serialization used for the JSON body written to S3. */
export type UploadJsonEncoding = "superjson" | "json"
/** Params for uploading JSON content to S3. */
export interface UploadJsonParams<T> {
    /** The target object key in S3 bucket. */
    name: string
    /**
     * Value to upload. Serialized once into the object body -- with SuperJSON
     * (default) or plain `JSON.stringify` (`encoding: "json"`) -- and written as
     * text directly, with no extra envelope wrapping.
     */
    payload: T
    /** ACL for uploaded object. */
    acl: ObjectCannedACL
    /** Provider to use for uploading. */
    providers: Array<S3Provider>
    /**
     * Body serialization. Defaults to `"superjson"` (typed-rich, parsed back with
     * SuperJSON on the consumer). Use `"json"` for plain `JSON.stringify` when the
     * consumer reads the object with a raw `JSON.parse` (e.g. the FE sandbox fetch).
     */
    encoding?: UploadJsonEncoding
}

/** Result of uploading JSON content to S3. */
export type UploadJsonResult = PutObjectAclCommandOutput

/** Params for uploading raw buffer content to S3. */
export interface UploadBufferParams {
    /** The target object key in S3 bucket. */
    name: string
    /** Buffer content to upload. */
    buffer: Buffer
    /** ACL for uploaded object. */
    acl: ObjectCannedACL
    /** Provider to use for uploading (typically Minio for CVs). */
    provider: S3Provider
    /** Optional ContentType (e.g. application/pdf). */
    contentType?: string
}

/** Params for uploading stream content to S3. */
export interface UploadStreamParams {
    /** The target object key in S3 bucket. */
    name: string
    /** Stream content to upload. */
    stream: Readable
    /** ACL for uploaded object. */
    acl: ObjectCannedACL
    /** Provider to use for uploading (typically Minio for CVs). */
    provider: S3Provider
    /** Optional ContentType (e.g. application/pdf). */
    contentType?: string
}