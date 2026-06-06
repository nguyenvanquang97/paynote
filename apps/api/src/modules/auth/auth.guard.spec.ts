import {ExecutionContext, UnauthorizedException} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import {AuthGuard} from './auth.guard';

const makeContext = (authorization?: string): ExecutionContext => ({
  switchToHttp: () => ({
    getRequest: () => ({headers: {authorization}}),
  }),
} as unknown as ExecutionContext);

describe('AuthGuard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {...originalEnv, DATABASE_URL: 'postgres://example', SUPABASE_JWT_SECRET: 'secret'};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects missing bearer token', async () => {
    await expect(new AuthGuard().canActivate(makeContext())).rejects.toThrow(UnauthorizedException);
  });

  it('rejects invalid bearer token', async () => {
    await expect(new AuthGuard().canActivate(makeContext('Bearer nope'))).rejects.toThrow(UnauthorizedException);
  });

  it('attaches current user from a valid Supabase JWT', async () => {
    const token = jwt.sign({sub: 'user-1', email: 'u@example.com'}, 'secret');
    const request = {headers: {authorization: `Bearer ${token}`}} as any;
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await expect(new AuthGuard().canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({id: 'user-1', email: 'u@example.com'});
  });
});
