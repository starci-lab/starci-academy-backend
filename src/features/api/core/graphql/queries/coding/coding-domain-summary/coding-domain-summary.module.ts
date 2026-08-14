import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding-domain-summary.module-definition"
import {
    CodingDomainSummaryResolver,
} from "./coding-domain-summary.resolver"
import {
    CodingDomainSummaryService,
} from "./coding-domain-summary.service"
import {
    CodingDomainSummaryHandler,
} from "./coding-domain-summary.handler"

@Module({
    providers: [
        CodingDomainSummaryService,
        CodingDomainSummaryResolver,
        CodingDomainSummaryHandler,
    ],
})
/**
 * Wires resolver, service, and handler for the `codingDomainSummary` leaf.
 * Registered globally from {@link CodingModule}.
 */
export class CodingDomainSummarySingleQueryModule extends ConfigurableModuleClass {}
