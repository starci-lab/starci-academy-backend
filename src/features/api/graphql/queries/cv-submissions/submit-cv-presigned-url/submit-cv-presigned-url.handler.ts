import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    CVPromptEntity,
    CVSubmissionAttemptEntity,
    CVSubmissionEntity,
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
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import {
    v4 as uuidv4,
} from "uuid"
import {
    SubmitCvPresignedUrlQuery,
} from "./submit-cv-presigned-url.query"
import {
    SubmitCvPresignedUrlResponse,
} from "./graphql-types"

@QueryHandler(SubmitCvPresignedUrlQuery)
@Injectable()
export class SubmitCvPresignedUrlHandler
    extends ICQRSHandler<SubmitCvPresignedUrlQuery, SubmitCvPresignedUrlResponse>
    implements IQueryHandler<SubmitCvPresignedUrlQuery, SubmitCvPresignedUrlResponse> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    protected override async process(
        query: SubmitCvPresignedUrlQuery,
    ): Promise<SubmitCvPresignedUrlResponse> {
        const {
            user,
            request,
        } = query.params

        const allowedExtensions = [
            "pdf",
            "docx",
        ]
        const extension = request.fileName.split(".").pop()?.toLowerCase() || ""
        if (!allowedExtensions.includes(extension)) {
            throw new Error("Invalid file type. Only PDF and DOCX are allowed.")
        }

        const [prompt] = await this.entityManager.find(
            CVPromptEntity,
            {
                order: {
                    createdAt: "DESC",
                },
                take: 1,
            },
        )

        if (!prompt) {
            throw new Error("No active CV analysis prompt found in the system.")
        }

        const [lastSubmission] = await this.entityManager.find(
            CVSubmissionEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
                order: {
                    createdAt: "DESC",
                },
                take: 1,
            },
        )

        const submission = lastSubmission ?? await this.entityManager.save(
            this.entityManager.create(
                CVSubmissionEntity,
                {
                    user,
                    cvPrompt: prompt,
                    status: CvSubmissionStatus.Pending,
                    feedback: null,
                },
            ),
        )

        if (submission.status !== CvSubmissionStatus.Pending) {
            await this.entityManager.update(
                CVSubmissionEntity,
                submission.id,
                {
                    status: CvSubmissionStatus.Pending,
                },
            )
        }

        const attemptCount = await this.entityManager.count(
            CVSubmissionAttemptEntity,
            {
                where: {
                    cvSubmission: {
                        id: submission.id,
                    },
                },
            },
        )

        const attemptId = uuidv4()
        const attemptNumber = attemptCount + 1
        const fileKey = `cv-submissions/${user.id}/${submission.id}/${request.fileName}-v${attemptNumber}.${extension}`

        const attempt = this.entityManager.create(
            CVSubmissionAttemptEntity,
            {
                id: attemptId,
                cvSubmission: submission,
                fileUrl: fileKey,
                attemptNumber,
                status: CvSubmissionStatus.Pending,
            },
        )
        await this.entityManager.save(attempt)

        const url = await this.s3BuildService.buildSignedPutObjectUrl({
            key: fileKey,
            contentType: extension === "pdf"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            provider: S3Provider.Minio,
        })

        return {
            url,
            cvSubmissionId: submission.id,
            cvSubmissionAttemptId: attempt.id,
        }
    }
}
