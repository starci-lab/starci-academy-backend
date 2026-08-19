import type {
    INestApplicationContext,
} from "@nestjs/common"
import {
    Global,
    Module,
} from "@nestjs/common"
import {
    EventEmitterModule,
} from "@nestjs/event-emitter"
import {
    ScheduleModule,
} from "@nestjs/schedule"
import {
    Test,
} from "@nestjs/testing"
import type {
    NatsConnection,
} from "nats"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    StreamAsyncIteratorService,
} from "@modules/lib/stream-async-iterator/stream-async-iterator.service"
import type {
    CreateStreamParams,
} from "@modules/lib/stream-async-iterator/types/create-stream"
import type {
    StreamConnection,
} from "@modules/lib/stream-async-iterator/types/stream-connection"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    EventModule,
} from "@modules/platform/event/event.module"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    NATS,
} from "@modules/platform/event/nats/constants/nats"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"

interface RetryAction<T> {
    action: () => Promise<T>
}

/** Runs the bridge action once; reconnect policy is not the subject of this flow. */
class OneShotRetryService {
    async retry<T>({ action }: RetryAction<T>): Promise<T | undefined> {
        try {
            return await action()
        } catch {
            // Closing the focused app closes its tracked stream. Production uses
            // infinite retry, but the E2E lifecycle must not reopen a torn-down pod.
            return undefined
        }
    }
}

/** The call arguments {@link NatsDigestCache} keys its entries by. */
interface NatsDigestCacheKeyParams {
    args?: Array<unknown>
}

/** The call arguments and result {@link NatsDigestCache} stores under one entry. */
interface NatsDigestCacheSetParams extends NatsDigestCacheKeyParams {
    cacheResult: unknown
}

/** Process-local digest cache with the same get/set contract used by the bridge. */
class NatsDigestCache {
    private readonly entries = new Map<string, unknown>()

    async get(params: NatsDigestCacheKeyParams): Promise<unknown> {
        return this.entries.get(JSON.stringify(params.args ?? []))
    }

    async set(params: NatsDigestCacheSetParams): Promise<void> {
        this.entries.set(
            JSON.stringify(params.args ?? []),
            params.cacheResult,
        )
    }
}

/** Exposes subscription readiness and deterministic teardown around the real stream adapter. */
class NatsStreamProbeService extends StreamAsyncIteratorService {
    private readonly connections: Array<StreamConnection<unknown>> = []
    private brokerMessageCount = 0
    private readyResolve?: () => void
    private readonly ready = new Promise<void>((resolve) => {
        this.readyResolve = resolve
    })

    override async createStream<TData>(
        params: CreateStreamParams<TData>,
    ): Promise<AsyncIterable<TData>> {
        this.connections.push(params.connection)
        const originalOnOpen = params.onOpen

        const stream = await super.createStream({
            ...params,
            onOpen: async (connection) => {
                await originalOnOpen?.(connection)
                // Resolve on the next microtask, after StreamAsyncIteratorService
                // installs its data/error/close handlers around the subscription.
                queueMicrotask(() => this.readyResolve?.())
            },
        })
        const recordBrokerMessage = () => {
            this.brokerMessageCount += 1
        }
        return {
            async *[Symbol.asyncIterator](): AsyncIterator<TData> {
                for await (const value of stream) {
                    recordBrokerMessage()
                    yield value
                }
            },
        }
    }

    async untilReady(): Promise<void> {
        await this.ready
    }

    getBrokerMessageCount(): number {
        return this.brokerMessageCount
    }

    async close(): Promise<void> {
        await Promise.all(this.connections.map(async connection => connection.close()))
        this.connections.length = 0
    }
}

@Global()
@Module({
})
class NatsE2eDependenciesModule {
    static register() {
        const streamProbe = new NatsStreamProbeService()
        return {
            global: true,
            module: NatsE2eDependenciesModule,
            providers: [
                createSuperJsonServiceProvider(),
                DayjsService,
                {
                    provide: RetryService,
                    useClass: OneShotRetryService,
                },
                {
                    provide: StreamAsyncIteratorService,
                    useValue: streamProbe,
                },
                {
                    provide: CacheService,
                    useValue: new NatsDigestCache(),
                },
                {
                    provide: WinstonService,
                    useValue: {
                        log: () => undefined,
                    },
                },
            ],
            exports: [
                DayjsService,
                RetryService,
                StreamAsyncIteratorService,
                CacheService,
                WinstonService,
                createSuperJsonServiceProvider(),
            ],
        }
    }
}

/** One focused Nest instance wired to the real shared NATS broker. */
export interface NatsCrossInstanceApp {
    app: INestApplicationContext
    events: EventEmitterService
    untilReady: () => Promise<void>
    getBrokerMessageCount: () => number
    close: () => Promise<void>
}

/** Boot a production event publisher/bridge graph for one logical app instance. */
export const createNatsCrossInstanceApp = async (): Promise<NatsCrossInstanceApp> => {
    const app = await Test.createTestingModule({
        imports: [
            EventEmitterModule.forRoot(),
            ScheduleModule.forRoot(),
            NatsE2eDependenciesModule.register(),
            EventModule.register({
                nats: {
                    subjects: [EventName.ChatMessageCreated],
                },
            }),
        ],
    }).compile()
    await app.init()

    const streamProbe = app.get(StreamAsyncIteratorService) as NatsStreamProbeService
    const nats = app.get<NatsConnection>(NATS)

    return {
        app,
        events: app.get(EventEmitterService),
        untilReady: async () => streamProbe.untilReady(),
        getBrokerMessageCount: () => streamProbe.getBrokerMessageCount(),
        close: async () => {
            await streamProbe.close()
            await nats.drain()
            await app.close()
        },
    }
}
