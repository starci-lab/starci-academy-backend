/**
 * HTTP controller — route demo, delegate sang service.
 * (EN: HTTP controller — demo routes delegating to service.)
 */
import {
    Controller,
    Get,
} from "@nestjs/common"
import { GatewayService } from "./gateway.service"

/**
 * Class `GatewayController` — thành phần lab (controller/service/module).
 * (EN: Class `GatewayController` — lesson lab component.)
 */
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  /**
   * Endpoint lấy dữ liệu kho hàng được bảo vệ bởi Circuit Breaker
   * (EN: endpoint to fetch inventory data protected by Circuit Breaker)
   *
   * @returns Promise<{ status: string; data: string; isFallback?: boolean }> - Dữ liệu kho hàng (EN: Inventory data)
   */
  @Get("inventory")
  inventory() {
    // Ủy quyền xử lý cho GatewayService (EN: delegate processing to GatewayService)
    return this.gatewayService.getInventory()
  }
}
