import {
    Module,
} from "@nestjs/common"
import {
    EnvModule,
} from "@modules/platform/env/env.module"
import {
    ExecaModule,
} from "@modules/integrations/execa/execa.module"
import {
    FfmpegModule,
} from "@modules/integrations/ffmpeg/ffmpeg.module"
import {
    Bento4Module,
} from "@modules/integrations/bento4/bento4.module"
import {
    ToolsModule,
} from "@features/tools/tools.module"

@Module({
    imports: [
        /** Environment configuration. */
        EnvModule.forRoot(),
        /** External-command runner for the Postgres tools. */
        ExecaModule.register({
            isGlobal: true,
        }),
        /** FFmpeg video encoding for the media + dash tools. */
        FfmpegModule.register({
            isGlobal: true,
        }),
        /** Bento4 MPEG-DASH packaging for the dash tool. */
        Bento4Module.register({
            isGlobal: true,
        }),
        /** The ops tools endpoints themselves. */
        ToolsModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Root module for the local-only ops "tools" service.
 *
 * Wires just the infrastructure the tools need:
 *   - {@link ExecaModule}  -- runs `pg_dump` / `gzip` / `openssl`
 *   - {@link FfmpegModule} -- multi-bitrate video encoding (media + dash)
 *   - {@link Bento4Module} -- MPEG-DASH packaging (dash)
 * Cloud uploads are done by `SyncService` via per-target S3 clients built from
 * the local SQLite store, so no app-wide S3 module is needed. Everything is
 * registered globally so {@link ToolsModule} can inject the services.
 */
export class AppModule {}
