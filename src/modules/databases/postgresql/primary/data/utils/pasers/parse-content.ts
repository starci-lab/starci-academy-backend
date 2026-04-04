import {
    DeepPartial
} from "@apollo/client/utilities"
import {
    ContentEntity
} from "../../../entities"
import {
    buildContentId,
    buildContentReferenceId,
    CourseId
} from "../ids"
import {
    extractBlock,
    extractReferences,
} from "./extract"
import {
    Locale
} from "../../../enums"
import {
    envConfig
} from "@modules/env"
import {
    readFileOrDefault
} from "../read"

/**
 * Parameters for building a content markdown path.
 */
export interface BuildContentMarkdownPathParams {
    courseId: CourseId
    moduleIndex: number
    contentIndex: number
    locale: Locale
}

/**
 * Resolved path under the mount:
 * `courses/{course}/modules/{m}/contents/{c}/{locale}.md`
 */
export const buildContentMarkdownPath = (
    {
        courseId,
        moduleIndex,
        contentIndex,
        locale,
    }: BuildContentMarkdownPathParams,
) =>
    `${envConfig().mountPath.data.courses}/${courseId.toLowerCase()}/modules/${moduleIndex}/contents/${contentIndex}/${locale}.md`

/**
 * Parameters for building a content metadata path.
 */
export interface BuildContentDataPathParams {
    courseId: CourseId
    moduleIndex: number
    contentIndex: number
}

/**
 * Resolved path:
 * `courses/{course}/modules/{m}/contents/{c}/data.json`
 */
export const buildContentDataPath = (
    {
        courseId,
        moduleIndex,
        contentIndex,
    }: BuildContentDataPathParams,
) =>
    `${envConfig().mountPath.data.courses}/${courseId.toLowerCase()}/modules/${moduleIndex}/contents/${contentIndex}/data.json`

/**
 * Parameters for parsing module content.
 */
export interface ParseContentParams {
    /**
     * Index of the folder under `contents/{index}/`.
     */
    index: number
    moduleIndex: number
    courseId: CourseId
}

/**
 * Optional fields in `data.json` (markdown carries title, description, body, references).
 */
export interface ContentData {
    /**
     * Estimated minutes to read the article.
     */
    minutesRead?: number
}

/**
 * Build {@link ContentEntity} from `contents/{index}/en.md`, `vi.md`, and `data.json`
 * using the same heading and References list conventions as {@link parseChallenge}.
 */
export const parseContent = (
    {
        index,
        moduleIndex,
        courseId,
    }: ParseContentParams,
): DeepPartial<ContentEntity> => {
    const enMarkdown = readFileOrDefault(
        buildContentMarkdownPath({
            courseId: courseId,
            moduleIndex: moduleIndex,
            contentIndex: index,
            locale: Locale.En,
        }),
        "",
    )
    const viMarkdown = readFileOrDefault(
        buildContentMarkdownPath({
            courseId: courseId,
            moduleIndex: moduleIndex,
            contentIndex: index,
            locale: Locale.Vi,
        }),
        "",
    )
    const data = JSON.parse(
        readFileOrDefault(
            buildContentDataPath({
                courseId: courseId,
                moduleIndex: moduleIndex,
                contentIndex: index,
            }),
            "{}",
        ),
    ) as ContentData

    const enTitle = extractBlock(
        {
            key: "Title",
            markdown: enMarkdown,
            numHashs: 1,
        },
    )
    const viTitle = extractBlock(
        {
            key: "Title",
            markdown: viMarkdown,
            numHashs: 1,
        },
    )
    const enDescription = extractBlock(
        {
            key: "Description",
            markdown: enMarkdown,
            numHashs: 1,
        },
    )
    const viDescription = extractBlock(
        {
            key: "Description",
            markdown: viMarkdown,
            numHashs: 1,
        },
    )
    const enBody = extractBlock(
        {
            key: "Body",
            markdown: enMarkdown,
            numHashs: 1,
        },
    )
    const viBody = extractBlock(
        {
            key: "Body",
            markdown: viMarkdown,
            numHashs: 1,
        },
    )

    const enReferencesText = extractBlock(
        {
            key: "References",
            markdown: enMarkdown,
            numHashs: 1,
        },
    )
    const viReferencesText = extractBlock(
        {
            key: "References",
            markdown: viMarkdown,
            numHashs: 1,
        },
    )
    const enReferences = extractReferences(
        {
            markdown: enReferencesText,
        },
    )
    const viReferences = extractReferences(
        {
            markdown: viReferencesText,
        },
    )

    return {
        id: buildContentId({
            courseId: courseId,
            moduleIndex: moduleIndex,
            contentIndex: index,
        }),
        defaultLocale: Locale.En,
        title: enTitle,
        description: enDescription,
        body: enBody,
        orderIndex: index,
        minutesRead: data.minutesRead ?? 0,
        translations: [
            {
                contentId: buildContentId({
                    courseId: courseId,
                    moduleIndex: moduleIndex,
                    contentIndex: index,
                }),
                locale: Locale.Vi,
                field: "title",
                value: viTitle,
            },
            {
                contentId: buildContentId({
                    courseId: courseId,
                    moduleIndex: moduleIndex,
                    contentIndex: index,
                }),
                locale: Locale.Vi,
                field: "description",
                value: viDescription,
            },
            {
                contentId: buildContentId({
                    courseId: courseId,
                    moduleIndex: moduleIndex,
                    contentIndex: index,
                }),
                locale: Locale.Vi,
                field: "body",
                value: viBody,
            },
        ],
        references: enReferences.map((enReference) => {
            const viReference = viReferences.find(
                (reference) => reference.orderIndex === enReference.orderIndex,
            )
            if (!viReference) {
                throw new Error(
                    `Content reference order ${enReference.orderIndex} (${enReference.alias}) missing in Vietnamese References`,
                )
            }
            return {
                id: buildContentReferenceId(
                    {
                        courseId: courseId,
                        moduleIndex: moduleIndex,
                        contentIndex: index,
                        referenceIndex: enReference.orderIndex,
                    },
                ),
                orderIndex: enReference.orderIndex,
                alias: enReference.alias,
                defaultLocale: Locale.En,
                url: enReference.url,
                translations: [
                    {
                        contentReferenceId: buildContentReferenceId(
                            {
                                courseId: courseId,
                                moduleIndex: moduleIndex,
                                contentIndex: index,
                                referenceIndex: enReference.orderIndex,
                            },
                        ),
                        locale: Locale.Vi,
                        field: "alias",
                        value: viReference.alias,
                    },
                ],
            }
        }),
    }
}
