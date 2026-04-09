import { IsString, IsUUID, IsEnum, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../common/types';
export class PlaceOrderDto {
  @ApiProperty() @IsUUID()    sessionId:    string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(10) tableNumber: string;
  @ApiProperty({ description: 'Last 4 digits — use 0000 to simulate failure' }) @IsString() @MinLength(4) @MaxLength(4) cardLastFour: string;
}
export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus }) @IsEnum(OrderStatus) status: OrderStatus;
}
