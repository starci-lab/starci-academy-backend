import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./services.module-definition"
import {
    ValidateService,
} from "./validate.service"
import {
    PaginateService,
} from "./paginate.service"

@Module({
    providers: [
        ValidateService,
        PaginateService,
    ],
    exports: [
        ValidateService,
        PaginateService,
    ],
})
/**
 * Shared Apollo helpers (paginate + validate) so query leaves do not each
 * reimplement offset math or input checks against the same GraphQL types.
 */
export class ServicesModule extends ConfigurableModuleClass {
}
