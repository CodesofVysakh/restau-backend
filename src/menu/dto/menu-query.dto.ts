import { IsOptional, IsString, IsNumber, IsArray, IsBoolean, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class MenuItemQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString()  category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  search?: string;
  @ApiPropertyOptional() @IsOptional() @Type(()=>Number) @IsNumber() @Min(0) minPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(()=>Number) @IsNumber() @Min(0) maxPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(({value})=> typeof value==='string' ? value.split(',').map((s:string)=>s.trim()) : value) @IsArray() dietary?: string[];
  @ApiPropertyOptional() @IsOptional() @Transform(({value})=>value==='true'||value===true) @IsBoolean() available?: boolean;
}
