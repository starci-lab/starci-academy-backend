import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    UserCVSubmissionEntity,
    CvSubmissionStatus,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CvSubmissionNotFoundException,
} from "@modules/exceptions"
import {
    S3ReadService,
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
import {
    VerifySubmitCvPresignUrlCommand,
} from "./verify-submit-cv-presign-url.command"
import {
    VerifySubmitCvPresignUrlResponseData 
} from "./graphql-types"

@CommandHandler(VerifySubmitCvPresignUrlCommand)
@Injectable()
export class VerifySubmitCvPresignUrlHandler
    extends ICQRSHandler<
        VerifySubmitCvPresignUrlCommand,
        VerifySubmitCvPresignUrlResponseData
    >
    implements ICommandHandler<
        VerifySubmitCvPresignUrlCommand,
        VerifySubmitCvPresignUrlResponseData
    > {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3ReadService: S3ReadService,
    ) {
        super()
    }

    protected override async process(
        command: VerifySubmitCvPresignUrlCommand,
    ) {
        const {
            request,
        } = command.params

        const submission = await this.entityManager.findOne(
            UserCVSubmissionEntity,
            {
                where: {
                    id: request.cvSubmissionId,
                },
            },
        )

        if (!submission) {
            throw new CvSubmissionNotFoundException({
                cvSubmissionId: request.cvSubmissionId,
            })
        }
        let uploaded = false
        if (submission.cdnKey) {
            const exists = await this.s3ReadService.exists({
                key: submission.cdnKey,
                provider: S3Provider.Minio,
            })
            // If the file does not exist, update the submission status to Failed
            if (!exists) {
                await this.entityManager.update(
                    UserCVSubmissionEntity,
                    submission.id,
                    {
                        status: CvSubmissionStatus.Failed,
                    },
                )
            } else if (submission.status === CvSubmissionStatus.Pending) {
                // Update submission status to Uploaded if still Pending
                await this.entityManager.update(
                    UserCVSubmissionEntity,
                    submission.id,
                    {
                        status: CvSubmissionStatus.Uploaded,
                    },
                )
                uploaded = true
            } else {
                uploaded = true
            }
        }

        return {
            uploaded,
        }
    }
}
