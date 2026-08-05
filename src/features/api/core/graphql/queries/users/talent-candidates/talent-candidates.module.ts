import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./talent-candidates.module-definition"
import {
    TalentCandidatesResolver,
} from "./talent-candidates.resolver"
import {
    TalentCandidatesService,
} from "./talent-candidates.service"

@Module({
    providers: [
        TalentCandidatesResolver,
        TalentCandidatesService,
    ],
})
/**
 * Recruiter-marketplace query group — `talentCandidates` filters open-to-work
 * users to ONE track (course) and ranks them by that track's depth, backed by
 * {@link TalentCandidatesService}.
 */
export class TalentCandidatesSingleQueryModule extends ConfigurableModuleClass {}
