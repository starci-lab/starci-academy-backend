import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    SubmitCvPresignedUrlQuery,
    SubmitCvPresignedUrlQueryParams,
} from "./submit-cv-presigned-url.query"
import {
    SubmitCvPresignedUrlResponse,
} from "./graphql-types"

@Injectable()
export class SubmitCvPresignedUrlService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: SubmitCvPresignedUrlQueryParams,
    ): Promise<SubmitCvPresignedUrlResponse> {
        return this.queryBus.execute(
            new SubmitCvPresignedUrlQuery(params),
        )
    }
}
