import { Controller, Get, Post, Patch, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { PlaceOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post()                                               placeOrder       (@Body() dto: PlaceOrderDto)                                  { return this.orders.placeOrder(dto); }
  @Get()           @UseGuards(JwtAuthGuard) @ApiBearerAuth() getAllOrders()                                                            { return this.orders.getAllOrders(); }
  @Get('session/:sid')                                  getBySession     (@Param('sid') sid: string)                                   { return this.orders.getOrdersBySession(sid); }
  @Get(':id')                                           getById          (@Param('id', ParseUUIDPipe) id: string)                      { return this.orders.getOrderById(id); }
  @Patch(':id/status') @UseGuards(JwtAuthGuard) @ApiBearerAuth() updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderStatusDto) { return this.orders.updateStatus(id, dto); }
}
