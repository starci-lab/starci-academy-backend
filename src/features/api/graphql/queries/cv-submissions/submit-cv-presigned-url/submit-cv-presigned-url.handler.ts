import {
    ICQRSHandler,
} from "@modules/bussiness"
import {
    CVPromptEntity,
    CVSubmissionEntity,
    CvSubmissionStatus,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    DayjsService,
} from "@modules/mixin"
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
    MoreThanOrEqual,
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
        private readonly dayjsService: DayjsService,
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

        const todayStart = this.dayjsService.now().startOf("day").toDate()
        const submissionCount = await this.entityManager.count(
            CVSubmissionEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    createdAt: MoreThanOrEqual(todayStart),
                },
            },
        )

        if (submissionCount >= 1) {
            throw new Error("You have already submitted a CV today. Please try again tomorrow.")
        }

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

        const submissionId = uuidv4()
        const fileKey = `cv-submissions/${user.id}/${submissionId}.${extension}`

        const submission = this.entityManager.create(
            CVSubmissionEntity,
            {
                id: submissionId,
                user,
                cvPrompt: prompt,
                fileUrl: fileKey,
                status: CvSubmissionStatus.Pending,
            },
        )
        await this.entityManager.save(submission)

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
        }
    }
}
