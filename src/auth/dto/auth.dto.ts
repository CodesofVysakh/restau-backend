import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty({ example: 'admin' }) @IsString() username: string;
  @ApiProperty({ example: 'ember2024!' }) @IsString() @MinLength(6) password: string;
}
export class LoginResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() expiresIn: string;
  @ApiProperty() username: string;
}
