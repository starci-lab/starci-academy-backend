/**
 * Service that bridges NATS messages to NestJS EventEmitter.
 *
 * Subscribes to NATS subjects and emits events to the local EventEmitter,
 * filtering out messages from the same instance and deduplicating by digest.
 *
 * @example
 * Injected via NatsModule; subscribes on init to configured subjects.
 */
import type {
    NatsConfigMapEntryMetadata 
} from "./types"
import {
    Inject,
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    EventEmitter2 
} from "@nestjs/event-emitter"
import intersection from "lodash/intersection"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    CacheType,
} from "@modules/integrations/cache/enums/cache-type"
import {
    InstanceService,
} from "@modules/lib/mixin/instance.service"
import {
    configMap 
} from "../config"
import {
    EventName,
} from "../enums/event-name"
import {
    getEventName,
} from "../utils/event"
import {
    NatsMessageFactoryService
} from "./nats-message-factory.service"
import {
    MODULE_OPTIONS_TOKEN,
    OPTIONS_TYPE,
} from "./nats.module-definition"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    NatsStreamConnection,
} from "@modules/lib/stream-async-iterator/adapters/nats.adapter"
import {
    InjectNats 
} from "./nats.decorators"
import type {
    NatsConnection 
} from "nats"
import {
    Dayjs 
} from "dayjs"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    StreamAsyncIteratorService,
} from "@modules/lib/stream-async-iterator/stream-async-iterator.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    v4 
} from "uuid"

@Injectable()
/**
 * Service that bridges NATS messages to NestJS EventEmitter.
 *
 * Subscribes to NATS subjects and emits events to the local EventEmitter,
 * filtering out messages from the same instance and deduplicating by digest.
 *
 * @example
 * Injected via NatsModule; subscribes on init to configured subjects.
 */
export class NatsBridgeService implements OnModuleInit {
    private subjects: Array<string> = []

    constructor(
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly options: typeof OPTIONS_TYPE,
        private readonly eventEmitter: EventEmitter2,
        private readonly natsMessageFactoryService: NatsMessageFactoryService,
        private readonly cacheService: CacheService,
        private readonly instanceService: InstanceService,
        private readonly retryService: RetryService,
        private readonly streamAsyncIteratorService: StreamAsyncIteratorService,
        @InjectNats()
        private readonly nc: NatsConnection,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {}

    async onModuleInit(): Promise<void> {
        // get all NATS subjects from config
        const allNatsSubjects = Object.entries(configMap)
            .filter(
                ([, metadata]) =>
                    (metadata as NatsConfigMapEntryMetadata).useNats,
            )
            .map(([eventName]) => eventName)
        // get all subjects from config and intersection with options subjects
        this.subjects = intersection(
            allNatsSubjects,
            [
                ...new Set([
                    ...(this.options.subjects ?? []),
                    EventName.Ping
                ]),
            ],
        )
        await this.bridgeEvents()

    }

    /**
     * Bridges all Kafka events to EventEmitter.
     *
     * Subscribes to configured topics and starts consuming messages,
     * emitting them to the local EventEmitter while filtering out
     * messages from the same instance.
     *
     * @returns Promise that resolves when subscription is set up
     */
    async bridgeEvents(): Promise<void> {
        this.retryService.retry(
            {
                options: {
                    retries: Infinity,
                },
                action: async () => {
                    // create the connection
                    const connection = new NatsStreamConnection(
                        {
                            nc: this.nc,
                            subjects: this.subjects,
                            queueGroup: v4(),
                        }
                    )
                    // create abort controller for connection management
                    const abortController = new AbortController()
                    // create timeout for connection idle detection
                    let timeout: NodeJS.Timeout | undefined = undefined
                    // reset timeout function to keep connection alive
                    const resetTimeout = () => {
                        if (timeout) {
                            clearTimeout(timeout)
                        }
                        timeout = setTimeout(
                            () => abortController.abort(),
                            envConfig().nats.consumer.idleTimeout,
                        )
                    }
                    // create start time for duration calculation
                    let startTime: Dayjs | null = null
                    // create the stream
                    const stream = await this.streamAsyncIteratorService.createStream({
                        connection,
                        signal: abortController.signal,
                        onOpen: () => {
                            // log connection opened
                            this.winstonService.log(
                                WinstonLog.NatsConsumerOpened,
                                {
                                    subjects: this.subjects
                                }
                            )
                            startTime = this.dayjsService.now()
                        },
                        onClose: () => {
                            // log connection closed
                            this.winstonService.log(
                                WinstonLog.NatsConsumerClosed,
                                {
                                    subjects: this.subjects,
                                    durationMs: startTime
                                        ? this.dayjsService.now().diff(
                                            startTime,
                                            "millisecond"
                                        )
                                        : null,
                                }
                            )
                        },
                        onError: (error: Error) => {
                            // log error with info level
                            this.winstonService.log(
                                WinstonLog.NatsConsumerError,
                                {
                                    subjects: this.subjects,
                                    error: error.message,
                                    stack: error.stack,
                                }
                            )
                        },
                    })
                    // reset timeout when the stream is opened
                    resetTimeout()
                    // consume the stream
                    for await (const payload of stream) {
                        // get subject and data
                        const { subject, data } = payload
                        // parse message value
                        const value = new TextDecoder().decode(data) || "{}"
                        const parsed = this.natsMessageFactoryService.parse(value)
                        // `subject` identifies the event; producer identity lives
                        // in the serialized envelope. Comparing the subject to an
                        // instance id never matched and caused the publishing pod
                        // to re-emit its own local event a second time.
                        if (parsed.id === this.instanceService.getId()) {
                            continue
                        }
                        // if subject is ping, skip it
                        if (subject === EventName.Ping) {
                            resetTimeout()
                            continue
                        }
                        // we check the digest to prevent duplicate messages
                        const cached = await this.cacheService.get(
                            {
                                key: CacheKey.NatsMessageDigest,
                                args: [parsed.digest],
                                cacheType: CacheType.Memory,
                            }
                        )
                        // if the message is already in cache, skip it
                        if (cached) {
                            continue
                        }
                        // set the message in cache
                        await this.cacheService.set(
                            {
                                key: CacheKey.NatsMessageDigest,
                                args: [parsed.digest],
                                cacheResult: true,
                                cacheType: CacheType.Memory,
                            }
                        )
                        // emit event to local EventEmitter
                        this.eventEmitter.emit(
                            getEventName(subject as EventName),
                            parsed.data
                        )
                        // reset timeout to keep connection alive
                        resetTimeout()
                    }
                }
            }
        )
    }
}
