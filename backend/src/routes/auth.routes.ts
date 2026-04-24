import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_for_dev_only';
const JWT_EXPIRES_IN = '24h';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ error: 'Username, email and password required' });
            return;
        }

        if (!email.endsWith('@gravirei.com')) {
            res.status(401).json({ error: 'unauthorized email detected.' });
            return;
        }

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
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.json({ token, user: payload });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: Request, res: Response) => {
    res.json({ user: req.user });
});

// POST /api/auth/register (Admin Only)
router.post('/register', authenticate, authorize('ADMIN'), async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password, role } = req.body;
        
        // Let's assume register requires email too now
        if (!username || !email || !password) {
            res.status(400).json({ error: 'Username, email and password required' });
            return;
        }
        
        const existing = await UserModel.findByUsername(username);
        if (existing) {
            res.status(409).json({ error: 'Username already taken' });
            return;
        }

        const userRole = role === 'ADMIN' ? 'ADMIN' : 'VIEWER';
        const hash = await bcrypt.hash(password, 10);
        
        const newUser = await UserModel.create(username, email, hash, userRole);
        res.status(201).json(newUser);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/change-password (Admin Only)
router.post('/change-password', authenticate, authorize('ADMIN'), async (req: Request, res: Response): Promise<void> => {
    try {
        const { targetUserId, newPassword } = req.body;
        
        if (!targetUserId || !newPassword) {
            res.status(400).json({ error: 'Target user ID and new password required' });
            return;
        }

        const hash = await bcrypt.hash(newPassword, 10);
        const success = await UserModel.changePassword(targetUserId, hash);
        
        if (!success) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ message: 'Password updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
