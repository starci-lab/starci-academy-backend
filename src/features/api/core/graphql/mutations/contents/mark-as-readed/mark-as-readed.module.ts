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
import {
    ConfigurableModuleClass 
} from "./mark-as-readed.module-definition"

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
/** Isolated Nest registration for mark-as-read so progress writes can be global without sibling content mutations. */
export class MarkAsReadedSingleMutationModule extends ConfigurableModuleClass {}
