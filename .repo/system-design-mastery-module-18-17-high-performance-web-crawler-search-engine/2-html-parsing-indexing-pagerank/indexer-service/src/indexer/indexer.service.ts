import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bai hoc Parse HTML, indexing va PageRank.
 * (EN: Domain service for HTML Parsing, Indexing, and PageRank.)
 */
@Injectable()
export class IndexerService {

    /**
     * Trich xuat term don gian va tinh PageRank demo cho tai lieu.
     * (EN: Extracts simple terms and computes a demo PageRank for the document.)
     */
    index(url: string, title: string, html: string) {
        const text = html.replace(/<[^>]*>/g, " ").toLowerCase()
        const terms = text
            .split(/[^a-z0-9]+/)
            .filter((term) => term.length > 3)
        const uniqueTerms = [...new Set(terms)]
        const links = [...html.matchAll(/href=["']([^"']+)["']/g)].map((match) => match[1])

        return {
            url,
            title,
            termCount: terms.length,
            uniqueTerms: uniqueTerms.slice(0, 10),
            outboundLinks: links,
            pageRankScore: Number((1 + links.length * 0.15).toFixed(2)),
            indexShard: this.shardFor(url),
        }
    }

    private shardFor(url: string): string {
        const hostname = new URL(url).hostname
        const shard = [...hostname].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4
        return `index-${shard}`
    }

}
