import {
    Injectable,
} from "@nestjs/common"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ContentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/content-not-found"
import {
    ContentNotSandboxException,
} from "@modules/platform/exceptions/errors/courses/content-not-sandbox"
import {
    EnrollmentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/enrollment-not-found"
import {
    SandboxSourceNotConfiguredException,
} from "@modules/platform/exceptions/errors/courses/sandbox-source-not-configured"
import {
    type EntityManager,
} from "typeorm"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3BuildService,
} from "@modules/integrations/s3/s3-build.service"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    SandboxRepoUrlRequest,
} from "./graphql-types/request"
import {
    EffectiveLearnerAccessService,
} from "@modules/bussiness/pro-subscription/effective-learner-access.service"

@Injectable()
/**
 * Validates sandbox + github config, enforces enrollment for premium lessons,
 * then builds a time-limited Minio signed GET for the bundled repo tree.
 */
export class SandboxRepoUrlService {

    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3BuildService: S3BuildService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly effectiveLearnerAccessService: EffectiveLearnerAccessService,
    ) { }

    /**
     * Return a time-limited presigned Minio URL for a premium sandbox lesson's
     * bundled file tree. Requires the requesting user to be enrolled in the course.
     */
    async execute(
        request: SandboxRepoUrlRequest,
        user: UserEntity,
    ): Promise<string> {
        const content = await this.entityManager.findOne(ContentEntity,
            {
                where: {
                    id: request.contentId,
                },
                relations: {
                    module: {
                        course: true,
                    },
                },
            })

        if (!content) {
            throw new ContentNotFoundException({
                id: request.contentId,
            })
        }

        if (!content.isSandbox) {
            throw new ContentNotSandboxException({
                contentId: request.contentId,
            })
        }

        if (!content.githubBaseUrl || !content.githubDir) {
            throw new SandboxSourceNotConfiguredException({
                contentId: request.contentId,
            })
        }

        // Premium lessons require effective paid access to the course.
        // Non-premium lessons issue a presigned URL to any authenticated user.
        if (content.isPremium) {
            const hasAccess = await this.effectiveLearnerAccessService.hasCourseAccess(
                user.id,
                content.module.course.id,
            )
            if (!hasAccess) {
                throw new EnrollmentNotFoundException({
                    userId: user.id,
                    courseId: content.module.course.id,
                })
            }
        }

        const repoName = content.githubBaseUrl.split("/").at(-1)!
        const key = this.s3NameResolverService.repo(repoName,
            content.githubDir)

        return this.s3BuildService.buildSignedGetObjectUrl({
            key,
            provider: S3Provider.Minio,
        })
    }
}
