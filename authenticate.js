import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  let payload;
  try {
    payload = verifyAccessToken(authorization.slice(7));
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }

  const user = await User.findById(payload.sub).select('_id name email role managerId isActive');
  if (!user || !user.isActive) throw new AppError('Account is unavailable', 401);
  req.user = user;
  next();
});
