import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-cv-generations.module-definition"
import {
    MyCvGenerationsResolver,
} from "./my-cv-generations.resolver"
import {
    MyCvGenerationsService,
} from "./my-cv-generations.service"
import {
    MyCvGenerationsHandler,
} from "./my-cv-generations.handler"

@Module({
    providers: [
        MyCvGenerationsResolver,
        MyCvGenerationsService,
        MyCvGenerationsHandler,
    ],
})
/**
 * Wires resolver, service, and handler for `myCvGenerations` (lightweight
 * history list). Register globally from the CV queries aggregator.
 */
export class MyCvGenerationsSingleQueryModule extends ConfigurableModuleClass {}
