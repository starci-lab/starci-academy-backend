import {
    CVPromptEntity,
    CVSubmissionEntity,
    CvSubmissionStatus,
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    DayjsService,
} from "@modules/mixin"
import {
    S3BuildService,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    MoreThanOrEqual,
} from "typeorm"
import {
    GetSubmitCvPresignedUrlRequest,
    GetSubmitCvPresignedUrlResponse,
} from "./graphql-types"
import {
    v4 as uuidv4,
} from "uuid"

/**
 * Service for getting a pre-signed URL to upload a CV (Query-based).
 */
@Injectable()
export class GetSubmitCvPresignedUrlService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
        private readonly s3BuildService: S3BuildService,
    ) {}

    /**
     * Executes the logic to create a pending submission and generate a pre-signed URL.
     * @param params - Execution parameters.
     * @returns The pre-signed URL and submission record ID.
     */
    async execute(
        {
            user,
            request,
        }: {
            user: UserEntity
            request: GetSubmitCvPresignedUrlRequest
        },
    ): Promise<GetSubmitCvPresignedUrlResponse> {
        // 1. Rate Limiting: 1 submission per calendar day
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

        // 2. Extension validation
        const allowedExtensions = [
            "pdf",
            "docx",
        ]
        const extension = request.fileName.split(".").pop()?.toLowerCase() || ""
        if (!allowedExtensions.includes(extension)) {
            throw new Error("Invalid file type. Only PDF and DOCX are allowed.")
        }

        // 3. Selection: Get the latest CVPrompt
        const prompt = await this.entityManager.findOne(
            CVPromptEntity,
            {
                order: {
                    createdAt: "DESC",
                },
            },
        )

        if (!prompt) {
            throw new Error("No active CV analysis prompt found in the system.")
        }

        // 4. Persistence: Create CVSubmissionEntity in Pending state
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

        // 5. Presign: Generate PUT URL
        const url = await this.s3BuildService.buildSignedPutObjectUrl(
            fileKey,
            extension === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

        return {
            url,
            cvSubmissionId: submission.id,
        }
    }
}
