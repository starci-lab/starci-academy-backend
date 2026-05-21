/**
 * Service logic chính của lesson — mọi method có JSDoc Logic + Code.
 * (EN: Core lesson service — methods documented with Logic + Code.)
 */
import {
    Injectable,
} from "@nestjs/common"

/**
 * Service xử lý nghiệp vụ cho Search Service.
 * (EN: Service handling business logic for Search Service.)
 */
@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {/**
 * Logic — Đọc/truy vấn dữ liệu qua `getHello`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getHello`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getHello(): string {
        return "Hello World!"
    }
}
