import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    ContentEntity,
    EnrollmentEntity,
    UserEntity,
} from "@modules/databases"
import {
    type EntityManager,
} from "typeorm"
import {
    S3BuildService,
    S3NameResolverService,
    S3Provider,
} from "@modules/s3"
import {
    SandboxRepoUrlRequest,
} from "./graphql-types"

@Injectable()
export class SandboxRepoUrlService {

    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3BuildService: S3BuildService,
        private readonly s3NameResolverService: S3NameResolverService,
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
            throw new NotFoundException("Content not found")
        }

        if (!content.isSandbox) {
            throw new ForbiddenException("Content is not a sandbox lesson")
        }

        if (!content.githubBaseUrl || !content.githubDir) {
            throw new NotFoundException("Sandbox source not configured for this lesson")
        }

        // Premium lessons require active enrollment in the course.
        // Non-premium lessons issue a presigned URL to any authenticated user.
        if (content.isPremium) {
            const enrollment = await this.entityManager.findOne(EnrollmentEntity,
                {
                    where: {
                        user: {
                            id: user.id,
                        },
                        course: {
                            id: content.module.course.id,
                        },
                    },
                })
            if (!enrollment) {
                throw new ForbiddenException("User is not enrolled in this course")
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
