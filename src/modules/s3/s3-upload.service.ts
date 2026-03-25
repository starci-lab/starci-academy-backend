import {
    PutObjectAclCommandOutput,
    PutObjectCommand,
    S3Client 
} from "@aws-sdk/client-s3"
import {
    Injectable 
} from "@nestjs/common"
import {
    InjectS3 
} from "./s3.decorators"
import {
    envConfig 
} from "@modules/env"

/**
 * Service for uploading files to S3.
 */
@Injectable()
export class S3UploadService {
    constructor(
        @InjectS3()
        private readonly s3: S3Client,
    ) {}

    /**
     * Upload a JSON file to S3.
     * @param name - The name of the file.
     * @param json - The JSON content to upload.
     * @returns The command output.
     */
    async json(
        name: string, 
        json: string
    ): Promise<PutObjectAclCommandOutput> {
        return this.s3.send(
            new PutObjectCommand({
                Bucket: envConfig().s3.bucket,
                Key: name,
                Body: json,
                ACL: "public-read",
                ContentType: "application/json",
            }
            )
        )
    }
}       