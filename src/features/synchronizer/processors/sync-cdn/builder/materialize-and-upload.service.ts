import {
    S3Provider, S3ReadService, S3UploadService 
} from "@modules/s3"
import {
    Injectable 
} from "@nestjs/common"
import {
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
        for (const localized of localizedRows) {
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
            const currentSnapshot = await this.s3ReadService.json(
                {
                    key: keyByEntityId,
                    provider: S3Provider.Minio,
                },
            )
            if (currentSnapshot?.hash === hash) {
                continue
            }
            const snapshotPayload = {
                data,
                hash,
            }
            await this.s3UploadService.json(
                {
                    acl: "private",
                    providers,
                    name: keyByEntityId,
                    payload: snapshotPayload,
                },
            )
            await this.s3UploadService.json(
                {
                    acl: "private",
                    providers,
                    name: resolveObjectKey(
                        entity.displayId,
                        locale,
                    ),
                    payload: snapshotPayload,
                },
            )
        }
    }
}