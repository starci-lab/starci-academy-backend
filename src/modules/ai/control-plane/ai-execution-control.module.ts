import {
    Module,
} from "@nestjs/common"
import {
    AiExecutionControlService,
} from "./ai-execution-control.service"

@Module({
    providers: [AiExecutionControlService],
    exports: [AiExecutionControlService],
})
/** Test-composition-only module for the dark Slice 00 execution control plane. */
export class AiExecutionControlModule {
}
