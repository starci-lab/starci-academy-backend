import {
    Injectable 
} from "@nestjs/common"
import {
    EventEmitter2 
} from "@nestjs/event-emitter"
import {
    configMap 
} from "./config"
import {
    EventName,
} from "./enums/event-name"
import {
    getEventName,
} from "./utils/event"
import {
    NatsMessageFactoryService,
} from "./nats/nats-message-factory.service"
import {
    NatsProducerService,
} from "./nats/producer.service"
import {
    EmitParams,
    OffParams,
    OnParams,
} from "./types/emitter"

@Injectable()
/** Event emitter service. */
export class EventEmitterService {
    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly natsProducerService: NatsProducerService,
        private readonly natsMessageFactoryService: NatsMessageFactoryService,
    ) {}

    /**
     * Emit an event.
     */
    async emit<T extends EventName>({
        event,
        args,
        payload,
        options = {
        },
    }: EmitParams<T>): Promise<void> {
        const config = configMap[event]
        const eventName = getEventName(event,
            args)

        const useLocal =
            options?.useLocal !== undefined
                ? options.useLocal
                : config?.useLocal
        const useNats =
            options?.useNats !== undefined
                ? options.useNats
                : config?.useNats

        if (useLocal) {
            this.eventEmitter.emit(eventName,
                payload)
        }
        if (useNats) {
            const serialized = this.natsMessageFactoryService.create({
                message: payload,
            })
            this.natsProducerService.publish({
                subject: eventName,
                payload: serialized,
            })
        }
    }
    /**
     * On an event.
     */
    on<T extends EventName>({ event, args, listener }: OnParams<T>): void {
        const eventName = getEventName(event,
            args)
        this.eventEmitter.on(eventName,
            listener)
    }

    /**
     * Off an event.
     */
    off<T extends EventName>({ event, args, listener }: OffParams<T>): void {
        const eventName = getEventName(event,
            args)
        this.eventEmitter.off(eventName,
            listener)
    }
}
