import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bài học Search phân tán, sharding và relevance.
 * (EN: Domain service for Distributed Search Sharding and Relevance.)
 */
@Injectable()
export class SearchService {

    private readonly documents = [
        { id: "p1", shard: "products-0", title: "Laptop Pro 14", score: 12.4 },
        { id: "p2", shard: "products-1", title: "Laptop Air 13", score: 10.8 },
        { id: "p3", shard: "products-2", title: "Laptop Dock", score: 7.2 },
    ]

    /**
     * Truy vấn nhiều shard rồi sắp xếp kết quả theo relevance score.
     * (EN: Queries multiple shards and sorts hits by relevance score.)
     */
    query(q: string) {
        return {
            query: q,
            tookMs: 7,
            shards: {
                total: 3,
                successful: 3,
            },
            hits: this.documents
                .filter((doc) => doc.title.toLowerCase().includes(q.toLowerCase()))
                .sort((a, b) => b.score - a.score),
        }
    }

}
