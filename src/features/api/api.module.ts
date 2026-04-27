import {
    Module 
} from "@nestjs/common"
import {
    CoreModule,
} from "./core"
import {
    ConfigurableModuleClass 
} from "./api.module-definition"

/**
 * Module for the API.
 */
@Module({
    imports: [
        CoreModule.register({
            isGlobal: true,
        }),
    ],
})
export class ApiModule extends ConfigurableModuleClass {
}