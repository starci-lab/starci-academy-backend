import {
    ChallengeDifficulty,
    Locale,
} from "@modules/databases"
import type {
    MockInterviewClassicPrompt,
} from "../types"

/**
 * Curated "classic" system-design interview prompts (Pha 3) — supplement the
 * per-course capstone bank with widely-recognized problems from real technical
 * interviews. Deliberately STATIC (not AI-generated at request time): no live
 * generation cost, no per-request caching/quality-control decisions needed —
 * the interviewer + grader still ground their responses in the current
 * course's RAG content, so the same static prompt reads differently depending
 * on which course the learner is enrolled in.
 */
export const MOCK_INTERVIEW_CLASSIC_PROMPTS: ReadonlyArray<MockInterviewClassicPrompt> = [
    {
        id: "classic-url-shortener",
        difficulty: ChallengeDifficulty.Easy,
        title: {
            [Locale.En]: "Design a URL shortener",
            [Locale.Vi]: "Thiết kế dịch vụ rút gọn URL",
        },
    },
    {
        id: "classic-rate-limiter",
        difficulty: ChallengeDifficulty.Easy,
        title: {
            [Locale.En]: "Design a rate limiter",
            [Locale.Vi]: "Thiết kế bộ giới hạn tốc độ (rate limiter)",
        },
    },
    {
        id: "classic-parking-garage",
        difficulty: ChallengeDifficulty.Easy,
        title: {
            [Locale.En]: "Design a parking garage system",
            [Locale.Vi]: "Thiết kế hệ thống bãi đỗ xe",
        },
    },
    {
        id: "classic-kv-store",
        difficulty: ChallengeDifficulty.Medium,
        title: {
            [Locale.En]: "Design a distributed key-value store",
            [Locale.Vi]: "Thiết kế kho lưu trữ key-value phân tán",
        },
    },
    {
        id: "classic-notification-system",
        difficulty: ChallengeDifficulty.Medium,
        title: {
            [Locale.En]: "Design a notification system",
            [Locale.Vi]: "Thiết kế hệ thống gửi thông báo",
        },
    },
    {
        id: "classic-chat-app",
        difficulty: ChallengeDifficulty.Medium,
        title: {
            [Locale.En]: "Design a real-time chat application",
            [Locale.Vi]: "Thiết kế ứng dụng nhắn tin thời gian thực",
        },
    },
    {
        id: "classic-news-feed",
        difficulty: ChallengeDifficulty.Medium,
        title: {
            [Locale.En]: "Design a social media news feed",
            [Locale.Vi]: "Thiết kế news feed mạng xã hội",
        },
    },
    {
        id: "classic-web-crawler",
        difficulty: ChallengeDifficulty.Medium,
        title: {
            [Locale.En]: "Design a web crawler",
            [Locale.Vi]: "Thiết kế web crawler quy mô lớn",
        },
    },
    {
        id: "classic-autocomplete",
        difficulty: ChallengeDifficulty.Medium,
        title: {
            [Locale.En]: "Design a search typeahead/autocomplete system",
            [Locale.Vi]: "Thiết kế tính năng gợi ý tìm kiếm (typeahead)",
        },
    },
    {
        id: "classic-elevator-system",
        difficulty: ChallengeDifficulty.Medium,
        title: {
            [Locale.En]: "Design an elevator control system",
            [Locale.Vi]: "Thiết kế hệ thống điều phối thang máy",
        },
    },
    {
        id: "classic-ride-sharing",
        difficulty: ChallengeDifficulty.Hard,
        title: {
            [Locale.En]: "Design a ride-sharing dispatch system",
            [Locale.Vi]: "Thiết kế hệ thống điều phối xe (kiểu Uber)",
        },
    },
    {
        id: "classic-video-streaming",
        difficulty: ChallengeDifficulty.Hard,
        title: {
            [Locale.En]: "Design a video streaming service",
            [Locale.Vi]: "Thiết kế dịch vụ streaming video",
        },
    },
    {
        id: "classic-job-scheduler",
        difficulty: ChallengeDifficulty.Hard,
        title: {
            [Locale.En]: "Design a distributed job scheduler",
            [Locale.Vi]: "Thiết kế bộ lập lịch tác vụ phân tán",
        },
    },
    {
        id: "classic-payment-processing",
        difficulty: ChallengeDifficulty.Hard,
        title: {
            [Locale.En]: "Design a payment processing system",
            [Locale.Vi]: "Thiết kế hệ thống xử lý thanh toán",
        },
    },
]
