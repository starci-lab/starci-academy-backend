import {
    Module,
} from "@nestjs/common"
import {
    SubcribeJobNotificationGateway,
} from "./subcribe.gateway"
import {
    SubcribeJobNotificationHandler,
    SubcribeJobNotificationService,
} from "./handle-subcribe"
import {
    ConfigurableModuleClass,
} from "./subcribe.module-definition"

/**
 * Module providing Socket.IO job notification subscription.
 */
@Module({
    providers: [
        SubcribeJobNotificationGateway,
        SubcribeJobNotificationService,
        SubcribeJobNotificationHandler,
    ],
    exports: [
        SubcribeJobNotificationGateway,
        SubcribeJobNotificationService,
        SubcribeJobNotificationHandler,
    ],
})
export class SubcribeJobNotificationModule extends ConfigurableModuleClass {}

