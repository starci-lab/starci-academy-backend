import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"

/**
 * Helpers for building public URLs for objects in the configured S3-compatible bucket.
 */
@Injectable()
export class S3BuildService {
    /**
     * Build the public URL for an S3 object key.
     *
     * `S3UploadService` uploads with `ACL: public-read`, so this should be reachable without auth.
     */
    buildPublicObjectUrl(
        objectKey: string,
    ): string {
        const endpoint = envConfig().s3.endpoint
        const bucket = envConfig().s3.bucket
        let base = endpoint
        if (endpoint.endsWith("/")) {
            base = endpoint.slice(0,
                -1)
        }
        return `${base}/${bucket}/${objectKey}`
    }
}

