import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto, SetTableDto } from './dto/cart.dto';
@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}
  @Get(':sid')                         getCart    (@Param('sid') sid: string)                                          { return this.cart.getCartWithPriceCheck(sid); }
  @Post(':sid/table')                  setTable   (@Param('sid') sid: string, @Body() dto: SetTableDto)                { return this.cart.setTable(sid, dto); }
  @Post(':sid/items')                  addItem    (@Param('sid') sid: string, @Body() dto: AddCartItemDto)             { return this.cart.addItem(sid, dto); }
  @Patch(':sid/items/:id')             updateItem (@Param('sid') sid: string, @Param('id') id: string, @Body() dto: UpdateCartItemDto) { return this.cart.updateItem(sid, id, dto); }
  @Delete(':sid/items/:id') @HttpCode(HttpStatus.OK) removeItem(@Param('sid') sid: string, @Param('id') id: string)  { return this.cart.removeItem(sid, id); }
  @Delete(':sid')           @HttpCode(HttpStatus.NO_CONTENT) clearCart(@Param('sid') sid: string)                     { return this.cart.clearCart(sid); }
}
