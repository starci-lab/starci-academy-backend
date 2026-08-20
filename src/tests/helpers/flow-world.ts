import {
    Test,
} from "@nestjs/testing"
import request from "supertest"
import type {
    INestApplication,
    ModuleMetadata,
    Provider,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    EmailBloomFilterService,
} from "@modules/bussiness/bloom-filters/email.service"
import {
    TestHelpersModule,
} from "./test-helpers.module"
import type {
    FlowGraphqlRequest,
    FlowGraphqlResponse,
} from "./types/flow-transport"

/**
 * One place that stands the world up for a flow test.
 *
 * A flow file should open with what it is TESTING, not with two hundred lines of wiring -- and when
 * the wiring changes, one file should change rather than twenty-five. See `e2e-flow.md` FLOW-8.
 *
 * WHAT IS ALWAYS REAL: the primary Postgres datasource (against the Testcontainers stack the lane's
 * `globalSetup` boots), the CQRS bus with its automatic handler discovery, and every domain service
 * a flow asks for. A flow that does not write real rows is not a flow test.
 *
 * WHAT IS ALWAYS STUBBED: the model. Reaching a provider from this lane costs money, takes seconds
 * and answers differently every time, so the stub is the DEFAULT rather than something each flow
 * author remembers -- a rule that must be remembered is one distracted afternoon from being broken.
 * See `testing.md` TESTING-9.
 *
 * HOW A FLOW OVERRIDES A DEFAULT: name the same token in `options.providers`. Those are appended
 * AFTER the defaults, and Nest resolves a duplicated token to the last one registered.
 */

/** The canned model answer a flow gets unless it says otherwise. */
export interface StubbedModelAnswer {
    /** The raw text the app's parser receives. Realistic JSON, never a marker. */
    text: string
    /** Which model the answer claims to be from, for assertions about metadata. */
    model?: string
}

/** What a flow asks the world to boot. */
export interface FlowWorldOptions extends Pick<ModuleMetadata, "imports" | "controllers"> {
    /** Domain providers this flow exercises. Real ones -- stub only what leaves the process. */
    providers?: Array<Provider>
    /**
     * The model answer every AI call returns.
     *
     * Give REALISTIC JSON in the shape the flow's parser expects: a marker string skips the
     * strict-JSON parser entirely, and that parser is the seam most likely to break, because it is
     * where a model's output meets a schema.
     */
    modelAnswer?: StubbedModelAnswer
}

/** A jest-backed stand-in for the model client, so a flow can reprogram and assert it. */
export interface StubbedModelClient {
    /** The single call every AI invocation goes through. */
    run: jest.Mock
}

/** A booted world, and the handles a flow needs. */
export interface FlowWorld {
    /** The Nest application, for `supertest` against real controllers. */
    app: INestApplication
    /** The primary entity manager, for reading the consequence back. */
    entityManager: EntityManager
    /** Send an operation through the real GraphQL HTTP pipeline. */
    graphql: <TData>(operation: FlowGraphqlRequest) => Promise<FlowGraphqlResponse<TData>>
    /** The stubbed model, so a flow can reprogram it per step and assert it was reached. */
    model: StubbedModelClient
    /** Mint a fresh learner. Named actors, never magic ordinals -- see FLOW-9. */
    mintLearner: (name: string) => Promise<UserEntity>
    /** Empty the tables a flow writes, so flows can run in any order. */
    truncate: (...tables: Array<string>) => Promise<void>
    /** Shut the application down. */
    close: () => Promise<void>
}

/** The answer a flow gets when it does not name one -- valid JSON, so the parser still runs. */
const DEFAULT_MODEL_ANSWER: StubbedModelAnswer = {
    text: JSON.stringify({
        answer: "A stubbed but well-formed answer.",
    }),
    model: "stub",
}

/**
 * Boot a world for one flow.
 *
 * @param options - {@link FlowWorldOptions}
 * @returns the booted {@link FlowWorld}
 */
