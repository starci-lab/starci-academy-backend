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
/** Feature-module boundary for the `changelogEntries` query — wires its resolver so the dashboard group can mount this widget independently. */
export class ChangelogEntriesSingleQueryModule extends ConfigurableModuleClass {}
