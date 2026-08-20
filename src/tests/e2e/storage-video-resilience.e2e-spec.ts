import {
    CreateBucketCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    FetchHttpHandler,
} from "@smithy/fetch-http-handler"
import {
    BullModule as NestBullModule,
    getQueueToken,
} from "@nestjs/bullmq"
import {
    ValidationPipe,
    VersioningType,
} from "@nestjs/common"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    EventEmitterModule,
} from "@nestjs/event-emitter"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    Bento4Service,
} from "@modules/integrations/bento4/bento4.service"
import {
    FfmpegService,
} from "@modules/integrations/ffmpeg/ffmpeg.service"
import {
    S3Module,
} from "@modules/integrations/s3/s3.module"
import {
    MINIO_S3,
    MINIO_S3_PRESIGN,
} from "@modules/integrations/s3/constants/s3"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    AdminServiceTokenGuard,
} from "@modules/bussiness/guards/admin-access.guard"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    MixinModule,
} from "@modules/lib/mixin/mixin.module"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    NatsMessageFactoryService,
} from "@modules/platform/event/nats/nats-message-factory.service"
import {
    NatsProducerService,
} from "@modules/platform/event/nats/producer.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ProcessVideoController,
} from "@features/api/core/http/admin/process-video/process-video.controller"
import {
    ProcessVideoHandler,
} from "@features/api/core/http/admin/process-video/process-video.handler"
import {
    ProcessVideoService,
} from "@features/api/core/http/admin/process-video/process-video.service"
import {
    VideoEncoderWorker,
} from "@features/video-encoder/processors/video-encoder/video-encoder.worker"
import {
    StepMappingService,
} from "@features/video-encoder/processors/video-encoder/step-mapping.service"
import {
    ProcessVideoInitStepService,
} from "@features/video-encoder/processors/video-encoder/steps/process-video-init-step.service"
import {
    ProcessVideoEncodeStepService,
} from "@features/video-encoder/processors/video-encoder/steps/process-video-encode-step.service"
import {
    ProcessVideoPackageStepService,
} from "@features/video-encoder/processors/video-encoder/steps/process-video-package-step.service"
import {
    ProcessVideoUploadStepService,
} from "@features/video-encoder/processors/video-encoder/steps/process-video-upload-step.service"
import {
    ProcessVideoFinalizeStepService,
} from "@features/video-encoder/processors/video-encoder/steps/process-video-finalize-step.service"
import {
    until,
} from "@tests/helpers/flow-wait"
import type {
    Queue,
} from "bullmq"
import type {
    EntityManager,
} from "typeorm"
import {
    dirname,
    join,
} from "node:path"
import {
    promises as fsPromise,
} from "node:fs"
import request from "supertest"

// Jest executes this suite as CommonJS, while execa's transitive
// `unicorn-magic` export is import-only. Packaging is intentionally bypassed by
// the already-materialized manifest fixture, so this compatibility stub is
// never called and does not replace a production pipeline decision/result.
jest.mock("execa",
    () => ({
        execaCommand: jest.fn(),
    }))

const queueData = bullData[BullQueueName.ProcessVideo]
const ADMIN_API_KEY = "storage-video-e2e-admin"
const SOURCE_KEY = "incoming/retry-source.mp4"

type ProcessVideoHttpResponse = {
    data: {
        jobId: string
    }
}

/**
 * Storage/video operational proof. HTTP crosses the real controller/CQRS door,
 * Redis/BullMQ delivers to the production worker, and the worker reads/writes a
 * real MinIO bucket plus the tracked Postgres job. Jest scripts only the media
 * binary result; queue policy, retry, S3 transport and lifecycle state stay real.
 */