export const bootFlowWorld = async (
    options: FlowWorldOptions = {
    },
): Promise<FlowWorld> => {
    const answer = options.modelAnswer ?? DEFAULT_MODEL_ANSWER

    // the stub is a jest mock so a flow can reprogram it per step and assert it was reached --
    // "the model was asked once" is a real assertion about quota and caching
    const model = {
        run: jest.fn().mockResolvedValue({
            text: answer.text,
            model: answer.model ?? "stub",
            provider: "stub",
            attempts: 1,
            cost: 0,
            promptTokens: 0,
            completionTokens: 0,
        }),
    }

    const moduleRef = await Test.createTestingModule({
        imports: [
            TestHelpersModule,
            PrimaryPostgreSQLModule.register({
                isGlobal: true,
                withHydration: false,
                withResolvers: false,
            }),
            CqrsModule,
            ...(options.imports ?? []),
        ],
        controllers: options.controllers ?? [],
        providers: [
            {
                provide: AiInvokeService,
                useValue: model,
            },
            // The infrastructure no flow exercises, stubbed once here rather than in twenty-five
            // files. These read mounted config off disk and hold encryption keys: real ones give a
            // flow nothing but a reason to fail in a way that has nothing to do with the business.
            {
                provide: MountFilesystemService,
                useValue: {
                    appConfig: () => ({
                        subscriptions: {
                            tiers: [],
                        },
                    }),
                },
            },
            {
                provide: AiAutoQuotaConfigService,
                useValue: {
                    getAutoQuota: () => ({
                        usesPer5h: 30,
                        usesPerWeek: 100,
                    }),
                },
            },
            {
                provide: EncryptionService,
                useValue: {
                    encrypt: jest.fn(),
                    decrypt: jest.fn(),
                },
            },
            // Cache is Redis: a flow that hits it is testing Redis, and a MISS is the honest
            // default anyway -- it makes every read go to the database, which is where a flow
            // wants its assertions to be answered from.
            {
                provide: CacheService,
                useValue: {
                    get: jest.fn().mockResolvedValue(undefined),
                    set: jest.fn().mockResolvedValue(undefined),
                    del: jest.fn().mockResolvedValue(undefined),
                    getOrSet: jest.fn(async (
                        _key: string,
                        produce: () => unknown,
                    ) => produce()),
                },
            },
            // Sign-in OTP flows update the best-effort email bloom filter when
            // they create a learner. Keep the cache seam deterministic while
            // retaining the real handler and database path.
            {
                provide: EmailBloomFilterService,
                useValue: {
                    add: jest.fn().mockResolvedValue(undefined),
                },
            },
            /*
             * A FLOW'S OWN PROVIDERS COME LAST, AND THE ORDER IS THE WHOLE MECHANISM.
             *
             * Nest resolves a duplicated token to the provider registered LAST, so a flow that
             * needs a richer MountFilesystemService (say, one whose appConfig carries the
             * membership product) only gets it if its own entry comes after the default. This
             * file originally listed them first with a comment claiming the opposite, and the
             * symptom was a stub that silently lost every time -- the default answered, the
             * override never ran, and the failure surfaced far away as a missing config field.
             */
            ...(options.providers ?? []),
        ],
    }).compile()

    const app = moduleRef.createNestApplication()
    await app.init()

    const entityManager = app.get<EntityManager>(
        getEntityManagerToken(POSTGRESQL_PRIMARY),
    )

    return {
        app,
        entityManager,
        graphql: async <TData>(operation: FlowGraphqlRequest): Promise<FlowGraphqlResponse<TData>> => {
            let transport = request(app.getHttpServer())
                .post("/graphql")
                .send({
                    query: operation.query,
                    variables: operation.variables ?? {
                    },
                })
            for (const [
                name,
                value,
            ] of Object.entries(operation.headers ?? {
                })) {
                transport = transport.set(name,
                    value)
            }
            const response = await transport
            return response.body as FlowGraphqlResponse<TData>
        },
        model,
        mintLearner: async (
            name: string,
        ): Promise<UserEntity> => entityManager.save(
            entityManager.create(UserEntity,
                {
                    // named, not an ordinal: two flows picking the same number collide in silence
                    keycloakId: `kc-flow-${name}-${Date.now()}`,
                }),
        ),
        truncate: async (
            ...tables: Array<string>
        ): Promise<void> => {
            if (tables.length === 0) {
                return
            }
            const quoted = tables.map((table) => `"${table}"`).join(", ")
            await entityManager.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`)
        },
        close: async (): Promise<void> => {
            await app.close().catch(() => undefined)
        },
    }
}
