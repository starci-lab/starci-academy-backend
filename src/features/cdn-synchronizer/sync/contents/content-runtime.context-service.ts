import { envConfig } from "@modules/env";
import {
    AsyncService,
    InjectSuperJson,
} from "@modules/mixin";
import {
    Inject,
    Injectable,
    Scope,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import {
    ContentEntity,
    ContentReferenceEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases";
import { 
    EntityManager 
} from "typeorm";
import { 
    ContentNotFoundException 
} from "@modules/exceptions";
import SuperJSON from "superjson";
import type { ContentRuntimeContextRequest } from "./types";
import { 
    Sha256Service 
} from "@modules/crypto";
import {
    S3UploadService,
    UploadPayload,
    S3Provider,
    S3NameResolverService,
} from "@modules/s3";
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston";

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class ContentRuntimeContextService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(REQUEST)
        private readonly request: ContentRuntimeContextRequest,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly asyncService: AsyncService,
        private readonly sha256Service: Sha256Service,
        private readonly s3UploadService: S3UploadService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Run the sync cycle.
     */
    async run() {
        setInterval(
            async () => {
                await this.asyncService.safeRun(
                    async () => await this.process(),
                );
            },
            envConfig().services.cdnSynchronizer.syncIntervalMs.contents.runtime,
        );
    }

    /**
     * Sync the content to the CDN.
     */
    async process() {
        let objectKey: string | undefined;
        try {
            // take the content
            const content = await this.entityManager.findOne(ContentEntity, {
                where: {
                    id: this.request.id,
                },
                relations: {
                    translations: true,
                },
            });
            if (!content) {
                throw new ContentNotFoundException({
                    id: this.request.id,
                });
            }
            const hydratedContent = content.toPlain<ContentEntity>();
            // take all references related to the content
            const references = await this.entityManager.find(ContentReferenceEntity, {
                where: {
                    content: {
                        id: hydratedContent.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            });
            const hydratedReferences = references?.map((reference) =>
                reference.toPlain<ContentReferenceEntity>(),
            );

            hydratedContent.references = hydratedReferences;
            // upload the content to the CDN
            const data = this.superJson.stringify(hydratedContent);
            const hash = this.sha256Service.hash(data);
            const payload: UploadPayload = {
                data,
                hash,
            };
            objectKey = this.s3NameResolverService.content(hydratedContent.id);
            await this.s3UploadService.json({
                name: objectKey,
                payload,
                acl: "private",
                providers: [S3Provider.DigitalOcean, S3Provider.Minio],
            });
        } catch (error) {
            this.winstonService.log(
                WinstonLog.CdnSynchronizerContentRuntimeSyncFailed,
                {
                    id: this.request.id,
                    objectKey,
                    providers: [S3Provider.DigitalOcean, S3Provider.Minio],
                    error: error.message,
                    context: ContentRuntimeContextService.name,
                },
            );
        }
    }
}
