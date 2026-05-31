import {
    S3Provider, S3ReadService, S3UploadService 
} from "@modules/s3"
import {
    Injectable 
} from "@nestjs/common"
import {
    AsyncService,
    InjectSuperJson
} from "@modules/mixin"
import SuperJSON from "superjson"
import type {
    EntityLike, LocalizedCdnEntity
} from "./types"
import {
    Locale
} from "@modules/databases"
import {
    Sha256Service
} from "@modules/crypto"
import {
    parseEnvBoolean
} from "@modules/env"
/**
 * Service for materializing and uploading entities to the CDN.
 */
@Injectable()
export class MaterializeAndUploadService {
    constructor(
        private readonly s3UploadService: S3UploadService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly sha256Service: Sha256Service,
        private readonly s3ReadService: S3ReadService,
        private readonly asyncService: AsyncService,
    ) {}

    /**
     * Process the entities and upload them to the CDN.
     * @param localizedRows - The localized entities to process.
     * @param resolveObjectKey - A function to resolve the object key for the entity.
     */
    async process<
        T extends EntityLike,
    >(
        localizedRows: Array<LocalizedCdnEntity<T>>,
        resolveObjectKey: (
            id: string,
            locale: Locale,
        ) => string,
    ): Promise<void> {
        const providers: Array<S3Provider> = [
            S3Provider.DigitalOcean,
            S3Provider.Minio,
        ]
        // When SYNC_CDN_FORCE_UPLOAD=true, re-upload every entity regardless of the stored
        // hash — bypasses the snapshot-equality skip below so edited mount content (re-seeded
        // into the DB) is pushed to all CDN providers even if a stale provider was skipped.
        const forceUpload = parseEnvBoolean({
            key: "SYNC_CDN_FORCE_UPLOAD",
            defaultValue: false,
        })
        await this.asyncService.allIgnoreError(
            localizedRows.map((localized) => (async (): Promise<void> => {
                const {
                    entity,
                    locale,
                } = localized
                const data = this.superJson.stringify(
                    entity,
                )
                const hash = this.sha256Service.hash(
                    data,
                )
                const keyByEntityId = resolveObjectKey(
                    entity.id,
                    locale,
                )
                // Skip the snapshot read entirely when forcing — comparing hashes is pointless if we
                // upload regardless, and the per-entity CDN round-trip is the slow part.
                if (!forceUpload) {
                    const currentSnapshot = await this.s3ReadService.json(
                        {
                            key: keyByEntityId,
                            provider: S3Provider.Minio,
                        },
                    )
                    if (currentSnapshot?.hash === hash) {
                        return
                    }
                }
                const snapshotPayload = {
                    data,
                    hash,
                }
                await Promise.all([
                    this.s3UploadService.json(
                        {
                            acl: "private",
                            providers,
                            name: keyByEntityId,
                            payload: snapshotPayload,
                        },
                    ),
                    this.s3UploadService.json(
                        {
                            acl: "private",
                            providers,
                            name: resolveObjectKey(
                                entity.displayId,
                                locale,
                            ),
                            payload: snapshotPayload,
                        },
                    ),
                ])
            })()),
        )
    }
}