import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./bento4.module-definition"
import {
    Bento4Service 
} from "./bento4.service"

@Module({
    providers: [Bento4Service],
    exports: [Bento4Service],
})
export class Bento4Module extends ConfigurableModuleClass {}
