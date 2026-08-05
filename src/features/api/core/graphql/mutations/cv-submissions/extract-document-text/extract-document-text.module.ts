import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    ExtractDocumentTextResolver,
} from "./extract-document-text.resolver"
import {
    ExtractDocumentTextService,
} from "./extract-document-text.service"
import {
    ExtractDocumentTextHandler,
} from "./extract-document-text.handler"
import {
    ConfigurableModuleClass,
} from "./extract-document-text.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        ExtractDocumentTextResolver,
        ExtractDocumentTextService,
        ExtractDocumentTextHandler,
    ],
    exports: [
        ExtractDocumentTextService,
    ],
})
/** Isolated Nest registration for document-text extraction without wiring sibling CV mutations. */
export class ExtractDocumentTextSingleMutationModule extends ConfigurableModuleClass {}
