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
    envConfig 
} from "@modules/env"
import {
    readFileOrDefault 
} from "../../../../utils"

/**
 * Fullstack Mastery Module 1 data.
 */
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
    contents: [
        {
            id: "fullstack-mastery-module-1-content",
            title: "Nội dung (demo)",
            body: readFileOrDefault(
                `${envConfig().mountPath.data.courses}/fullstack-mastery/modules/1/content/body.en.md`, 
                ""
            ),
            orderIndex: 0,
            defaultLocale: Locale.Vi,
            translations: [
                {
                    contentId: "fullstack-mastery-module-1-content",
                    locale: Locale.Vi,
                    field: "title",
                    value: "",
                },
                {
                    contentId: "fullstack-mastery-module-1-content",
                    locale: Locale.Vi,
                    field: "body",
                    value: readFileOrDefault(
                        `${envConfig().mountPath.data.courses}/fullstack-mastery/modules/1/content/body.vi.md`, 
                        ""
                    ),
                },
            ],
        },
    ],
    previewContents: [
        {
            id: "fullstack-mastery-module-1-content-1",
            data: "Understand the backend ecosystem and how languages/frameworks like Java, C#, Node.js, Golang, and Python are used in real-world systems.",
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-1",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Hiểu tổng quan hệ sinh thái backend và vai trò của các ngôn ngữ/framework như Java, C#, Node.js, Golang và Python trong hệ thống thực tế.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-content-2",
            data: "Set up Node.js, install NestJS CLI, and structure a production-ready project from scratch.",
            orderIndex: 1,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-2",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Thiết lập môi trường Node.js, cài đặt NestJS CLI và xây dựng cấu trúc project chuẩn production ngay từ đầu.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-content-3",
            data: "Understand Dependency Injection and the Module System to build scalable and maintainable architectures.",
            orderIndex: 2,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-3",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Hiểu rõ Dependency Injection và Module System để xây dựng kiến trúc dễ mở rộng và dễ bảo trì.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-content-4",
            data: "Master the NestJS request lifecycle: Middleware → Guards → Pipes → Controllers → Services → Interceptors → Exception Filters.",
            orderIndex: 3,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-4",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Nắm vững request lifecycle trong NestJS: Middleware → Guards → Pipes → Controllers → Services → Interceptors → Exception Filters.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-content-5",
            data: "Apply clean architecture principles by separating transport layer from business logic.",
            orderIndex: 4,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-5",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Áp dụng nguyên lý Clean Architecture bằng cách tách biệt tầng xử lý request và business logic.",
                },
            ],
        },
        {
            id: "fullstack-mastery-module-1-content-6",
            data: "Prepare for production with environment config, structured logging (Winston), and standardized API responses.",
            orderIndex: 5,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: "fullstack-mastery-module-1-content-6",
                    locale: Locale.Vi,
                    field: "data",
                    value: "Chuẩn bị hệ thống cho production với cấu hình môi trường, logging có cấu trúc (Winston) và chuẩn hóa response API.",
                },
            ],
        },
    ],
}
