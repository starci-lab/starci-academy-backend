import {
  LessonVideoEntity,
  InjectPrimaryPostgreSQLEntityManager,
} from '@modules/databases';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ContextIdFactory } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { LessonVideoRuntimeContextRequest } from './types';
import { LessonVideoRuntimeContextService } from './lesson-videos-runtime.context-service';
import { envConfig } from '@modules/env';
import { sleep } from '@modules/common';

@Injectable()
export class LessonVideoFactorySyncService implements OnApplicationBootstrap {
  constructor(
    @InjectPrimaryPostgreSQLEntityManager()
    private readonly entityManager: EntityManager,
    private readonly moduleRef: ModuleRef,
  ) {}

  /**
   * On application bootstrap, take all lesson_videos ids and sync them to Elasticsearch.
   */
  onApplicationBootstrap() {
        setTimeout(async () => {    
        // take all lesson videos ids
        const lessonVideos = await this.entityManager.find(LessonVideoEntity, {
          select: {
            id: true,
          },
        });
        // calculate the delay per sync
        const syncIntervalMs =
          envConfig().services.elasticsearchSynchronizer.syncIntervalMs
            .lessonVideos;
        // ensure division by non-zero
        const count = lessonVideos.length || 1;
        const syncSpacingMs = syncIntervalMs.factory / count;
        for (const { id } of lessonVideos) {
          // create the context id
          const contextId = ContextIdFactory.create();
          // register the request by context id
          this.moduleRef.registerRequestByContextId<LessonVideoRuntimeContextRequest>(
            {
              id,
            }, // fake request object
            contextId,
          );
          // resolve the service
          const service = await this.moduleRef.resolve(
            LessonVideoRuntimeContextService,
            contextId,
            {
              strict: false,
            },
          );
          // execute the service
          await service.run();
          // sleep for the delay per sync
          await sleep(syncSpacingMs);
        }
              }, 0);
    }
}
