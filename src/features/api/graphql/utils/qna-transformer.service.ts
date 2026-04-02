import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    QnaEntity,
    TranslationResolverService,
} from "@modules/databases"

/**
 * Applies translations to a course Q&A row.
 */
@Injectable()
export class QnaTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    transform(
        qna: QnaEntity,
        locale: Locale,
        courseFallbackLocale: Locale,
    ): void {
        const fallbackLocale = qna.defaultLocale ?? courseFallbackLocale
        qna.question = this.translationResolver.resolve(
            {
                translations: qna.translations,
                field: "question",
                locale,
                fallbackLocale,
            },
        )
        qna.answer = this.translationResolver.resolve(
            {
                translations: qna.translations,
                field: "answer",
                locale,
                fallbackLocale,
            },
        )
    }
}
