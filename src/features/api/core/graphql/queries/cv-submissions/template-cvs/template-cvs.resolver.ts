import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    TemplateCvsService,
} from "./template-cvs.service"
import {
    TemplateCvsResponse,
} from "./graphql-types/response"
import {
    TemplateCVEntity,
} from "@modules/databases/postgresql/primary/entities/template-cv.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

@Resolver()
/**
 * Resolver for listing all available CV review template rubrics.
 */
export class TemplateCvsResolver {
    constructor(
        private readonly templateCvsService: TemplateCvsService,
    ) {}

    /**
     * Returns all CV review templates (Junior/Mid/Senior) for the frontend selector.
     */
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy danh sách template CV thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Successfully retrieved CV templates",
    })
    @Query(
        () => TemplateCvsResponse,
        {
            name: "templateCvs",
            description: "List all available CV review template rubrics.",
        },
    )
    async execute(
        @GraphQLLocale()
            locale: Locale,
    ): Promise<Array<TemplateCVEntity>> {
        return this.templateCvsService.execute({
            request: undefined,
            locale,
        })
    }
}
