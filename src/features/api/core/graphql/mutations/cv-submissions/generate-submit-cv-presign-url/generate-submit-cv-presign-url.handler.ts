import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    UserCVSubmissionEntity,
    CvSubmissionStatus,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    S3BuildService,
    S3Provider,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import path from "path"
import {
    GenerateSubmitCvPresignUrlCommand,
} from "./generate-submit-cv-presign-url.command"
import {
    GenerateSubmitCvPresignUrlResponseData,
} from "./graphql-types"
import {
    NotAllowExtensionsException 
} from "@modules/exceptions"

@CommandHandler(GenerateSubmitCvPresignUrlCommand)
@Injectable()
export class GenerateSubmitCvPresignUrlHandler
    extends ICQRSHandler<GenerateSubmitCvPresignUrlCommand, GenerateSubmitCvPresignUrlResponseData>
    implements ICommandHandler<GenerateSubmitCvPresignUrlCommand, GenerateSubmitCvPresignUrlResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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

        let lastSubmission = await this.entityManager.findOne(
            UserCVSubmissionEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
                order: {
                    createdAt: "DESC",
                },
            },
        )
        if (!lastSubmission) {
            lastSubmission = this.entityManager.create(
                UserCVSubmissionEntity,
                {
                    user,
                    status: CvSubmissionStatus.Pending,
                    cdnKey: fileKey,
                },
            )
        } else {
            lastSubmission.status = CvSubmissionStatus.Pending
            lastSubmission.cdnKey = fileKey
        }
       
        await this.entityManager.transaction(
            async (entityManager) => {
                await entityManager.save(lastSubmission)
            },
        )
        return {
            url,
            cvSubmissionId: lastSubmission.id,
        }
    }
}
