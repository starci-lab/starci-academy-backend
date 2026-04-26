import {
    ElasticsearchEntityContentsService,
} from "@modules/elasticsearch"
import {
    Injectable,
} from "@nestjs/common"

/**
 * On-demand content indexing (delegates to {@link ElasticsearchEntityContentsService}).
 */
@Injectable()
export class ElasticsearchContentsBuildService {
    constructor(
        private readonly entityContents: ElasticsearchEntityContentsService,
    ) {
    }

    async buildIndexById(
        contentId: string,
    ): Promise<void> {
        await this.entityContents.indexById(
            contentId,
        )
    }
}
