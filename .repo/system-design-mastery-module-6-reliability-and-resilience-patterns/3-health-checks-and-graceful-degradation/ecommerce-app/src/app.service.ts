/**
 * Service logic chính của lesson — mọi method có JSDoc Logic + Code.
 * (EN: Core lesson service — methods documented with Logic + Code.)
 */
import { Injectable } from "@nestjs/common"
import {
  ConfigService,
} from "@nestjs/config"
import type {
  HealthConfig,
} from "./config"

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {
  // Mảng lưu trữ dữ liệu heap để giả lập tăng tải trong V8 heap (EN: keep heap data blocks to simulate V8 heap pressure)
  private memoryBlocks: number[][] = []
  private readonly heapThresholdMb: number

  constructor(private readonly configService: ConfigService) {
    const health = this.configService.getOrThrow<HealthConfig>("health")
    this.heapThresholdMb = health.heapThresholdMb
  }

  /**
   * Tăng tải bộ nhớ bằng cách cấp phát thêm 50MB (EN: stress memory by allocating an additional 50MB)
   *
   * @returns { status: string; message: string; blocks: number } - Trạng thái cấp phát (EN: Allocation status)
   */
  stressMemory() {
    // Cấp phát khoảng ~50MB trên V8 heap (EN: allocate about ~50MB on V8 heap)
    const block = new Array<number>(6_500_000).fill(Math.random())

    // Lưu vào mảng để không bị GC thu hồi (EN: store in array to prevent GC collection)
    this.memoryBlocks.push(block)

    // Trả về thông tin hiện tại (EN: return current information)
    return {
      status: "success",
      message: "Allocated 50MB memory block",
      blocks: this.memoryBlocks.length,
    }
  }

  /**
   * Lấy danh sách sản phẩm với cơ chế Graceful Degradation
   * (EN: get products list with Graceful Degradation mechanism)
   *
   * @returns { status: string; message?: string; data[] } - Danh sách sản phẩm (EN: Product list)
   */
  products() {
    // Tính toán lượng RAM đang sử dụng tính theo MB (EN: calculate current RAM usage in MB)
    const usedMb = process.memoryUsage().heapUsed / 1024 / 1024

    // Kiểm tra nếu bộ nhớ vượt quá ngưỡng degrade cấu hình (EN: check if usage exceeds configured degrade threshold)/**
 * Logic — Xử lý nghiệp vụ `if` cho lab.
 * Code — `if()` — logic trong service/controller.
 * (EN Logic: Business handler `if` for the lab.)
 * (EN Code: `if()` — in-class handler logic.)
 */
    if (usedMb > this.heapThresholdMb) {
      // Thực hiện Graceful Degradation: tắt tính năng AI tốn tài nguyên (EN: perform Graceful Degradation: disable resource-intensive AI feature)
      return {
        status: "degraded",
        message: "System is overloaded. AI Suggestion feature is temporarily disabled.",
        data: [
          { id: 1, name: "Default Product A" },
          { id: 2, name: "Default Product B" },
        ],
      }
    }

    // Trả về dữ liệu đầy đủ tính năng khi hệ thống ổn định (EN: return full-featured data when system is stable)
    return {
      status: "success",
      data: [
        { id: 1, name: "AI Suggestion - Premium Product" },
        { id: 2, name: "AI Suggestion - Popular Product" },
      ],
    }
  }
}
