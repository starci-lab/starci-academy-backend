import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bai hoc Phan phoi noi dung qua CDN toan cau.
 * (EN: Domain service for Global CDN Distribution.)
 */
@Injectable()
export class CdnService {

    private readonly edges = [
        { region: "sin", city: "Singapore", latencyMs: 18, cacheHitRatio: 0.94 },
        { region: "hkg", city: "Hong Kong", latencyMs: 32, cacheHitRatio: 0.9 },
        { region: "nrt", city: "Tokyo", latencyMs: 54, cacheHitRatio: 0.88 },
    ]

    /**
     * Chon edge gan nhat va tra ve policy cache cho object.
     * (EN: Selects the nearest edge and returns cache policy for an object.)
     */
    routeObject(objectKey: string, region: string) {
        const preferred = this.edges.find((edge) => edge.region === region) ?? this.edges[0]

        return {
            objectKey,
            selectedEdge: preferred,
            cacheKey: `cdn:${preferred.region}:${objectKey}`,
            originShield: "sin",
            ttlSeconds: 3600,
            staleWhileRevalidateSeconds: 60,
        }
    }

}
