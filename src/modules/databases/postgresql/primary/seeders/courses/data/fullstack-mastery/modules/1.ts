import {
    DeepPartial 
} from "typeorm"
import {
    ModuleEntity 
} from "../../../../../entities"
import ms from "ms"

/**
 * Module #1 for Fullstack Mastery course.
 */
export const fullstackMasteryModule1: DeepPartial<ModuleEntity> = {
    id: "fullstack-mastery-module-1",
    title: "Backend Environment & NestJS Introduction",
    description: "Thiết lập môi trường Node.js, cài đặt NestJS, hiểu Dependency Injection, Module System, Request Lifecycle, Exception Handling, Logging, Validation, và cách tạo API basic.",
    generalContent: {
        id: "fullstack-mastery-general-1",
        title: "Nội dung chung (demo)",
        body: null,
        orderIndex: 0,
        sections: [
            {
                id: "fullstack-mastery-general-1-section-1",
                title: "Giới thiệu",
                body: "## Giới thiệu\n\nNội dung markdown cho học viên (general).",
                orderIndex: 0,
            },
        ],
    },
    advancedContent: {
        id: "fullstack-mastery-advanced-1",
        orderIndex: 0,
        sections: [
            {
                id: "fullstack-mastery-advanced-1-section-1",
                title: "Giới thiệu",
                body: "## Giới thiệu\n\nNội dung markdown cho học viên (advanced).",
                orderIndex: 0,
            },
        ],
    },
    contents: [
        {
            id: "fullstack-mastery-module-1-content-1",
            title: "Tổng quan backend & các tech stack phổ biến",
            description: "Hiểu bức tranh tổng thể backend và vai trò của các ngôn ngữ/framework như Java, C#, NodeJS, Golang, Python trong thực tế.",
            orderIndex: 0,
        },
        {
            id: "fullstack-mastery-module-1-content-2",
            title: "Cài đặt môi trường & khởi tạo project NestJS",
            description: "Setup Node.js, cài đặt NestJS CLI, tạo project và cấu hình môi trường làm việc chuẩn.",
            orderIndex: 1,
        },
        {
            id: "fullstack-mastery-module-1-content-3",
            title: "Dependency Injection & Module System",
            description: "Hiểu cách NestJS quản lý dependency và tổ chức module để xây dựng hệ thống scalable.",
            orderIndex: 2,
        },
        {
            id: "fullstack-mastery-module-1-content-4",
            title: "Request Lifecycle trong NestJS",
            description: "Nắm rõ luồng xử lý request: Middleware → Guard → Pipe → Controller → Service → Interceptor → Exception Filter.",
            orderIndex: 3,
        },
        {
            id: "fullstack-mastery-module-1-content-5",
            title: "Controller & Service pattern",
            description: "Tách biệt xử lý request và business logic để code dễ maintain và mở rộng.",
            orderIndex: 4,
        },
        {
            id: "fullstack-mastery-module-1-content-6",
            title: "Chuẩn hóa config, logging & response",
            description: "Sử dụng env config, logging với Winston và chuẩn hóa response để hệ thống production-ready.",
            orderIndex: 5,
        },
    ],
    exclusiveLessonVideos: [
        {
            id: "fullstack-mastery-module-1-exclusive-lesson-video-1",
            title: "Video bài giảng livestream",
            description: "Video bài giảng trong lúc livestream.",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            durationMs: ms("1.5h"),
            orderIndex: 0,
        },
    ],
    outcomes: [
        {
            id: "fullstack-mastery-module-1-outcome-1",
            title: "Tự build được backend hoàn chỉnh",
            description: "Có thể tự tạo một backend với cấu trúc rõ ràng, chạy được end-to-end từ request đến response.",
            orderIndex: 0,
        },
        {
            id: "fullstack-mastery-module-1-outcome-2",
            title: "Viết code dễ scale và maintain",
            description: "Biết cách tổ chức module, tách layer hợp lý để hệ thống không bị rối khi phát triển lớn.",
            orderIndex: 1,
        },
        {
            id: "fullstack-mastery-module-1-outcome-3",
            title: "Debug và hiểu flow hệ thống",
            description: "Có khả năng trace và debug request từ đầu đến cuối trong hệ thống backend.",
            orderIndex: 2,
        },
        {
            id: "fullstack-mastery-module-1-outcome-4",
            title: "Áp dụng chuẩn production vào project thực tế",
            description: "Biết cách áp dụng logging, config, error handling để project sẵn sàng deploy thực tế.",
            orderIndex: 3,
        },
        {
            id: "fullstack-mastery-module-1-outcome-5",
            title: "Chuyển đổi kiến thức sang các tech stack khác",
            description: "Hiểu bản chất backend để áp dụng sang Java, .NET, Python mà không bị phụ thuộc framework.",
            orderIndex: 4,
        },
    ],
}

