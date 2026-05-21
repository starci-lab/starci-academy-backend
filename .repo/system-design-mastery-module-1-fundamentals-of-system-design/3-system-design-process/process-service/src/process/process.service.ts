/**
 * Service lesson — methods documented Logic + Code (§4).
 * (EN: Lesson service — Logic + Code on methods (§4).)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Logger,
} from "@nestjs/common"
import Redis from "ioredis"

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class ProcessService {
    private readonly logger = new Logger(ProcessService.name)

/**
 * Logic — Xử lý nghiệp vụ `clarify` cho lab.
 * Code — `clarify()` — logic trong service/controller.
 * (EN Logic: Business handler `clarify` for the lab.)
 * (EN Code: `clarify()` — in-class handler logic.)
 */
    clarify(systemName: string) {
        this.logger.log(`Clarifying requirements for: ${systemName}`)
        return {
            step: "1. Requirements Clarification",
            functional: [
                `Core feature for ${systemName} (e.g., shorten URL & redirect)`,
                "Custom alias support",
                "Link expiration",
            ],
            nonFunctional: [
                "High Availability: 99.99% (redirects must never fail)",
                "Low Latency: < 50ms for redirects",
                "Scalability: Support 100M new URLs per month",
                "Read-heavy: 10:1 Read-to-Write ratio",
            ],
        }
    }

    /**
 * Logic — Xử lý nghiệp vụ `estimate` cho lab.
 * Code — `estimate()` — logic trong service/controller.
 * (EN Logic: Business handler `estimate` for the lab.)
 * (EN Code: `estimate()` — in-class handler logic.)
 */
    estimate(newUrlsPerMonth: number) {
        this.logger.log(`Estimating scale for new URLs per month: ${newUrlsPerMonth}`)
        
        // 1 month = 30 days = 2.5 million seconds
        const writeQps = Math.ceil(newUrlsPerMonth / (30 * 24 * 3600))
        const readQps = writeQps * 10 // 10:1 ratio
        
        // Assume 500 bytes per URL (Base62 hash, long url, created_at, etc.)
        const storagePerMonthGb = (newUrlsPerMonth * 500) / (1024 * 1024 * 1024)
        const storageFor10YearsTb = (storagePerMonthGb * 12 * 10) / 1024

        return {
            step: "2. Back-of-the-envelope Estimation",
            input: {
                newUrlsPerMonth,
            },
            results: {
                writeQps,
                readQps,
                peakQps: (writeQps + readQps) * 5,
                storageFor10Years: `${storageFor10YearsTb.toFixed(2)} TB`,
            },
            conclusion:
                (writeQps + readQps) > 1000
                    ? "Recommendation: Distributed NoSQL + Redis Cache required"
                    : "Recommendation: Relational DB with Read Replicas might be enough",
        }
    }

    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getHighLevelDesign`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getHighLevelDesign`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getHighLevelDesign() {
        this.logger.log("Generating High-Level Design")
        return {
            step: "3. High-Level Design",
            components: [
                "Load Balancer",
                "Web Servers (API Nodes)",
                "Key-Value Store (Cassandra/DynamoDB)",
                "Distributed Cache (Redis)",
                "Hash Generator Service (Base62 + Zookeeper)",
            ],
            diagram: `
graph TD
    Client((Users)) --> LB[Load Balancer]
    LB --> API[API Servers]
    API --> Cache[(Redis)]
    API --> DB[(NoSQL DB)]
    API --> HashGen[Hash Generator / Zookeeper]
            `,
        }
    }

    /**
 * Logic — Xử lý nghiệp vụ `deepDive` cho lab.
 * Code — `deepDive()` — logic trong service/controller.
 * (EN Logic: Business handler `deepDive` for the lab.)
 * (EN Code: `deepDive()` — in-class handler logic.)
 */
    deepDive() {
        this.logger.log("Analyzing bottlenecks")
        return {
            step: "4. Deep Dive & Bottlenecks",
            issues: [
                {
                    component: "Hash Generation",
                    problem: "Base62 collisions and performance bottleneck",
                    solution: "Pre-generate hashes using an offline Key Generation Service (KGS)",
                },
                {
                    component: "Database",
                    problem: "Latency is too high for redirects",
                    solution: "Aggressive caching with Redis using LRU eviction policy (80/20 rule)",
                },
            ],
            expertTip: "Focus heavily on the read path since URL shorteners are extremely read-heavy (10:1).",
        }
    }
}
