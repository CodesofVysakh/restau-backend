import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = { admin: { findUnique: jest.fn() } };
const mockJwt    = { sign: jest.fn(), verify: jest.fn() };
const mockConfig = { get: jest.fn((_: string, d?: any) => d) };

describe('AuthService', () => {
  let svc: AuthService;
  beforeEach(async () => {
    const m = await Test.createTestingModule({ providers: [AuthService, { provide: PrismaService, useValue: mockPrisma }, { provide: JwtService, useValue: mockJwt }, { provide: ConfigService, useValue: mockConfig }] }).compile();
    svc = m.get(AuthService);
    jest.clearAllMocks();
  });

  it('returns token on valid credentials', async () => {
    mockPrisma.admin.findUnique.mockResolvedValue({ id: 'id', username: 'admin', passwordHash: await bcrypt.hash('pass', 10) });
    mockJwt.sign.mockReturnValue('tok');
    mockConfig.get.mockReturnValue('8h');
    const r = await svc.login({ username: 'admin', password: 'pass' });
    expect(r.accessToken).toBe('tok');
  });

  it('throws on unknown user', async () => {
    mockPrisma.admin.findUnique.mockResolvedValue(null);
    await expect(svc.login({ username: 'x', password: 'x' })).rejects.toThrow(UnauthorizedException);
  });

  it('throws on wrong password', async () => {
    mockPrisma.admin.findUnique.mockResolvedValue({ id: 'id', username: 'admin', passwordHash: await bcrypt.hash('right', 10) });
    await expect(svc.login({ username: 'admin', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
  });

  it('validateToken returns payload for valid token', async () => {
    const payload = { sub: 'id', username: 'admin' };
    mockJwt.verify.mockReturnValue(payload);
    expect(await svc.validateToken('t')).toEqual(payload);
  });

  it('validateToken throws for invalid token', async () => {
    mockJwt.verify.mockImplementation(() => { throw new Error('expired'); });
    await expect(svc.validateToken('bad')).rejects.toThrow(UnauthorizedException);
  });
});
