import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./tools.module-definition"
import {
    ToolsStoreService,
} from "./store"
import {
    SyncService,
} from "./sync"
import {
    TargetsController,
} from "./targets"
import {
    ArtifactsController,
} from "./artifacts"
import {
    UploadController,
    UploadService,
} from "./upload"
import {
    MediaController,
    MediaService,
} from "./media"
import {
    DashController,
    DashService,
} from "./dash"
import {
    PgSnapshotController,
    PgSnapshotService,
} from "./pg-snapshot"
import {
    PgBackupController,
    PgBackupService,
} from "./pg-backup"
import {
    S3SnapshotController,
    S3SnapshotService,
} from "./s3-snapshot"

/**
 * Local-only ops tools feature module.
 *
 * Aggregates the build tools (media, dash, pg-snapshot, pg-backup, s3-snapshot),
 * the saved-target + artifact-registry controllers, and the shared local store
 * ({@link ToolsStoreService}) and {@link SyncService} that implement the
 * "build locally → register artifact → sync to cloud → re-sync" flow.
 *
 * Infrastructure services ({@link FfmpegService}, {@link Bento4Service},
 * {@link ExecaService}) are provided by the globally-registered infra modules in
 * the tools app root.
 */
@Module({
    controllers: [
        TargetsController,
        ArtifactsController,
        UploadController,
        MediaController,
        DashController,
        PgSnapshotController,
        PgBackupController,
        S3SnapshotController,
    ],
    providers: [
        ToolsStoreService,
        SyncService,
        UploadService,
        MediaService,
        DashService,
        PgSnapshotService,
        PgBackupService,
        S3SnapshotService,
    ],
})
export class ToolsModule extends ConfigurableModuleClass {}
