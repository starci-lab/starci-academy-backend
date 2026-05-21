/**
 * HTTP controller — route demo, delegate sang service.
 * (EN: HTTP controller — demo routes delegating to service.)
 */
import {
    Controller,
    Get,
} from "@nestjs/common"
import { EcommerceService } from "./ecommerce.service"

/**
 * Class `EcommerceController` — thành phần lab (controller/service/module).
 * (EN: Class `EcommerceController` — lesson lab component.)
 */
export class EcommerceController {
  constructor(private readonly ecommerceService: EcommerceService) {}

  /**
   * Endpoint xem lịch sử giao dịch (Áp dụng Bulkhead)
   * (EN: endpoint to view transaction history - Bulkhead applied)
   *
   * @returns Promise<{ status: string; message: string }> - Lịch sử giao dịch (EN: Transaction history)
   */
  @Get("history")
  history() {
    // Ủy quyền cho service xử lý (EN: delegate processing to service)
    return this.ecommerceService.history()
  }

  /**
   * Endpoint thực hiện thanh toán (Không bị ảnh hưởng bởi lỗi của History)
   * (EN: endpoint to execute checkout - unaffected by History errors)
   *
   * @returns Promise<{ status: string; message: string }> - Kết quả thanh toán (EN: Payment result)
   */
  @Get("checkout")
  checkout() {
    // Ủy quyền cho service xử lý (EN: delegate processing to service)
    return this.ecommerceService.checkout()
  }
}
