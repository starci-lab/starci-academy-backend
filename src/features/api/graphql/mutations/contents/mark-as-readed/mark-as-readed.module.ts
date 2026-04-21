import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    MarkAsReadedResolver,
} from "./mark-as-readed.resolver"
import {
    MarkAsReadedService,
} from "./mark-as-readed.service"
import {
    MarkAsReadedHandler,
} from "./mark-as-readed.handler"
import { ConfigurableModuleClass } from "./mark-as-readed.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        MarkAsReadedResolver,
        MarkAsReadedService,
        MarkAsReadedHandler,
    ],
    exports: [
        MarkAsReadedService,
    ],
})
export class MarkAsReadedSingleMutationModule extends ConfigurableModuleClass {}
