import {
    envConfig 
} from "@modules/env"
import {
    AsyncService, 
    InjectSuperJson
} from "@modules/mixin"
import {
    Inject,
    Injectable 
} from "@nestjs/common"
import {
    Scope 
} from "@nestjs/common"
import {
    REQUEST 
} from "@nestjs/core"
import {
    ChallengeEntity,
    ChallengeReferenceEntity,
    ChallengeStepEntity,
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases"
import {
    EntityManager
} from "typeorm"
import {
    ChallengeNotFoundException 
} from "@modules/exceptions"
import SuperJSON from "superjson"
import type {
    ChallengeRuntimeContextRequest 
} from "./types"
import {
    Sha256Service 
} from "@modules/crypto"
import {
    S3UploadService, 
    UploadPayload,
    S3Provider,
    S3NameResolverService
} from "@modules/s3"
import {
    WinstonLog, 
    WinstonService 
} from "@modules/winston"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class ChallengeRuntimeContextService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(REQUEST)
        private readonly request: ChallengeRuntimeContextRequest,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly asyncService: AsyncService,
        private readonly sha256Service: Sha256Service,
        private readonly s3UploadService: S3UploadService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly winstonService: WinstonService
    ) {
    }

    /**
     * Run the sync cycle.
     */
    async run() {
        setInterval(
            async () => {
                await this.asyncService.safeRun(
                    async () => await this.process()
                )
            },
            envConfig().services.cdnSynchronizer.syncIntervalMs.challenges.runtime
        )
    }

    /**
     * Sync the challenge to the CDN.
     */
    async process() {
        let objectKey: string | undefined
        try {
        // take the challenge
            const challenge = await this.entityManager.findOne(
                ChallengeEntity,
                {
                    where: {
                        id: this.request.id,
                    },
                    relations: {
                        translations: true,
                    },
                }
            )
            if (!challenge) {
                throw new ChallengeNotFoundException(
                    {
                        id: this.request.id,
                    },
                )
            }
            const hydratedChallenge = challenge.toPlain<ChallengeEntity>()
        
            // take all steps related to the challenge
            const steps = await this.entityManager.find(
                ChallengeStepEntity,
                {
                    where: {
                        challenge: {
                            id: hydratedChallenge.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                }
            )
            const hydratedSteps = steps?.map((step) => step.toPlain<ChallengeStepEntity>())
            // take all references related to the challenge
            const references = await this.entityManager.find(
                ChallengeReferenceEntity,
                {
                    where: {
                        challenge: {
                            id: hydratedChallenge.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                }
            )
            const hydratedReferences = references?.map((reference) => reference.toPlain<ChallengeReferenceEntity>())
            hydratedChallenge.steps = hydratedSteps
            hydratedChallenge.references = hydratedReferences
            // upload the challenge to the CDN
            const data = this.superJson.stringify(hydratedChallenge)
            const hash = this.sha256Service.hash(data)
            const payload: UploadPayload = {
                data,
                hash,
            }
            objectKey = this.s3NameResolverService.challenge(hydratedChallenge.id)
            await this.s3UploadService.json({
                name: objectKey,
                payload,
                acl: "private",
                providers: [
                    S3Provider.DigitalOcean,
                    S3Provider.Minio,
                ],
            })
        } catch (error) {
            this.winstonService.log(
                WinstonLog.CdnSynchronizerChallengeRuntimeSyncFailed,
                {
                    id: this.request.id,
                    objectKey,
                    providers: [
                        S3Provider.DigitalOcean,
                        S3Provider.Minio,
                    ],
                    error: error.message,
                    context: ChallengeRuntimeContextService.name,
                },
            )
        }
    }
}