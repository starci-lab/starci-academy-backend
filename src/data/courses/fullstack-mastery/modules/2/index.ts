import type {
    DeepPartial,
} from "typeorm"
import type {
    ModuleEntity,
} from "@modules/databases"
import {
    Locale,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    readFileOrDefault,
} from "../../../../utils"

/**
 * Fullstack Mastery Module 2 data.
 */
export const fullstackMasteryModule2: DeepPartial<ModuleEntity> = {
    id: "fullstack-mastery-module-2",
    title: "Database Integration, ORM/ODM & Caching",
    description:
        "Integrate PostgreSQL with TypeORM, MongoDB with Mongoose, understand schema design, relationships, indexing, transactions, Redis caching, and when to choose SQL or NoSQL.",
    orderIndex: 1,
    translations: [
        {
            moduleId: "fullstack-mastery-module-2",
            locale: Locale.Vi,
            field: "title",
            value: "Database Integration, ORM/ODM & Caching",
        },
        {
            moduleId: "fullstack-mastery-module-2",
            locale: Locale.Vi,
            field: "description",
            value:
                "Tích hợp PostgreSQL với TypeORM, MongoDB với Mongoose, hiểu thiết kế schema, quan hệ dữ liệu, indexing, transaction, caching với Redis và khi nào nên chọn SQL hoặc NoSQL.",
        },
    ],
    contents: [
        {
            id: "fullstack-mastery-module-2-content",
            title: "Content",
            body: readFileOrDefault(
                `${envConfig().mountPath.data.courses}/fullstack-mastery/modules/2/content/body.en.md`,
                ""
            ),
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    contentId: "fullstack-mastery-module-2-content",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Nội dung",
                },
                {
                    contentId: "fullstack-mastery-module-2-content",
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
            ],
        },
    ],
    previewContents: [
        {
            id: "fullstack-mastery-module-2-content-1",
            data: "Integrate PostgreSQL into a NestJS project and work with an ORM using TypeORM.",
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-2-content-1",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Tích hợp PostgreSQL vào dự án NestJS và làm việc với ORM thông qua TypeORM.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-2-content-2",
            data: "Integrate MongoDB and use Mongoose to build an ODM for suitable use cases.",
            orderIndex: 1,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-2-content-2",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Tích hợp MongoDB và sử dụng Mongoose để xây dựng ODM cho các use case phù hợp.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-2-content-3",
            data: "Design schemas, define data relationships, and apply indexing strategies to optimize queries and scalability.",
            orderIndex: 2,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-2-content-3",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Thiết kế schema, định nghĩa quan hệ dữ liệu và áp dụng indexing để tối ưu query và khả năng scale.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-2-content-4",
            data: "Understand transactions, rollbacks, and fundamental query optimization principles in real-world backend systems.",
            orderIndex: 3,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-2-content-4",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Hiểu transaction, rollback và các nguyên lý tối ưu query trong hệ thống backend thực tế.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-2-content-5",
            data: "Integrate Redis for caching to reduce database load, accelerate read-heavy APIs, and handle TTL/invalidation.",
            orderIndex: 4,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-2-content-5",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Tích hợp Redis để caching nhằm giảm tải database, tăng tốc API read-heavy và xử lý TTL/invalidation.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-2-content-6",
            data: "Understand when to use SQL vs NoSQL based on system requirements and real-world use cases.",
            orderIndex: 5,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-2-content-6",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Hiểu khi nào nên dùng SQL vs NoSQL dựa trên yêu cầu hệ thống và use case thực tế.",
                },
            ],
        },
    ],
}