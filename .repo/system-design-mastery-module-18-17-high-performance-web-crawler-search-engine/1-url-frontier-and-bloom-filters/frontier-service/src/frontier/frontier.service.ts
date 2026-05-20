import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bai hoc URL frontier va Bloom filter.
 * (EN: Domain service for URL Frontier and Bloom Filters.)
 */
@Injectable()
export class FrontierService {

    private readonly seen = new Set<string>([
        "https://example.com/",
    ])

    /**
     * Ap dung Bloom-filter-like check truoc khi dua URL vao frontier.
     * (EN: Applies a Bloom-filter-like check before enqueuing a URL.)
     */
    enqueue(url: string, priority: "low" | "normal" | "high") {
        const normalizedUrl = new URL(url).toString()
        const probablySeen = this.seen.has(normalizedUrl)
        this.seen.add(normalizedUrl)

        return {
            url: normalizedUrl,
            priority,
            probablySeen,
            action: probablySeen ? "skip-duplicate" : "enqueue",
            frontierShard: this.shardFor(normalizedUrl),
            seenEstimate: this.seen.size,
        }
    }

    private shardFor(url: string): string {
        const host = new URL(url).hostname
        const shard = [...host].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 8
        return `frontier-${shard}`
    }

}
