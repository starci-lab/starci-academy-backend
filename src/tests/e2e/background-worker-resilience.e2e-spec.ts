import crypto from "node:crypto"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    EventEmitterModule,
} from "@nestjs/event-emitter"
import {
    BullModule,
    getQueueToken,
} from "@nestjs/bullmq"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    MailerService,
} from "@nestjs-modules/mailer"
import type {
    Queue,
} from "bullmq"
import type {
    EntityManager,
} from "typeorm"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    EnqueueResolveGithubJobService,
} from "@modules/bussiness/jobs/enqueue/resolve-github.service"
import {
    EnqueueRevokeGithubJobService,
} from "@modules/bussiness/jobs/enqueue/revoke-github.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    GithubApiOrgService,
} from "@modules/integrations/github/org.service"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
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
    ResolveGithubWorker,
} from "@features/api/processors/resolve-github/resolve-github.worker"
import {
    ResolveGithubStepMappingService,
} from "@features/api/processors/resolve-github/step-mapping.service"
import {
    ProcessResolveGithubCompleteStepService,
} from "@features/api/processors/resolve-github/steps/process-resolve-github-complete-step.service"
import {
    ProcessResolveGithubSendStepService,
} from "@features/api/processors/resolve-github/steps/process-resolve-github-send-step.service"
import {
    ProcessResolveGithubUpdateUserStepService,
} from "@features/api/processors/resolve-github/steps/process-resolve-github-update-user-step.service"
import {
    RevokeGithubWorker,
} from "@features/api/processors/revoke-github/revoke-github.worker"
import {
    RevokeGithubStepMappingService,
} from "@features/api/processors/revoke-github/step-mapping.service"
import {
    ProcessRevokeGithubRemoveStepService,
} from "@features/api/processors/revoke-github/steps/process-revoke-github-remove-step.service"
import {
    SendMailWorker,
} from "@features/api/processors/send-mail/send-mail.worker"
import {
    SendMailStepMappingService,
} from "@features/api/processors/send-mail/step-mapping.service"
import {
    ProcessSendMailCompleteStepService,
} from "@features/api/processors/send-mail/steps/process-send-mail-complete-step.service"
import {
    ProcessSendMailStepService,
} from "@features/api/processors/send-mail/steps/process-send-mail-step.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"
import {
    until,
} from "@tests/helpers/flow-wait"

const mockGithubAdd = jest.fn()
const mockGithubRemove = jest.fn()

jest.mock("octokit",
    () => ({
        Octokit: jest.fn().mockImplementation(() => ({
            rest: {
                teams: {
                    addOrUpdateMembershipForUserInOrg: mockGithubAdd,
                    removeMembershipForUserInOrg: mockGithubRemove,
                },
            },
        })),
    }))

const queueData = [
    bullData[BullQueueName.SendMail],
    bullData[BullQueueName.ResolveGithub],
    bullData[BullQueueName.RevokeGithub],
]

