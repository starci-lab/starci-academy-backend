import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3BuildService,
} from "@modules/integrations/s3/s3-build.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import path from "path"
import {
    GenerateSubmitCvPresignUrlCommand,
} from "./generate-submit-cv-presign-url.command"
import {
    GenerateSubmitCvPresignUrlResponseData,
} from "./graphql-types/response"
import {
    NotAllowExtensionsException,
} from "@modules/platform/exceptions/errors/api/not-allow-extensions"

@CommandHandler(GenerateSubmitCvPresignUrlCommand)
@Injectable()
/**
 * Builds a MinIO signed PUT (PDF-only) and returns the object key so `uploadCv`
 * can register the same key later without the API ever seeing the file bytes.
 */
export class GenerateSubmitCvPresignUrlHandler
    extends ICQRSHandler<GenerateSubmitCvPresignUrlCommand, GenerateSubmitCvPresignUrlResponseData>
    implements ICommandHandler<GenerateSubmitCvPresignUrlCommand, GenerateSubmitCvPresignUrlResponseData> {
    constructor(
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    /**
     * Generate a presigned URL for uploading a CV.
     * @param command The command to generate a presigned URL for uploading a CV.
     * @returns A promise that resolves to a GenerateSubmitCvPresignUrlResponse.
     */
    protected override async process(
        command: GenerateSubmitCvPresignUrlCommand,
    ): Promise<GenerateSubmitCvPresignUrlResponseData> {
        const {
            user,
            request,
        } = command.params
        const allowedExtensions = [
            "pdf",
        ]
        const extWithDot = path.extname(request.fileName)
        const extension = extWithDot.slice(1).toLowerCase()
        if (!allowedExtensions.includes(extension)) {
            throw new NotAllowExtensionsException({
                extensions: allowedExtensions,
                extension,
                fileName: request.fileName,
            })
        }
        const baseName = path.basename(
            request.fileName,
            extWithDot,
        ) || "cv"
        const fileKey = `users/cv-submissions/${user.id}/${baseName}.${extension}`
        const url = await this.s3BuildService.buildSignedPutObjectUrl({
            key: fileKey,
            contentType: extension === "pdf"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            provider: S3Provider.Minio,
        })

        return {
            url,
            // WF-07: expose the object key so the client can register the upload
            // into the unified `cv_generations` table via the `uploadCv` mutation.
            cdnKey: fileKey,
        }
    }
}
