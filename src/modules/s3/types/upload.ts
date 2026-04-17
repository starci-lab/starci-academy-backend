import type {
    ObjectCannedACL,
    PutObjectAclCommandOutput,
} from "@aws-sdk/client-s3"
import type {
    S3Provider 
} from "../enums"

/** Payload for uploading to S3. */
export interface UploadPayload {
    /** The data to upload. */
    data: string
    /** The hash of the data. */
    hash: string
}
/** Params for uploading JSON content to S3. */
export interface UploadJsonParams<T extends UploadPayload> {
    /** The target object key in S3 bucket. */
    name: string
    /** Payload to upload. */
    payload: T
    /** ACL for uploaded object. */
    acl: ObjectCannedACL
    /** Provider to use for uploading. */
    providers: Array<S3Provider>
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
