import {
    Module,
} from "@nestjs/common"
import {
    SessionStoreService,
} from "./session-store.service"

/**
 * Shared store module — provides the single in-memory session store that every
 * lesson controller injects. Exported so per-lesson leaf modules can import it.
 */
@Module({
    providers: [SessionStoreService],
    exports: [SessionStoreService],
})
export class StoreModule {}
