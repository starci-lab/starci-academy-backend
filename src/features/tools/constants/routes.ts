/**
 * Centralized route fragments for the local-only ops tools controllers.
 *
 * Combined with the global `/api` prefix and URI version `v1`, these resolve to
 * routes like `POST /api/v1/tools/pg/snapshot`. Kept here (not inlined in the
 * controllers) so the dashboard and the controllers share one source of truth.
 */
export const toolsRoutes = {
    /** Media processing tool (ffmpeg → MinIO). */
    media: {
        /** Controller base path. */
        tag: "tools/media",
        /** Encode an uploaded video and upload renditions to MinIO. */
        process: "process",
    },
    /** PostgreSQL tools (local snapshot + encrypted cloud backup). */
    pg: {
        /** Controller base path. */
        tag: "tools/pg",
        /** Dump a list of cloud databases to local `.dump` files. */
        snapshot: "snapshot",
        /** Dump → gzip → encrypt → upload one database to object storage. */
        backup: "backup",
    },
    /** S3/MinIO bucket tools. */
    s3: {
        /** Controller base path. */
        tag: "tools/s3",
        /** Download every object of a remote bucket into a local snapshot dir. */
        snapshot: "snapshot",
    },
    /** Raw file upload tool (push files as-is to one or more targets). */
    upload: {
        /** Controller base path. */
        tag: "tools/upload",
        /** Upload file(s) and sync to the chosen targets. */
        process: "process",
    },
    /** Video → MPEG-DASH packaging tool. */
    dash: {
        /** Controller base path. */
        tag: "tools/dash",
        /** Encode + fragment + package an uploaded video to DASH, then sync. */
        process: "process",
    },
    /** Saved S3 targets (persisted in the local SQLite store). */
    targets: {
        /** Controller base path. */
        tag: "tools/targets",
    },
    /** Local artifact registry (list + re-sync + delete). */
    artifacts: {
        /** Controller base path. */
        tag: "tools/artifacts",
        /** Re-push an existing local artifact to its target. */
        resync: "resync",
    },
} as const
