import type {
    DeepPartial,
} from "typeorm"
import type {
    ModuleEntity,
} from "../../../../../entities"
import {
    Locale,
} from "../../../../../enums"
import {
    envConfig,
} from "@modules/env"
import {
    readFileOrDefault,
    readMetadataOrDefault,
    buildContentId,
    buildPreviewContentId,
    CourseId,
    buildModuleId,
    buildLessonVideoId,
    buildContentReferenceId,
} from "../../../../utils"

/**
 * Fullstack Mastery Module 2 data.
 */
export const fullstackMasteryModule2: DeepPartial<ModuleEntity> = {
    id: buildModuleId({
        courseId: CourseId.FullstackMastery,
        moduleIndex: 1,
    }),
    displayId: "database-integration-orm-odm-caching",
    defaultLocale: Locale.En,
    title: "Database Integration, ORM/ODM & Caching",
    description:
        "Integrate PostgreSQL with TypeORM, MongoDB with Mongoose, understand schema design, relationships, indexing, transactions, Redis caching, and when to choose SQL or NoSQL.",
    orderIndex: 1,
    translations: [
        {
            moduleId: buildModuleId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
            }),
            locale: Locale.Vi,
            field: "title",
            value: "Database Integration, ORM/ODM & Caching",
        },
        {
            moduleId: buildModuleId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
            }),
            locale: Locale.Vi,
            field: "description",
            value:
                "Tích hợp PostgreSQL với TypeORM, MongoDB với Mongoose, hiểu thiết kế schema, quan hệ dữ liệu, indexing, transaction, caching với Redis và khi nào nên chọn SQL hoặc NoSQL.",
        },
    ],
    lessonVideos: [
        {
            id: buildLessonVideoId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
                lessonVideoIndex: 0,
            }),
            thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            title: "Database Integration, ORM/ODM & Caching",
            description:
                "Integrate PostgreSQL with TypeORM, MongoDB with Mongoose, understand schema design, relationships, indexing, transactions, Redis caching, and when to choose SQL or NoSQL.",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            durationMs: 5400000,
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    lessonVideoId: buildLessonVideoId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        lessonVideoIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "title",
                    value: "Tích hợp Database, ORM/ODM & Caching",
                },
                {
                    lessonVideoId: buildLessonVideoId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        lessonVideoIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Tích hợp PostgreSQL với TypeORM, MongoDB với Mongoose, hiểu thiết kế schema, quan hệ dữ liệu, indexing, transaction, caching với Redis và khi nào nên chọn SQL hoặc NoSQL.",
                },
            ],
        },
    ],
    contents: [
        {
            id: buildContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
                contentIndex: 0,
            }),
            thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            minutesRead: 35,
            title: readMetadataOrDefault(
                buildContentId({
                    courseId: CourseId.FullstackMastery,
                    moduleIndex: 1,
                    contentIndex: 0,
                }),
                Locale.En,
                "Integrate PostgreSQL with TypeORM, MongoDB with Mongoose, understand schema design, relationships, indexing, transactions, Redis caching, and when to choose SQL or NoSQL."
            ),
            description: "Integrate PostgreSQL with TypeORM, MongoDB with Mongoose, understand schema design, relationships, indexing, transactions, Redis caching, and when to choose SQL or NoSQL.",
            body: readFileOrDefault(
                `${envConfig().mountPath.data.courses}/fullstack-mastery/modules/2/content/body.en.md`,
                ""
            ),
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    contentId: buildContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        contentIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "title",
                    value: readMetadataOrDefault(
                        buildContentId({
                            courseId: CourseId.FullstackMastery,
                            moduleIndex: 1,
                            contentIndex: 0,
                        }),
                        Locale.Vi,
                        "Integrate PostgreSQL with TypeORM, MongoDB with Mongoose, understand schema design, relationships, indexing, transactions, Redis caching, and when to choose SQL or NoSQL."
                    ),
                },
                {
                    contentId: buildContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        contentIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "body",
                    value: readFileOrDefault(
                        `${envConfig().mountPath.data.courses}/fullstack-mastery/modules/2/content/body.vi.md`,
                        readFileOrDefault(
                            `${envConfig().mountPath.data.courses}/fullstack-mastery/modules/2/content/body.en.md`,
                            ""
                        )
                    ),
                },
                {
                    contentId: buildContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        contentIndex: 0,
                    }),
                    locale: Locale.En,
                    field: "description",
                    value: "Integrate PostgreSQL with TypeORM, MongoDB with Mongoose, understand schema design, relationships, indexing, transactions, Redis caching, and when to choose SQL or NoSQL.",
                },
                {
                    contentId: buildContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        contentIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "description",
                    value: "Tích hợp PostgreSQL với TypeORM, MongoDB với Mongoose, hiểu thiết kế schema, quan hệ dữ liệu, indexing, transaction, caching với Redis và khi nào nên chọn SQL hoặc NoSQL.",
                },
            ],
            references: [
                {
                    id: buildContentReferenceId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        contentIndex: 0,
                        referenceIndex: 0,
                    }),
                    alias: "TypeORM documentation",
                    url: "https://typeorm.io/",
                    orderIndex: 0,
                    defaultLocale: Locale.En,
                    content: {
                        id: buildContentId({
                            courseId: CourseId.FullstackMastery,
                            moduleIndex: 1,
                            contentIndex: 0,
                        }),
                    },
                    translations: [
                        {
                            contentReferenceId: buildContentReferenceId({
                                courseId: CourseId.FullstackMastery,
                                moduleIndex: 1,
                                contentIndex: 0,
                                referenceIndex: 0,
                            }),
                            locale: Locale.Vi,
                            field: "alias",
                            value: "Tài liệu TypeORM",
                        },
                    ],
                },
            ],
        },
    ],
    previewContents: [
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
                previewContentIndex: 0,
            }),
            data: "Integrate PostgreSQL into a NestJS project and work with an ORM using TypeORM.",
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Tích hợp PostgreSQL vào dự án NestJS và làm việc với ORM thông qua TypeORM.",
                },
            ],
        },
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
                previewContentIndex: 1,
            }),
            data: "Integrate MongoDB and use Mongoose to build an ODM for suitable use cases.",
            orderIndex: 1,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 1,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Tích hợp MongoDB và sử dụng Mongoose để xây dựng ODM cho các use case phù hợp.",
                },
            ],
        },
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
                previewContentIndex: 2,
            }),
            data: "Design schemas, define data relationships, and apply indexing strategies to optimize queries and scalability.",
            orderIndex: 2,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 2,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Thiết kế schema, định nghĩa quan hệ dữ liệu và áp dụng indexing để tối ưu query và khả năng scale.",
                },
            ],
        },
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
                previewContentIndex: 3,
            }),
            data: "Understand transactions, rollbacks, and fundamental query optimization principles in real-world backend systems.",
            orderIndex: 3,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 3,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Hiểu transaction, rollback và các nguyên lý tối ưu query trong hệ thống backend thực tế.",
                },
            ],
        },
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
                previewContentIndex: 4,
            }),
            data: "Integrate Redis for caching to reduce database load, accelerate read-heavy APIs, and handle TTL/invalidation.",
            orderIndex: 4,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 4,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Tích hợp Redis để caching nhằm giảm tải database, tăng tốc API read-heavy và xử lý TTL/invalidation.",
                },
            ],
        },
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
                previewContentIndex: 5,
            }),
            data: "Understand when to use SQL vs NoSQL based on system requirements and real-world use cases.",
            orderIndex: 5,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 5,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Hiểu khi nào nên dùng SQL vs NoSQL dựa trên yêu cầu hệ thống và use case thực tế.",
                },
            ],
        },
    ],
}