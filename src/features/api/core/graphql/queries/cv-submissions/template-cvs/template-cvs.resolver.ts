import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    TemplateCvsService,
} from "./template-cvs.service"
import {
    TemplateCvsResponse,
} from "./graphql-types"
import {
    TemplateCVEntity,
    Locale,
} from "@modules/databases"

/**
 * Resolver for listing all available CV review template rubrics.
 */
@Resolver()
export class TemplateCvsResolver {
    constructor(
        private readonly templateCvsService: TemplateCvsService,
    ) {}

    /**
     * Returns all CV review templates (Junior/Mid/Senior) for the frontend selector.
     */
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy danh sách template CV thành công",
        [Locale.En]: "Successfully retrieved CV templates",
    })
    @Query(
        () => TemplateCvsResponse,
        {
            name: "templateCvs",
            description: "List all available CV review template rubrics.",
        },
    )
    async execute(): Promise<Array<TemplateCVEntity>> {
        return this.templateCvsService.execute()
    }
}
