import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./tools.module-definition"
import {
    ToolsStoreService,
} from "./store/tools-store.service"
import {
    SyncService,
} from "./sync/sync.service"
import {
    TargetsController,
} from "./targets/targets.controller"
import {
    ArtifactsController,
} from "./artifacts/artifacts.controller"
import {
    UploadController,
} from "./upload/upload.controller"
import {
    UploadService,
} from "./upload/upload.service"
import {
    MediaController,
} from "./media/media.controller"
import {
    MediaService,
} from "./media/media.service"
import {
    DashController,
} from "./dash/dash.controller"
import {
    DashService,
} from "./dash/dash.service"
import {
    PgSnapshotController,
} from "./pg-snapshot/pg-snapshot.controller"
import {
    PgSnapshotService,
} from "./pg-snapshot/pg-snapshot.service"
import {
    PgBackupController,
} from "./pg-backup/pg-backup.controller"
import {
    PgBackupService,
} from "./pg-backup/pg-backup.service"
import {
    S3SnapshotController,
} from "./s3-snapshot/s3-snapshot.controller"
import {
    S3SnapshotService,
} from "./s3-snapshot/s3-snapshot.service"

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
/**
 * Local-only ops tools feature module.
 *
 * Aggregates the build tools (media, dash, pg-snapshot, pg-backup, s3-snapshot),
 * the saved-target + artifact-registry controllers, and the shared local store
 * ({@link ToolsStoreService}) and {@link SyncService} that implement the
 * "build locally -> register artifact -> sync to cloud -> re-sync" flow.
 *
 * Infrastructure services ({@link FfmpegService}, {@link Bento4Service},
 * {@link ExecaService}) are provided by the globally-registered infra modules in
 * the tools app root.
 */
export class ToolsModule extends ConfigurableModuleClass {}
