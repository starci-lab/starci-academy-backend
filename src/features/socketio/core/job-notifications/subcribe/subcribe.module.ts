import {
    Module,
} from "@nestjs/common"
import {
    SubcribeJobNotificationGateway,
} from "./subcribe.gateway"
import {
    SubcribeJobNotificationHandler,
} from "./handle-subcribe/subcribe.handler"
import {
    SubcribeJobNotificationService,
} from "./handle-subcribe/subcribe.service"
import {
    ConfigurableModuleClass,
} from "./subcribe.module-definition"

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
/**
 * Module providing Socket.IO job notification subscription.
 */
export class SubcribeJobNotificationModule extends ConfigurableModuleClass {}

