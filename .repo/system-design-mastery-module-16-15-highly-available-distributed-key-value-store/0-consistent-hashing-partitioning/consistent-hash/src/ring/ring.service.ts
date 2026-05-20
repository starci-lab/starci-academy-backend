import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bài học Consistent hashing và phân vùng.
 * (EN: Domain service for Consistent Hashing and Partitioning.)
 */
@Injectable()
export class RingService {

    private readonly nodes = ["node-a", "node-b", "node-c", "node-d"]

    /**
     * Ánh xạ key vào node trên hash ring mô phỏng.
     * (EN: Maps a key to a node on the simulated hash ring.)
     */
    map(key: string) {
        const hash = this.hash(key)
        const node = this.nodes[hash % this.nodes.length]

        return {
            key,
            hash,
            assignedNode: node,
            virtualReplicas: 128,
            ringSize: this.nodes.length,
        }
    }

    private hash(value: string): number {
        return [...value].reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 7)
    }

}