describe("an uploaded video survives worker retry and reaches durable storage",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let processVideoQueue: Queue<string>
        let s3: S3Client
        let successfulJobId: string
        let failedJobId: string
        let encodeAttempt = 0

        const encodeAtMultipleBitrates = jest.fn(async (taskDir: string): Promise<void> => {
            encodeAttempt += 1
            if (encodeAttempt === 1) {
                throw new Error("scripted ffmpeg process interruption")
            }

            const segmentPath = join(taskDir,
                "video",
                "segment-1.m4s")
            await fsPromise.mkdir(dirname(segmentPath),
                {
                    recursive: true,
                })
            await Promise.all([
                fsPromise.writeFile(join(taskDir,
                    "manifest.mpd"),
                "<MPD><Period /></MPD>"),
                fsPromise.writeFile(segmentPath,
                    Buffer.from("encoded-segment")),
                fsPromise.writeFile(join(taskDir,
                    "720.mp4"),
                Buffer.from("encoded-rendition")),
            ])
        })

        const waitForTrackedJob = async (
            id: string,
            status: JobStatus,
        ): Promise<JobEntity> => {
            await until(async () => (await entityManager.findOneBy(JobEntity,
                {
                    id,
                }))?.status === status,
            {
                timeout: 20_000,
                describe: `process-video job ${id} to become ${status}`,
            })
            return entityManager.findOneByOrFail(JobEntity,
                {
                    id,
                })
        }

        const postVideo = async (key: string): Promise<string> => {
            const endpoint = process.env.S3_MINIO_ENDPOINT ?? ""
            const bucket = process.env.S3_MINIO_BUCKET ?? ""
            const response = await request(app.getHttpServer())
                .post("/v1/admin/process-video")
                .set("x-admin-api-key",
                    ADMIN_API_KEY)
                .send({
                    url: `${endpoint}/${bucket}/${key}`,
                })
                .expect(200)
            return (response.body as ProcessVideoHttpResponse).data.jobId
        }

        const listOutputKeys = async (jobId: string): Promise<Array<string>> => {
            const result = await s3.send(new ListObjectsV2Command({
                Bucket: process.env.S3_MINIO_BUCKET,
                Prefix: `videos/${jobId}/`,
            }))
            return (result.Contents ?? []).flatMap((item) => item.Key ? [item.Key] : [])
        }

        const waitForQueueState = async (
            jobId: string,
            state: "completed" | "failed",
        ): Promise<void> => {
            await until(async () => (await processVideoQueue.getJobState(jobId)) === state,
                {
                    timeout: 20_000,
                    describe: `process-video broker job ${jobId} to become ${state}`,
                })
        }

        beforeAll(async () => {
            process.env.BULLMQ_ATTEMPTS = "2"
            process.env.BULLMQ_DELAY = "10ms"
            process.env.S3_ACCESS_KEY_ID = ""

            s3 = new S3Client({
                endpoint: process.env.S3_MINIO_ENDPOINT,
                region: process.env.S3_MINIO_REGION,
                credentials: {
                    accessKeyId: process.env.S3_MINIO_ACCESS_KEY_ID ?? "",
                    secretAccessKey: process.env.S3_MINIO_SECRET_ACCESS_KEY ?? "",
                },
                forcePathStyle: true,
                requestHandler: new FetchHttpHandler(),
            })

            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    EventEmitterModule.forRoot(),
                    CqrsModule,
                    MixinModule.register({
                        isGlobal: true,
                        loadNextJsQueryService: false,
                    }),
                    NestBullModule.forRoot({
                        connection: {
                            host: process.env.REDIS_BULLMQ_HOST,
                            port: Number(process.env.REDIS_BULLMQ_PORT),
                            password: process.env.REDIS_BULLMQ_PASSWORD,
                        },
                    }),
                    NestBullModule.registerQueue({
                        name: queueData.name,
                        prefix: queueData.prefix,
                        defaultJobOptions: {
                            attempts: 2,
                            backoff: {
                                type: "fixed",
                                delay: 10,
                            },
                            removeOnComplete: false,
                            removeOnFail: false,
                        },
                    }),
                    S3Module.register({
                        isGlobal: true,
                    }),
                ],
                controllers: [
                    ProcessVideoController,
                ],
                providers: [
                    ProcessVideoService,
                    ProcessVideoHandler,
                    AdminServiceTokenGuard,
                    JobActionService,
                    EventEmitterService,
                    VideoEncoderWorker,
                    StepMappingService,
                    ProcessVideoInitStepService,
                    ProcessVideoEncodeStepService,
                    ProcessVideoPackageStepService,
                    ProcessVideoUploadStepService,
                    ProcessVideoFinalizeStepService,
                    {
                        provide: MountStorageService,
                        useValue: {
                            adminApiKey: ADMIN_API_KEY,
                        },
                    },
                    {
                        provide: FfmpegService,
                        useValue: {
                            videoNames: [],
                            encodeAtMultipleBitrates,
                        },
                    },
                    Bento4Service,
                    {
                        provide: NatsProducerService,
                        useValue: {
                            publish: jest.fn(),
                        },
                    },
                    {
                        provide: NatsMessageFactoryService,
                        useValue: {
                            create: jest.fn().mockReturnValue("{}"),
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            })
                .overrideProvider(MINIO_S3)
                .useValue(s3)
                .overrideProvider(MINIO_S3_PRESIGN)
                .useValue(s3)
                .compile()

            app = moduleRef.createNestApplication()
            app.enableVersioning({
                type: VersioningType.URI,
            })
            app.useGlobalPipes(new ValidationPipe())
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            processVideoQueue = app.get<Queue<string>>(
                getQueueToken(queueData.name),
            )
            await processVideoQueue.drain(true)

            await s3.send(new CreateBucketCommand({
                Bucket: process.env.S3_MINIO_BUCKET,
            })).catch((error: unknown) => {
                const name = error instanceof Error ? error.name : ""
                if (name !== "BucketAlreadyOwnedByYou" && name !== "BucketAlreadyExists") {
                    throw error
                }
            })
            await s3.send(new PutObjectCommand({
                Bucket: process.env.S3_MINIO_BUCKET,
                Key: SOURCE_KEY,
                Body: Buffer.from("source-video"),
                ContentType: "video/mp4",
            }))
        })

        afterAll(async () => {
            await processVideoQueue?.close()
            s3?.destroy()
            await app?.close().catch(() => undefined)
        })

        it("accepts the source through the authenticated production HTTP door",
            async () => {
                successfulJobId = await postVideo(SOURCE_KEY)
                const queued = await entityManager.findOneByOrFail(JobEntity,
                    {
                        id: successfulJobId,
                    })
                expect(queued.maxSteps).toBe(5)
            })

        it("retries the interrupted media process and records one completed pipeline",
            async () => {
                const completed = await waitForTrackedJob(successfulJobId,
                    JobStatus.Completed)

                expect(completed.currentStep).toBe(completed.maxSteps)
                expect(completed.error).toBeNull()
                expect(encodeAtMultipleBitrates).toHaveBeenCalledTimes(2)
                await waitForQueueState(successfulJobId,
                    "completed")
                const queueJob = await processVideoQueue.getJob(successfulJobId)
                expect(queueJob?.attemptsMade).toBe(2)
            })

        it("stores each packaged output once and never publishes the source as an output",
            async () => {
                const keys = await listOutputKeys(successfulJobId)

                expect(keys).toEqual([
                    `videos/${successfulJobId}/720.mp4`,
                    `videos/${successfulJobId}/manifest.mpd`,
                    `videos/${successfulJobId}/video/segment-1.m4s`,
                ])
                expect(new Set(keys).size).toBe(keys.length)
                expect(keys).not.toContain(`videos/${successfulJobId}/retry-source.mp4`)
            })

        it("marks a missing provider object terminally failed after the real queue exhausts retries",
            async () => {
                failedJobId = await postVideo("incoming/missing.mp4")
                const failed = await waitForTrackedJob(failedJobId,
                    JobStatus.Failed)

                expect(failed.currentStep).toBe(0)
                expect(failed.error).toBe("Failed to download video.")
                await waitForQueueState(failedJobId,
                    "failed")
                const queueJob = await processVideoQueue.getJob(failedJobId)
                expect(queueJob?.attemptsMade).toBe(2)
                expect(await listOutputKeys(failedJobId)).toEqual([])
                expect(encodeAtMultipleBitrates).toHaveBeenCalledTimes(2)
            })
    })
