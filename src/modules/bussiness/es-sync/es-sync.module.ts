import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./es-sync.module-definition"
import {
    EsSyncUserService,
} from "./es-sync-user.service"
import {
    EsSyncUserListener,
} from "./es-sync-user.listener"

@Module({
    providers: [
        EsSyncUserService,
        EsSyncUserListener,
    ],
    exports: [
        EsSyncUserService,
    ],
})
/**
 * `es-sync` — keeps Elasticsearch indices in sync with their source Postgres
 * tables outside the CQRS-projection layer (which targets Postgres read-models).
 *
 * Currently wires the user → `users` index sync: the CDC listener (event-driven)
 * plus the indexer service. The service is exported so the seed/init synchronizer
 * can call its bulk backfill ({@link EsSyncUserService.reindexAll}).
 */
export class EsSyncModule extends ConfigurableModuleClass {
}
