import { IsString, IsUUID, IsInt, IsOptional, IsArray, ValidateNested, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CartCustomizationDto { @ApiProperty() @IsUUID() optionId: string; }
export class AddCartItemDto {
  @ApiProperty() @IsUUID() menuItemId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(20) quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(()=>CartCustomizationDto) customizations?: CartCustomizationDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) specialInstructions?: string;
}
export class UpdateCartItemDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(20) quantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) specialInstructions?: string;
}
export class SetTableDto { @ApiProperty() @IsString() @MaxLength(10) tableNumber: string; }
