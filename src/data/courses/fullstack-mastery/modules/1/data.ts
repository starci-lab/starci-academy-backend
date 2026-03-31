import type {
    DeepPartial,
} from "typeorm"
import type {
    ModuleEntity,
} from "@modules/databases"
import {
    Locale,
} from "@modules/databases"

export const fullstackMasteryModule1: DeepPartial<ModuleEntity> = {
    id: "fullstack-mastery-module-1",
    title: "Backend Environment & NestJS Introduction",
    description:
        "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
    orderIndex: 0,
    translations: [
        {
            moduleId: "fullstack-mastery-module-1",
            locale: Locale.En,
            field: "title",
            value: "Backend Environment & NestJS Introduction",
        },
        {
            moduleId: "fullstack-mastery-module-1",
            locale: Locale.En,
            field: "description",
            value: "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
        },
    ],
    content: {
        id: "fullstack-mastery-module-1-content",
        title: "Nội dung (demo)",
        body: "## Giới thiệu\n\nNội dung markdown cho học viên.",
        orderIndex: 0,
        defaultLocale: Locale.Vi,
        translations: [
            {
                contentId: "fullstack-mastery-module-1-content",
                locale: Locale.Vi,
                field: "title",
                value: "Nội dung (demo)",
            },
            {
                contentId: "fullstack-mastery-module-1-content",
                locale: Locale.Vi,
                field: "body",
                value: "## Giới thiệu\n\nNội dung markdown cho học viên.",
            },
        ],
    },
    previewContents: [
        {
            id: "fullstack-mastery-module-1-content-1",
            data: "Understand the overall backend landscape and the role of languages/frameworks such as Java, C#, Node.js, Golang, and Python in real-world applications.",
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-1",
                    locale: Locale.En,
                    field: "data",
                    value:
                        "Understand the overall backend landscape and the role of languages/frameworks such as Java, C#, Node.js, Golang, and Python in real-world applications.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-content-2",
            data: "Set up Node.js, install the NestJS CLI, create a project, and configure a standard development environment.",
            orderIndex: 1,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-2",
                    locale: Locale.En,
                    field: "data",
                    value:
                        "Set up Node.js, install the NestJS CLI, create a project, and configure a standard development environment.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-content-3",
            data: "Understand how NestJS manages dependencies and organizes modules to build scalable systems.",
            orderIndex: 2,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-3",
                    locale: Locale.En,
                    field: "data",
                    value: "Understand how NestJS manages dependencies and organizes modules to build scalable systems.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-content-4",
            data: "Master the request lifecycle: Middleware > Guard > Pipe > Controller > Service > Interceptor > Exception Filter.",
            orderIndex: 3,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-4",
                    locale: Locale.En,
                    field: "data",
                    value:
                        "Master the request lifecycle: Middleware > Guard > Pipe > Controller > Service > Interceptor > Exception Filter.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-content-5",
            data: "Separate request handling from business logic to make the codebase easier to maintain and extend.",
            orderIndex: 4,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-5",
                    locale: Locale.En,
                    field: "data",
                    value:
                        "Separate request handling from business logic to make the codebase easier to maintain and extend.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-content-6",
            data: "Use environment configuration, logging with Winston, and standardized responses to make the system production-ready.",
            orderIndex: 5,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-6",
                    locale: Locale.En,
                    field: "data",
                    value:
                        "Use environment configuration, logging with Winston, and standardized responses to make the system production-ready.",
                },
            ],
        },
    ],
    outcomes: [
        {
            id: "fullstack-mastery-module-1-outcome-1",
            title: "Tự build được backend hoàn chỉnh",
            description:
                "Có thể tự tạo một backend với cấu trúc rõ ràng, chạy được end-to-end từ request đến response.",
            orderIndex: 0,
            translations: [
                {
                    outcomeId: "fullstack-mastery-module-1-outcome-1",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Tự build được backend hoàn chỉnh",
                },
                {
                    outcomeId: "fullstack-mastery-module-1-outcome-1",
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Có thể tự tạo một backend với cấu trúc rõ ràng, chạy được end-to-end từ request đến response.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-outcome-2",
            title: "Viết code dễ scale và maintain",
            description:
                "Biết cách tổ chức module, tách layer hợp lý để hệ thống không bị rối khi phát triển lớn.",
            orderIndex: 1,
            translations: [
                {
                    outcomeId: "fullstack-mastery-module-1-outcome-2",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Viết code dễ scale và maintain",
                },
                {
                    outcomeId: "fullstack-mastery-module-1-outcome-2",
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Biết cách tổ chức module, tách layer hợp lý để hệ thống không bị rối khi phát triển lớn.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-outcome-3",
            title: "Debug và hiểu flow hệ thống",
            description:
                "Có khả năng trace và debug request từ đầu đến cuối trong hệ thống backend.",
            orderIndex: 2,
            translations: [
                {
                    outcomeId: "fullstack-mastery-module-1-outcome-3",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Debug và hiểu flow hệ thống",
                },
                {
                    outcomeId: "fullstack-mastery-module-1-outcome-3",
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Có khả năng trace và debug request từ đầu đến cuối trong hệ thống backend.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-outcome-4",
            title: "Áp dụng chuẩn production vào project thực tế",
            description:
                "Biết cách áp dụng logging, config, error handling để project sẵn sàng deploy thực tế.",
            orderIndex: 3,
            translations: [
                {
                    outcomeId: "fullstack-mastery-module-1-outcome-4",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Áp dụng chuẩn production vào project thực tế",
                },
                {
                    outcomeId: "fullstack-mastery-module-1-outcome-4",
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Biết cách áp dụng logging, config, error handling để project sẵn sàng deploy thực tế.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-outcome-5",
            title: "Chuyển đổi kiến thức sang các tech stack khác",
            description:
                "Hiểu bản chất backend để áp dụng sang Java, .NET, Python mà không bị phụ thuộc framework.",
            orderIndex: 4,
            translations: [
                {
                    outcomeId: "fullstack-mastery-module-1-outcome-5",
                    locale: Locale.Vi,
                    field: "title",
                    value: "Chuyển đổi kiến thức sang các tech stack khác",
                },
                {
                    outcomeId: "fullstack-mastery-module-1-outcome-5",
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Hiểu bản chất backend để áp dụng sang Java, .NET, Python mà không bị phụ thuộc framework.",
                },
            ],
        },
    ],
}
