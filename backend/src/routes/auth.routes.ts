import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserModel } from '../models/user.model';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginRateLimiter } from '../middleware/rateLimit';
import { asyncHandler } from '../lib/errors';
import { env } from '../config/env';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username required'),
  email: z.string().email().endsWith('@gravirei.com', 'Only @gravirei.com emails allowed'),
  password: z.string().min(1, 'Password required'),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().endsWith('@gravirei.com'),
  password: z.string().min(8).max(128),
  role: z.enum(['ADMIN', 'VIEWER']).optional().default('VIEWER'),
});

const changePasswordSchema = z.object({
  targetUserId: z.number().int().positive(),
  newPassword: z.string().min(8).max(128),
});

export { loginSchema, registerSchema, changePasswordSchema };

// POST /api/auth/login
router.post(
  '/login',
  loginRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password } = req.body as z.infer<typeof loginSchema>;

    const user = await UserModel.findByUsername(username);
    if (!user || user.email !== email) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as unknown as number,
    } as jwt.SignOptions);

    res.json({ token, user: payload });
  })
);

// GET /api/auth/me
router.get('/me', authenticate, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// POST /api/auth/register (Admin Only)
router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  validate({ body: registerSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password, role } = req.body as z.infer<typeof registerSchema>;

    const existing = await UserModel.findByUsername(username);
    if (existing) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    const userRole = role === 'ADMIN' ? 'ADMIN' : 'VIEWER';
    const hash = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create(username, email, hash, userRole);
    res.status(201).json(newUser);
  })
);

// POST /api/auth/change-password (Admin Only)
router.post(
  '/change-password',
  authenticate,
  authorize('ADMIN'),
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { targetUserId, newPassword } = req.body as z.infer<typeof changePasswordSchema>;

    const hash = await bcrypt.hash(newPassword, 10);
    const success = await UserModel.changePassword(targetUserId, hash);

    if (!success) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'Password updated successfully' });
  })
);

export default router;