/** Operational proof for the durable SMTP and GitHub integration workers. */
describe("background integration work survives retries and replays",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let sendMailQueue: Queue<string>
        let resolveGithubQueue: Queue<string>
        let revokeGithubQueue: Queue<string>
        let enqueueSendMail: EnqueueSendMailJobService
        let enqueueResolveGithub: EnqueueResolveGithubJobService
        let enqueueRevokeGithub: EnqueueRevokeGithubJobService

        const sendMail = jest.fn()

        const waitForJob = async (
            jobId: string,
            status: JobStatus,
        ): Promise<JobEntity> => {
            await until(async () => (await entityManager.findOneBy(JobEntity,
                {
                    id: jobId,
                }))?.status === status,
            {
                timeout: 20_000,
                describe: `background job ${jobId} to become ${status}`,
            })
            return entityManager.findOneByOrFail(JobEntity,
                {
                    id: jobId,
                })
        }

        const seedLearner = async (name: string): Promise<UserEntity> =>
            entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: `${name}-${crypto.randomUUID()}`,
                    username: name,
                    email: null,
                }))

        const installPostEffectFailure = async (jobId: string): Promise<void> => {
            await entityManager.query("CREATE SEQUENCE IF NOT EXISTS e2e_external_effect_failure_seq")
            await entityManager.query("ALTER SEQUENCE e2e_external_effect_failure_seq RESTART WITH 1")
            await entityManager.query("DROP TRIGGER IF EXISTS e2e_external_effect_failure ON jobs")
            await entityManager.query(`
                CREATE OR REPLACE FUNCTION e2e_fail_first_step_persist()
                RETURNS trigger AS $$
                BEGIN
                    IF NEW.id = '${jobId}'::uuid
                        AND NEW.current_step > OLD.current_step
                        AND nextval('e2e_external_effect_failure_seq') = 1 THEN
                        RAISE EXCEPTION 'injected post-effect persistence failure';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql
            `)
            await entityManager.query(`
                CREATE TRIGGER e2e_external_effect_failure
                BEFORE UPDATE ON jobs
                FOR EACH ROW EXECUTE FUNCTION e2e_fail_first_step_persist()
            `)
        }

        const removePostEffectFailure = async (): Promise<void> => {
            await entityManager.query("DROP TRIGGER IF EXISTS e2e_external_effect_failure ON jobs")
        }

        beforeAll(async () => {
            process.env.BULLMQ_ENQUEUE_UX_DELAY = "0ms"
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    EventEmitterModule.forRoot(),
                    BullModule.forRoot({
                        connection: {
                            host: process.env.REDIS_BULLMQ_HOST,
                            port: Number(process.env.REDIS_BULLMQ_PORT),
                            password: process.env.REDIS_BULLMQ_PASSWORD,
                        },
                    }),
                    BullModule.registerQueue(...queueData.map((queue) => ({
                        name: queue.name,
                        prefix: queue.prefix,
                        defaultJobOptions: {
                            attempts: 2,
                            backoff: {
                                type: "fixed",
                                delay: 10,
                            },
                            removeOnComplete: false,
                            removeOnFail: false,
                        },
                    }))),
                ],
                providers: [
                    createSuperJsonServiceProvider(),
                    DayjsService,
                    JobActionService,
                    EventEmitterService,
                    EnqueueSendMailJobService,
                    EnqueueResolveGithubJobService,
                    EnqueueRevokeGithubJobService,
                    GithubApiOrgService,
                    SendMailWorker,
                    SendMailStepMappingService,
                    ProcessSendMailStepService,
                    ProcessSendMailCompleteStepService,
                    ResolveGithubWorker,
                    ResolveGithubStepMappingService,
                    ProcessResolveGithubSendStepService,
                    ProcessResolveGithubUpdateUserStepService,
                    ProcessResolveGithubCompleteStepService,
                    RevokeGithubWorker,
                    RevokeGithubStepMappingService,
                    ProcessRevokeGithubRemoveStepService,
                    {
                        provide: MailerService,
                        useValue: {
                            sendMail,
                        },
                    },
                    {
                        provide: MountStorageService,
                        useValue: {
                            githubAccessToken: "e2e-github-token",
                        },
                    },
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
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = moduleRef.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            sendMailQueue = moduleRef.get(getQueueToken(queueData[0].name))
            resolveGithubQueue = moduleRef.get(getQueueToken(queueData[1].name))
            revokeGithubQueue = moduleRef.get(getQueueToken(queueData[2].name))
            enqueueSendMail = moduleRef.get(EnqueueSendMailJobService)
            enqueueResolveGithub = moduleRef.get(EnqueueResolveGithubJobService)
            enqueueRevokeGithub = moduleRef.get(EnqueueRevokeGithubJobService)
        })

        beforeEach(() => {
            sendMail.mockReset().mockResolvedValue({
                accepted: ["learner@example.test"],
            })
            mockGithubAdd.mockReset().mockResolvedValue({
                data: {
                    state: "active",
                    role: "member",
                },
            })
            mockGithubRemove.mockReset().mockResolvedValue({
                status: 204,
            })
        })

        afterEach(async () => {
            await removePostEffectFailure()
        })

        afterAll(async () => {
            await removePostEffectFailure()
            await app.close().catch(() => undefined)
        })

        it("delivers mail and persists a completed job",
            async () => {
                const job = await enqueueSendMail.enqueue({
                    to: [{
                        address: "learner@example.test",
                    }],
                    subject: "Worker success",
                    text: "Delivered by the production worker.",
                })
                const completed = await waitForJob(job.id,
                    JobStatus.Completed)

                expect(completed.currentStep).toBe(2)
                expect(completed.error).toBeNull()
                expect(sendMail).toHaveBeenCalledTimes(1)
                expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
                    messageId: job.id,
                    text: "Delivered by the production worker.",
                }))
            })

        it("retries an explicitly rejected SMTP call and then completes",
            async () => {
                sendMail.mockRejectedValueOnce(new Error("SMTP temporarily unavailable"))
                const job = await enqueueSendMail.enqueue({
                    to: [{
                        address: "learner@example.test",
                    }],
                    subject: "Retry mail",
                    text: "Retry me.",
                })
                const completed = await waitForJob(job.id,
                    JobStatus.Completed)

                expect(completed.currentStep).toBe(2)
                expect(sendMail).toHaveBeenCalledTimes(2)
            })

        it("persists terminal mail failure only after BullMQ exhausts retries",
            async () => {
                sendMail.mockRejectedValue(new Error("SMTP remains unavailable"))
                const job = await enqueueSendMail.enqueue({
                    to: [{
                        address: "learner@example.test",
                    }],
                    subject: "Failed mail",
                    text: "Cannot deliver.",
                })
                const failed = await waitForJob(job.id,
                    JobStatus.Failed)

                expect(failed.currentStep).toBe(0)
                expect(failed.error).toContain("SMTP remains unavailable")
                expect(sendMail).toHaveBeenCalledTimes(2)
            })

        it("does not redeliver mail when persistence fails after SMTP accepted it",
            async () => {
                await sendMailQueue.pause()
                const job = await enqueueSendMail.enqueue({
                    to: [{
                        address: "learner@example.test",
                    }],
                    subject: "At-most-once mail",
                    text: "One delivery.",
                })
                await until(async () => Boolean(await sendMailQueue.getJob(job.id)),
                    {
                        describe: "the paused send-mail queue to receive the job",
                    })
                await installPostEffectFailure(job.id)
                await sendMailQueue.resume()
                const completed = await waitForJob(job.id,
                    JobStatus.Completed)

                expect(completed.currentStep).toBe(2)
                expect(sendMail).toHaveBeenCalledTimes(1)
            })

        it("replaying a completed mail job is idempotent",
            async () => {
                const job = await enqueueSendMail.enqueue({
                    to: [{
                        address: "learner@example.test",
                    }],
                    subject: "Replay mail",
                    text: "Only once.",
                })
                const firstCompletion = await waitForJob(job.id,
                    JobStatus.Completed)
                await until(async () => {
                    const original = await sendMailQueue.getJob(job.id)
                    return original === undefined || await original.getState() === "completed"
                },
                {
                    describe: "the original mail broker job to settle",
                })
                await sendMailQueue.remove(job.id)
                await until(async () => (await sendMailQueue.getJob(job.id)) === undefined,
                    {
                        describe: "the original mail broker job to be removed",
                    })
                await sendMailQueue.add(job.id,
                    job.payload,
                    {
                        jobId: job.id,
                        attempts: 2,
                        removeOnComplete: false,
                        removeOnFail: false,
                    })
                await until(async () => (await entityManager.findOneByOrFail(JobEntity,
                    {
                        id: job.id,
                    })).fencingToken > firstCompletion.fencingToken,
                {
                    describe: "the replayed mail broker job to be consumed",
                })

                expect(await entityManager.findOneByOrFail(JobEntity,
                    {
                        id: job.id,
                    })).toMatchObject({
                    currentStep: 2,
                    status: JobStatus.Completed,
                })
                expect(sendMail).toHaveBeenCalledTimes(1)
            })

        it("resolves GitHub membership through all three durable steps",
            async () => {
                const learner = await seedLearner("resolve-success")
                const job = await enqueueResolveGithub.enqueue({
                    userId: learner.id,
                    githubUsername: "resolve-success",
                    teamSlug: "course-team",
                })
                const completed = await waitForJob(job.id,
                    JobStatus.Completed)
                const updatedLearner = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id,
                    })

                expect(completed.currentStep).toBe(3)
                expect(updatedLearner.githubUsername).toBe("resolve-success")
                expect(mockGithubAdd).toHaveBeenCalledTimes(1)
            })

        it("retries a rejected GitHub membership request",
            async () => {
                mockGithubAdd.mockRejectedValueOnce(new Error("GitHub 503"))
                const learner = await seedLearner("resolve-retry")
                const job = await enqueueResolveGithub.enqueue({
                    userId: learner.id,
                    githubUsername: "resolve-retry",
                    teamSlug: "course-team",
                })
                const completed = await waitForJob(job.id,
                    JobStatus.Completed)

                expect(completed.currentStep).toBe(3)
                expect(mockGithubAdd).toHaveBeenCalledTimes(2)
            })

        it("fails resolve-github terminally without updating the learner",
            async () => {
                mockGithubAdd.mockRejectedValue(new Error("GitHub unavailable"))
                const learner = await seedLearner("resolve-failed")
                const job = await enqueueResolveGithub.enqueue({
                    userId: learner.id,
                    githubUsername: "resolve-failed",
                    teamSlug: "course-team",
                })
                const failed = await waitForJob(job.id,
                    JobStatus.Failed)
                const unchangedLearner = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id,
                    })

                expect(failed.currentStep).toBe(0)
                expect(failed.error).toContain("GitHub unavailable")
                expect(unchangedLearner.githubUsername).toBeNull()
                expect(mockGithubAdd).toHaveBeenCalledTimes(2)
            })

        it("does not repeat GitHub add after its first persistence attempt fails",
            async () => {
                await resolveGithubQueue.pause()
                const learner = await seedLearner("resolve-persist-retry")
                const job = await enqueueResolveGithub.enqueue({
                    userId: learner.id,
                    githubUsername: "resolve-persist-retry",
                    teamSlug: "course-team",
                })
                await until(async () => Boolean(await resolveGithubQueue.getJob(job.id)),
                    {
                        describe: "the paused resolve-github queue to receive the job",
                    })
                await installPostEffectFailure(job.id)
                await resolveGithubQueue.resume()
                const completed = await waitForJob(job.id,
                    JobStatus.Completed)

                expect(completed.currentStep).toBe(3)
                expect(mockGithubAdd).toHaveBeenCalledTimes(1)
            })

        it("revokes GitHub membership and persists completion",
            async () => {
                const learner = await seedLearner("revoke-success")
                const job = await enqueueRevokeGithub.enqueue({
                    userId: learner.id,
                    githubUsername: "revoke-success",
                    teamSlug: "course-team",
                })
                const completed = await waitForJob(job.id,
                    JobStatus.Completed)

                expect(completed.currentStep).toBe(1)
                expect(mockGithubRemove).toHaveBeenCalledTimes(1)
            })

        it("retries a rejected GitHub revoke request",
            async () => {
                mockGithubRemove.mockRejectedValueOnce(new Error("GitHub 502"))
                const learner = await seedLearner("revoke-retry")
                const job = await enqueueRevokeGithub.enqueue({
                    userId: learner.id,
                    githubUsername: "revoke-retry",
                    teamSlug: "course-team",
                })
                const completed = await waitForJob(job.id,
                    JobStatus.Completed)

                expect(completed.currentStep).toBe(1)
                expect(mockGithubRemove).toHaveBeenCalledTimes(2)
            })

        it("persists terminal revoke failure after retry exhaustion",
            async () => {
                mockGithubRemove.mockRejectedValue(new Error("GitHub revoke unavailable"))
                const learner = await seedLearner("revoke-failed")
                const job = await enqueueRevokeGithub.enqueue({
                    userId: learner.id,
                    githubUsername: "revoke-failed",
                    teamSlug: "course-team",
                })
                const failed = await waitForJob(job.id,
                    JobStatus.Failed)

                expect(failed.currentStep).toBe(0)
                expect(failed.error).toContain("GitHub revoke unavailable")
                expect(mockGithubRemove).toHaveBeenCalledTimes(2)
            })

        it("does not repeat GitHub revoke after its first persistence attempt fails",
            async () => {
                await revokeGithubQueue.pause()
                const learner = await seedLearner("revoke-persist-retry")
                const job = await enqueueRevokeGithub.enqueue({
                    userId: learner.id,
                    githubUsername: "revoke-persist-retry",
                    teamSlug: "course-team",
                })
                await until(async () => Boolean(await revokeGithubQueue.getJob(job.id)),
                    {
                        describe: "the paused revoke-github queue to receive the job",
                    })
                await installPostEffectFailure(job.id)
                await revokeGithubQueue.resume()
                const completed = await waitForJob(job.id,
                    JobStatus.Completed)

                expect(completed.currentStep).toBe(1)
                expect(mockGithubRemove).toHaveBeenCalledTimes(1)
            })
    })
