import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-xp-history.module-definition"
import {
    MyXpHistoryResolver,
} from "./my-xp-history.resolver"

@Module({
    providers: [
        MyXpHistoryResolver,
    ],
})
/**
 * Wires the `myXpHistory` resolver (reads `xp_histories` directly — no CQRS
 * handler). Registered globally from {@link ChallengesModule}.
 */
export class MyXpHistorySingleQueryModule extends ConfigurableModuleClass {}
