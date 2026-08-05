import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./user.module-definition"
import {
    UserService,
} from "./user.service"

@Module({
    providers: [
        UserService,
    ],
    exports: [
        UserService,
    ],
})
/**
 * The module for the bussiness logics.
 */
export class UserModule extends ConfigurableModuleClass {
}