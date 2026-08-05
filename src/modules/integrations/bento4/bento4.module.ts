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
/**
 * Wires {@link Bento4Service} so the video worker can fragment/package MPEG-DASH
 * without each consumer resolving `.exe/Bento4` binaries itself.
 */
export class Bento4Module extends ConfigurableModuleClass {}
