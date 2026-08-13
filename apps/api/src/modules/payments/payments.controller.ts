import { Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@Controller("orders/:orderId/pay")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  pay(@Param("orderId") orderId: string) {
    return this.payments.pay(orderId);
  }
}
