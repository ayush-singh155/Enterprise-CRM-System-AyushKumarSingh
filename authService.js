import { createHash, timingSafeEqual } from 'node:crypto';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} from '../utils/tokens.js';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const tokenMatches = (token, storedHash) => {
  if (!storedHash) return false;
  const candidate = Buffer.from(hashToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
};

function createSession(user) {
  const refreshToken = createRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  return { user, accessToken: createAccessToken(user), refreshToken };
}

/** Creates a sales-rep account and signs it in without accepting a role from the client. */
export async function register({ name, email, password }) {
  const user = await User.create({ name, email, password, role: 'sales_rep' });
  const session = createSession(user);
  await user.save();
  return session;
}

/** Verifies credentials and replaces the account's stored refresh-token hash. */
export async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  const session = createSession(user);
  await user.save();
  return session;
}

/** Verifies and rotates the single active refresh token for an account. */
export async function refresh(token) {
  if (!token) throw new AppError('Refresh token required', 401);
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }
  if (payload.type !== 'refresh') throw new AppError('Invalid refresh token', 401);

  const user = await User.findById(payload.sub)
    .select('_id name email role managerId isActive +refreshTokenHash');
  if (!user || !user.isActive || !tokenMatches(token, user.refreshTokenHash)) {
    throw new AppError('Refresh token is no longer valid', 401);
  }
  const session = createSession(user);
  await user.save();
  return session;
}

/** Revokes the stored refresh token when the supplied cookie is still current. */
export async function logout(token) {
  if (!token) return;
  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub).select('+refreshTokenHash');
    if (user && tokenMatches(token, user.refreshTokenHash)) {
      user.refreshTokenHash = null;
      await user.save();
    }
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') throw error;
  }
}
