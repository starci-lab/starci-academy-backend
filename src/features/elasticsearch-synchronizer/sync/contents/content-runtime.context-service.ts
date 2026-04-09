import {
  ContentEntity,
  ContentReferenceEntity,
  InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases";
import { ElasticsearchService } from "@modules/elasticsearch";
import { envConfig } from "@modules/env";
import {
  ContentNotFoundException
} from "@modules/exceptions";
import {
  AsyncService,
} from "@modules/mixin";
import {
  Inject,
  Injectable,
  Scope,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import {
  EntityManager
} from "typeorm";
import type {
  ContentRuntimeContextRequest
} from "./types";

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
        private readonly asyncService: AsyncService,
        private readonly elasticsearch: ElasticsearchService,
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
            envConfig().services.elasticsearchSynchronizer.syncIntervalMs.contents.runtime,
        );
    }

    /**
     * Sync the content to the CDN.
     */
    async process() {

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
        select: {
          id: true
        }
      });
      const hydratedReferences = references?.map((reference) =>
        reference.toPlain<ContentReferenceEntity>(),
      );

      hydratedContent.references = hydratedReferences;
      await this.elasticsearch.indexEntity(
        ContentEntity,
        hydratedContent,
      );
    }
}
