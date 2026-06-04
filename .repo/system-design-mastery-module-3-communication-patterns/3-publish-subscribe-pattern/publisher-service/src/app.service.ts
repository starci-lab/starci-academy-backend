/**
 * Publisher Service — emits event via NATS to `app.events` topic.
 */
import {
    Inject,
    Injectable,
    Logger,
    OnModuleInit,
} from "@nestjs/common"
import {
    ClientProxy,
} from "@nestjs/microservices"
import {
    firstValueFrom,
} from "rxjs"
import type {
    AppEventEnvelope,
    PublishRequestBody,
    PublishResponse,
} from "./types"

@Injectable()
/**
 * Class `AppService` — lesson lab component.
 */
export class AppService implements OnModuleInit {
    private readonly logger = new Logger(AppService.name)

    constructor(
        @Inject("NATS_SERVICE") private readonly nats: ClientProxy,
    ) {}

    /**
     * Logic — Connects NATS client when module initializes.
     * Code — `this.nats.connect()` opens connection to NATS server.
     */
    async onModuleInit() {
        await this.nats.connect()
    }

    /**
     * Logic — Extracts `type` + `payload` from body, attaches timestamp, emits fire-and-forget.
     * Code — `this.nats.emit("app.events", envelope)` broadcasts event to all subscribers.
     */
    async publish(body: PublishRequestBody): Promise<PublishResponse> {
        const type = typeof body.type === "string" ? body.type : "unknown"
        const payload = body.payload
        this.logger.log(`Publishing event ${type} to NATS`)

        const envelope: AppEventEnvelope = {
            type,
            payload,
            timestamp: new Date().toISOString(),
        }
        await firstValueFrom(
            this.nats.emit("app.events", envelope),
        )

        return {
            message: "Event Published",
            type,
        }
    }
}
