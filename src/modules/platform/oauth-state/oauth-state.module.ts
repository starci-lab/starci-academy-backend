import {
    Module,
} from "@nestjs/common"
import {
    OAuthStateService,
} from "./oauth-state.service"

@Module({
    providers: [OAuthStateService],
    exports: [OAuthStateService],
})
/** Provides the shared, Redis-backed one-time OAuth state boundary. */
export class OAuthStateModule {}
