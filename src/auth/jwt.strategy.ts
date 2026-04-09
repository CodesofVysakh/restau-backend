import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
export interface JwtPayload { sub: string; username: string; iat?: number; exp?: number; }
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: config.get<string>('JWT_SECRET') });
  }
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.username) throw new UnauthorizedException('Invalid token');
    return payload;
  }
}
