import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./execa.module-definition"
import {
    ExecaService 
} from "./execa.service"

@Module({
    providers: [
        ExecaService,
    ],
    exports: [ExecaService],
})
/**
 * Exposes {@link ExecaService} so shell-outs (Bento4, ffmpeg helpers, git) share
 * one no-shell exec wrapper with house timeouts/error mapping.
 */
export class ExecaModule extends ConfigurableModuleClass {}