import { Module } from "@nestjs/common";
import { CartModule } from "../cart/cart.module";
import { AddressesModule } from "../addresses/addresses.module";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";

@Module({
  imports: [CartModule, AddressesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
