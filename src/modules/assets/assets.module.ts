import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./assets.module-definition"
import {
    AssetsService,
} from "./assets.service"

/**
 * Assets module.
 *
 * Owns {@link AssetsService}, which syncs local static brand assets up to MinIO
 * on boot. Relies on the globally-registered `S3Module` for the S3 services, so
 * it does not import it explicitly.
 */
@Module({
    providers: [
        AssetsService,
    ],
    exports: [
        AssetsService,
    ],
})
export class AssetsModule extends ConfigurableModuleClass { }
