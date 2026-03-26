import {
    Module 
} from "@nestjs/common"
import {
    HttpModule 
} from "./http/http.module"
import {
    ConfigurableModuleClass 
} from "./api.module-definition"

/**
 * Module for the API.
 */
@Module({
    imports: [
        HttpModule.register({
            isGlobal: true,
        }),
    ],
})
export class ApiModule extends ConfigurableModuleClass {
}