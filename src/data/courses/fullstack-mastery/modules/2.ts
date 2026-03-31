import type {
    DeepPartial,
} from "typeorm"
import type {
    ModuleEntity,
} from "@modules/databases"
import {
    Locale,
} from "@modules/databases"

export const fullstackMasteryModule2: DeepPartial<ModuleEntity> = {
    id: "fullstack-mastery-module-2",
    title: "Database Integration, ORM/ODM & Caching",
    description:
        "Tích hợp PostgreSQL với TypeORM, MongoDB với Mongoose, hiểu schema, relations, indexing, transaction, caching với Redis, và cách chọn SQL hay NoSQL phù hợp.",
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
                "Tích hợp PostgreSQL với TypeORM, MongoDB với Mongoose, hiểu schema, relations, indexing, transaction, caching với Redis, và cách chọn SQL hay NoSQL phù hợp.",
        },
    ],
    content: {
        id: "fullstack-mastery-module-2-content",
        title: "Nội dung",
        body:
            "## Bài giảng\n\nModule này giúp bạn hiểu và làm chủ tầng dữ liệu của hệ thống backend.\n\n- Tích hợp **PostgreSQL** với **TypeORM** và **MongoDB** với **Mongoose**\n- Thiết kế **schema**, **relations** và chiến lược **indexing** hợp lý\n- Hiểu **transaction** và cách tối ưu truy vấn cơ bản\n- Tích hợp **Redis** để caching và giảm tải database\n- Phân biệt rõ khi nào nên sử dụng **SQL** và khi nào nên dùng **NoSQL**",
        orderIndex: 0,
        defaultLocale: Locale.Vi,
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
                value:
                    "## Bài giảng\n\nModule này giúp bạn hiểu và làm chủ tầng dữ liệu của hệ thống backend.\n\n- Tích hợp **PostgreSQL** với **TypeORM** và **MongoDB** với **Mongoose**\n- Thiết kế **schema**, **relations** và chiến lược **indexing** hợp lý\n- Hiểu **transaction** và cách tối ưu truy vấn cơ bản\n- Tích hợp **Redis** để caching và giảm tải database\n- Phân biệt rõ khi nào nên sử dụng **SQL** và khi nào nên dùng **NoSQL**",
            },
        ],
    },
    previewContents: [
        {
            id: "fullstack-mastery-module-2-content-1",
            data: "Integrate PostgreSQL into a NestJS project and work with an ORM using TypeORM.",
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-2-content-1",
                    locale: Locale.En,
                    field: "data",
                    value: "Integrate PostgreSQL into a NestJS project and work with an ORM using TypeORM.",
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
                    locale: Locale.En,
                    field: "data",
                    value: "Integrate MongoDB and use Mongoose to build an ODM for suitable use cases.",
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
                    locale: Locale.En,
                    field: "data",
                    value:
                        "Design schemas, define data relationships, and apply indexing strategies to optimize queries and scalability.",
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
                    locale: Locale.En,
                    field: "data",
                    value:
                        "Understand transactions, rollbacks, and fundamental query optimization principles in real-world backend systems.",
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
                    locale: Locale.En,
                    field: "data",
                    value:
                        "Integrate Redis for caching to reduce database load, accelerate read-heavy APIs, and handle TTL/invalidation.",
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
                    locale: Locale.En,
                    field: "data",
                    value:
                        "Understand when to use SQL vs NoSQL based on system requirements and real-world use cases.",
                },
            ],
        },
    ],
    outcomes: [
        {
            id: "fullstack-mastery-module-2-outcome-1",
            title: "Thiết kế được database rõ ràng và dễ mở rộng",
            description:
                "Biết cách tổ chức schema, relations và dữ liệu để hệ thống phát triển lâu dài mà không bị rối.",
            orderIndex: 0,
            translations: [
                {
                    outcomeId: "fullstack-mastery-module-2-outcome-1",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Thiết kế được database rõ ràng và dễ mở rộng",
                },
                {
                    outcomeId: "fullstack-mastery-module-2-outcome-1",
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Biết cách tổ chức schema, relations và dữ liệu để hệ thống phát triển lâu dài mà không bị rối.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-2-outcome-2",
            title: "Tối ưu truy vấn thay vì chỉ chạy được",
            description:
                "Hiểu cách suy nghĩ về indexing, transaction và hiệu năng dữ liệu trong backend thực tế.",
            orderIndex: 1,
            translations: [
                {
                    outcomeId: "fullstack-mastery-module-2-outcome-2",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Tối ưu truy vấn thay vì chỉ chạy được",
                },
                {
                    outcomeId: "fullstack-mastery-module-2-outcome-2",
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Hiểu cách suy nghĩ về indexing, transaction và hiệu năng dữ liệu trong backend thực tế.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-2-outcome-3",
            title: "Hiểu và áp dụng caching vào hệ thống",
            description:
                "Biết vai trò của Redis trong việc giảm tải database và tăng tốc các API đọc nhiều.",
            orderIndex: 2,
            translations: [
                {
                    outcomeId: "fullstack-mastery-module-2-outcome-3",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Hiểu và áp dụng caching vào hệ thống",
                },
                {
                    outcomeId: "fullstack-mastery-module-2-outcome-3",
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Biết vai trò của Redis trong việc giảm tải database và tăng tốc các API đọc nhiều.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-2-outcome-4",
            title: "Tích hợp được nhiều loại database trong cùng một project",
            description:
                "Có thể kết hợp SQL, NoSQL và cache layer trong một backend có tổ chức.",
            orderIndex: 3,
            translations: [
                {
                    outcomeId: "fullstack-mastery-module-2-outcome-4",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Tích hợp được nhiều loại database trong cùng một project",
                },
                {
                    outcomeId: "fullstack-mastery-module-2-outcome-4",
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Có thể kết hợp SQL, NoSQL và cache layer trong một backend có tổ chức.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-2-outcome-5",
            title: "Chọn đúng loại database theo bài toán",
            description:
                "Biết khi nào nên dùng SQL, khi nào nên dùng NoSQL, thay vì chọn theo cảm tính hoặc xu hướng.",
            orderIndex: 4,
            translations: [
                {
                    outcomeId: "fullstack-mastery-module-2-outcome-5",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Chọn đúng loại database theo bài toán",
                },
                {
                    outcomeId: "fullstack-mastery-module-2-outcome-5",
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Biết khi nào nên dùng SQL, khi nào nên dùng NoSQL, thay vì chọn theo cảm tính hoặc xu hướng.",
                },
            ],
        },
    ],
}
