import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./changelog-entries.module-definition"
import {
    ChangelogEntriesResolver,
} from "./changelog-entries.resolver"

@Module({
    providers: [
        ChangelogEntriesResolver,
    ],
})
export class ChangelogEntriesSingleQueryModule extends ConfigurableModuleClass {}
