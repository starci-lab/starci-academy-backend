import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3UploadService,
} from "@modules/integrations/s3/s3-upload.service"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityLike,
    LocalizedCdnEntity,
} from "./types"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    AsyncService,
} from "@modules/lib/mixin/async.service"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    CdnMaterializeContext,
} from "../types/materialize-context"
import type SuperJSON from "superjson"

@Injectable()
/**
 * Service for materializing and uploading entities to the CDN.
 */
export class MaterializeAndUploadService {
    constructor(
        private readonly s3UploadService: S3UploadService,
        private readonly asyncService: AsyncService,
        private readonly winstonService: WinstonService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    /**
     * Process the entities and upload them to the CDN.
     * @param localizedRows - The localized entities to process.
     * @param resolveObjectKey - A function to resolve the object key for the entity.
     * @param context - Optional tracing context for boot-time progress logs.
     */
    async process<
        T extends EntityLike,
    >(
        localizedRows: Array<LocalizedCdnEntity<T>>,
        resolveObjectKey: (
            id: string,
            locale: Locale,
        ) => string,
        context?: CdnMaterializeContext,
    ): Promise<void> {
        const providers: Array<S3Provider> = [
            // DigitalOcean disabled -- not configured here (empty creds -> 400 InvalidArgument). MinIO only.
            S3Provider.Minio,
        ]
        for (const localized of localizedRows) {
            const {
                entity,
                locale,
            } = localized
            const keyByEntityId = resolveObjectKey(
                entity.id,
                locale,
            )
            // Some entities (e.g. milestone tasks) have no mount slug / displayId -- only the
            // primary-key keyed object is written for those.
            const keyByDisplayId = entity.displayId
                ? resolveObjectKey(
                    entity.displayId,
                    locale,
                )
                : null
            const payloadBytes = Buffer.byteLength(
                this.superJson.stringify(entity),
                "utf8",
            )
            if (context) {
                this.winstonService.log(
                    WinstonLog.CdnSynchronizerMaterializeStep,
                    {
                        step: "upload-start",
                        entityKind: context.entityKind,
                        entityId: context.entityId,
                        displayId: context.displayId ?? entity.displayId,
                        locale,
                        objectKey: keyByEntityId,
                        payloadBytes,
                    },
                )
            }
            const uploadStart = Date.now()
            // Always upload (no snapshot read / skip-on-match). The body is the entity
            // serialized once by S3UploadService (SuperJSON) -- written as text, no envelope.
            await this.asyncService.allMustDone(
                [
                    this.s3UploadService.json(
                        {
                            acl: "private",
                            providers,
                            name: keyByEntityId,
                            payload: entity,
                        },
                    ),
                ],
            )
            if (keyByDisplayId) {
                await this.s3UploadService.json(
                    {
                        acl: "private",
                        providers,
                        name: keyByDisplayId,
                        payload: entity,
                    },
                )
            }
            if (context) {
                this.winstonService.log(
                    WinstonLog.CdnSynchronizerMaterializeStep,
                    {
                        step: "upload-done",
                        entityKind: context.entityKind,
                        entityId: context.entityId,
                        displayId: context.displayId ?? entity.displayId,
                        locale,
                        objectKey: keyByEntityId,
                        payloadBytes,
                        durationMs: Date.now() - uploadStart,
                    },
                )
            }
        }
    }
}
