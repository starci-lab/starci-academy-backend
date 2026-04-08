import type { Client } from '@elastic/elasticsearch';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectElasticsearch } from './elasticsearch.decorators';
import {
  ChallengeEntity,
  ContentEntity,
  CourseEntity,
  LessonVideoEntity,
} from '@modules/databases';
import { ObjectLiteral } from 'typeorm';
import { ReadinessWatcherFactoryService } from '@modules/mixin';
import { configMap } from './config';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly indices: Array<string> = [
    CourseEntity.name,
    LessonVideoEntity.name,
    ChallengeEntity.name,
    ContentEntity.name,
  ];
  constructor(
    @InjectElasticsearch()
    public readonly client: Client,
    private readonly readinessWatcherFactoryService: ReadinessWatcherFactoryService,
  ) {}

  /**
   * Indicate the index name.
   * @param entity - Entity to indicate the index name.
   * @returns Index name.
   */
  private indicateName(entity: string) {
    return configMap[entity].indices;
  }

  /**
   * On application bootstrap, ensure the index exists.
   */
  async onModuleInit() {
    this.readinessWatcherFactoryService.createWatcher(
      ElasticsearchService.name,
    );
    // ensure the indices exist
    for (const index of this.indices) {
      await this.ensureIndexExists(this.indicateName(index));
    }
    // set the readiness watcher to ready
    this.readinessWatcherFactoryService.setReady(ElasticsearchService.name);
  }

  /**
   * Ensure the index exists.
   */
  async ensureIndexExists(
    index: string,
    create?: Omit<Parameters<Client['indices']['create']>[0], 'index'>,
  ): Promise<void> {
    const existsResult = await this.client.indices.exists({
      index,
    });
    const exists =
      typeof existsResult === 'boolean'
        ? existsResult
        : (
            existsResult as {
              body: boolean;
            }
          ).body;

    if (exists) return;

    await this.client.indices.create({
      index,
      ...(create ?? {}),
    });
  }

  /**
   * Index the entity.
   */
  async indexEntity<T extends ObjectLiteral>(entity: T, data: ObjectLiteral) {
    await this.client.index({
      index: this.indicateName(entity.name),
      id: entity.id,
      body: data,
    });
  }

  /**
   * Index the entities.
   */
  async indexEntities<T extends ObjectLiteral>(
    entity: T,
    data: Array<ObjectLiteral>,
  ) {
    await this.client.bulk({
      body: data.map((data) => ({
        index: {
          _index: this.indicateName(entity.name),
          _id: data.id,
        },
        document: data,
      })),
    });
  }
}
