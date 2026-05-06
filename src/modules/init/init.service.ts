import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    SeedersService,
} from "./seeders"
import {
    SynchronizersService,
} from "./synchronizers"

/**
 * Plugin-based initialization service.
 *
 * Reads `envConfig().init`, filters enabled handlers, sorts by `order`,
 * and executes each handler's `init()` method sequentially during
 * `onModuleInit` — before the app starts listening.
 */
@Injectable()
export class InitService implements OnModuleInit {

    /** Map handler names to their service instances. */
    private readonly handlers: Record<string, { init: () => Promise<void> }>

    constructor(
        private readonly seedersService: SeedersService,
        private readonly synchronizersService: SynchronizersService,
    ) {
        this.handlers = {
            seeders: this.seedersService,
            synchronizers: this.synchronizersService,
        }
    }

    /**
     * Runs enabled init handlers sequentially, sorted by order.
     */
    async onModuleInit(): Promise<void> {
        const initConfig = envConfig().init
            .filter((handler) => handler.enabled)
            .sort((prev, next) => prev.order - next.order)

        for (const handlerConfig of initConfig) {
            const handler = this.handlers[handlerConfig.name]
            if (handler) {
                await handler.init()
            }
        }
    }
}
