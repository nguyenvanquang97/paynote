import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {Request} from 'express';
import jwt from 'jsonwebtoken';
import {createRemoteJWKSet, jwtVerify} from 'jose';
import {getConfig} from '../../shared/config';
import type {RequestUser} from '../../shared/request-user';

type SupabaseJwtPayload = jwt.JwtPayload & {
  sub?: string;
  email?: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & {user?: RequestUser}>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.verifyToken(token);

    if (!payload.sub) {
      throw new UnauthorizedException('Missing user subject');
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
    };
    return true;
  }

  private async verifyToken(token: string): Promise<SupabaseJwtPayload> {
    const config = getConfig();

    if (config.supabaseJwksUrl) {
      try {
        const jwks = createRemoteJWKSet(new URL(config.supabaseJwksUrl));
        const {payload} = await jwtVerify(token, jwks);
        return payload as SupabaseJwtPayload;
      } catch {
        throw new UnauthorizedException('Invalid bearer token');
      }
    }

    if (config.supabaseJwtSecret) {
      try {
        return jwt.verify(token, config.supabaseJwtSecret) as SupabaseJwtPayload;
      } catch {
        throw new UnauthorizedException('Invalid bearer token');
      }
    }

    throw new UnauthorizedException('Missing Supabase JWT verifier config');
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || null;
  }
}
