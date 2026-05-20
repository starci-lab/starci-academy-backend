import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bai hoc Kien truc crawler va politeness.
 * (EN: Domain service for Crawling Architecture and Politeness.)
 */
@Injectable()
export class CrawlerService {

    /**
     * Lap lich crawl theo host va ap dung delay politeness mo phong.
     * (EN: Schedules crawling by host and applies simulated politeness delay.)
     */
    schedule(url: string, userAgent: string) {
        const parsedUrl = new URL(url)
        const hostHash = [...parsedUrl.hostname].reduce((sum, char) => sum + char.charCodeAt(0), 0)
        const delaySeconds = 2 + (hostHash % 4)

        return {
            url,
            host: parsedUrl.hostname,
            userAgent,
            robotsPolicy: "allowed-demo",
            crawlAfterSeconds: delaySeconds,
            queue: `host:${parsedUrl.hostname}`,
        }
    }

}
