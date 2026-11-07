import * as authService from '../services/authService.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const durationToMilliseconds = (duration) => {
  const [, amount, unit] = duration.match(/^(\d+)([smhd])$/);
  const factors = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(amount) * factors[unit];
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: durationToMilliseconds(env.REFRESH_TOKEN_TTL)
});

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.cookie('refreshToken', result.refreshToken, cookieOptions());
  res.status(201).json({ accessToken: result.accessToken, user: publicUser(result.user) });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.cookie('refreshToken', result.refreshToken, cookieOptions());
  res.json({ accessToken: result.accessToken, user: publicUser(result.user) });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.cookies.refreshToken);
  res.cookie('refreshToken', result.refreshToken, cookieOptions());
  res.json({ accessToken: result.accessToken, user: publicUser(result.user) });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies.refreshToken);
  res.clearCookie('refreshToken', { ...cookieOptions(), maxAge: undefined });
  res.status(204).end();
});

export const me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};
