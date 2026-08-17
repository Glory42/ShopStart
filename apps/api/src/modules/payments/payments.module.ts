import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PAYMENT_PROVIDER } from "./payment-provider.token";
import { StubPaymentProvider } from "./stub-payment.provider";

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StubPaymentProvider,
    { provide: PAYMENT_PROVIDER, useExisting: StubPaymentProvider },
  ],
})
export class PaymentsModule {}
