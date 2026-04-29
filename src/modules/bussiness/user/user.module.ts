import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./user.module-definition"
import {
    UserService,
} from "./user.service"

/**
 * The module for the bussiness logics.
 */
@Module({
    providers: [
        UserService,
    ],
    exports: [
        UserService,
    ],
})
export class UserModule extends ConfigurableModuleClass {
}