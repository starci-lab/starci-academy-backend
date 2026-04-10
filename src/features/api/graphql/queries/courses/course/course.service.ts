import { CourseEntity } from '@modules/databases';
import { CourseNotFoundException } from '@modules/exceptions';
import { InjectSuperJson } from '@modules/mixin';
import {
  S3NameResolverService,
  S3Provider,
  S3ReadService,
  UploadPayload,
} from '@modules/s3';
import { Injectable } from '@nestjs/common';
import SuperJSON from 'superjson';
import { ExecuteParams } from '../../../../types';
import { CourseRequest } from './graphql-types';

/**
 * Loads a single course from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class CourseService {
  constructor(
    private readonly s3ReadService: S3ReadService,
    private readonly s3NameResolverService: S3NameResolverService,
    @InjectSuperJson()
    private readonly superJson: SuperJSON,
  ) {}

  /**
   * Entry: returns one challenge by primary id.
   *
   * @param request - Wrapper with challenge id
   * @param request.id - Challenge id
   * @throws {CourseNotFoundException} When no challenge exists for `id`.
   */
  async execute({
    request,
    locale,
  }: ExecuteParams<CourseRequest>): Promise<CourseEntity> {
    if (!request.displayId) {
        throw new CourseNotFoundException(
            {
                id: request.id,
            }
        );
    }

    const objectKey = this.s3NameResolverService.course(request.displayId, locale);
    const cdnPayload = await this.s3ReadService
      .json<UploadPayload>({
        key: objectKey,
        provider: S3Provider.Minio,
      })
      .catch(() => null);

    if (!cdnPayload) {
        throw new CourseNotFoundException(
            { 
                id: 
                request.id 
            }
        );
    }

    const hydratedCourse = this.superJson.parse<CourseEntity>(cdnPayload.data);
    return hydratedCourse;
  }
}
