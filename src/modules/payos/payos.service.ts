import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    InjectSuperJson,
} from "@modules/mixin"
import SuperJSON from "superjson"
import {
    S3BuildService,
    S3ReadService,
    S3UploadService,
} from "@modules/s3"

/**
 * PayOS helpers backed by S3 (order snapshots, public URLs).
 * Requires {@link S3Module} to be registered (global or imported before this module).
 */
@Injectable()
export class PayOSService {
    constructor(
        private readonly s3Upload: S3UploadService,
        private readonly s3Read: S3ReadService,
        private readonly s3Build: S3BuildService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    /**
     * S3 key for an order snapshot JSON object.
     */
    orderSnapshotKey(
        orderId: string,
    ): string {
        const prefix = this.prefix()
        return `${prefix}orders/${orderId}.json`
    }

    /**
     * Persist a PayOS-related payload as JSON in S3 (same serialization as {@link S3ReadService#json}).
     */
    async saveOrderSnapshot(
        orderId: string,
        payload: unknown,
    ): Promise<void> {
        const key = this.orderSnapshotKey(orderId)
        await this.s3Upload.json(
            key,
            this.superJson.stringify(payload),
        )
    }

    /**
     * Read a previously stored order snapshot, or null if missing.
     */
    async readOrderSnapshot<T>(
        orderId: string,
    ): Promise<T | null> {
        return this.s3Read.json<T>(
            this.orderSnapshotKey(orderId),
        )
    }

    /**
     * Public URL for the order snapshot object (upload uses `public-read` ACL).
     */
    publicOrderSnapshotUrl(
        orderId: string,
    ): string {
        return this.s3Build.buildPublicObjectUrl(
            this.orderSnapshotKey(orderId),
        )
    }

    private prefix(): string {
        let p = envConfig().payos.s3Prefix
        if (!p.endsWith("/")) {
            p = `${p}/`
        }
        return p
    }
}
