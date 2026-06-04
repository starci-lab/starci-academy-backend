/**
 * Nest feature module — registers controllers/services/providers.
 */
import {
    Module,
} from "@nestjs/common"
import {
    StatusController,
} from "."
import {
    StatusService,
} from "."

@Module({
    controllers: [StatusController],
    providers: [StatusService],
})
/**
 * Class `StatusModule` — lesson lab component.
 */
export class StatusModule {}
