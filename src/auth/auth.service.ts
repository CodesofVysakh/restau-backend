import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, LoginResponseDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const admin = await this.prisma.admin.findUnique({ where: { username: dto.username } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');
    if (!await bcrypt.compare(dto.password, admin.passwordHash)) throw new UnauthorizedException('Invalid credentials');
    const payload: JwtPayload = { sub: admin.id, username: admin.username };
    const accessToken = this.jwt.sign(payload);
    const expiresIn   = this.config.get<string>('JWT_EXPIRES_IN', '8h');
    this.logger.log(`Admin '${admin.username}' logged in`);
    return { accessToken, expiresIn, username: admin.username };
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try { return this.jwt.verify<JwtPayload>(token); }
    catch { throw new UnauthorizedException('Invalid or expired token'); }
  }
}
