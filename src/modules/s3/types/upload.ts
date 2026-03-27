import type {
    ObjectCannedACL,
    PutObjectAclCommandOutput,
} from "@aws-sdk/client-s3"

/** Params for uploading JSON content to S3. */
export interface UploadJsonParams {
    /** The target object key in S3 bucket. */
    name: string
    /** JSON payload (already stringified). */
    json: string
    /** ACL for uploaded object. */
    acl: ObjectCannedACL
}

/** Result of uploading JSON content to S3. */
export type UploadJsonResult = PutObjectAclCommandOutput
