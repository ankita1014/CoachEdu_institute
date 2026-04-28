import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// ================= TOKEN =================
const signToken = (id, role = 'student') =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const StudentCollection = mongoose.model(
  'auth_students',
  new mongoose.Schema({}, { strict: false }),
  'students'
);

const ParentCollection = mongoose.model(
  'auth_parents',
  new mongoose.Schema({}, { strict: false }),
  'parents'
);

const TeacherCollection = mongoose.model(
  'auth_teachers',
  new mongoose.Schema({}, { strict: false }),
  'teachers'
);

const getCollectionForRole = (role) => {
  if (role === 'student') return { model: StudentCollection, idFields: ['studentId'] };
  if (role === 'parent')  return { model: ParentCollection,  idFields: ['parentId', 'parentid'] };
  if (role === 'teacher') return { model: TeacherCollection, idFields: ['teacherId'] };
  return null;
};

// ── Smart password compare: bcrypt first, plain-text fallback + auto-rehash ──
const comparePassword = async (entered, stored, model, userId) => {
  if (!stored) return false;

  // Check if stored password is a bcrypt hash
  const isBcrypt = stored.startsWith('$2a$') || stored.startsWith('$2b$');

  if (isBcrypt) {
    return bcrypt.compare(entered, stored);
  }

  // Plain text match (legacy) — re-hash on success for migration
  if (String(stored) === String(entered)) {
    try {
      const hashed = await bcrypt.hash(entered, 10);
      await model.updateOne({ _id: userId }, { $set: { password: hashed } });
      console.log(`[auth] Migrated plain-text password to bcrypt for user ${userId}`);
    } catch (e) {
      console.error('[auth] Re-hash failed:', e.message);
    }
    return true;
  }

  return false;
};

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  try {
    const { id, studentId, parentId, teacherId, password, role = 'student' } = req.body;
    const loginId = id || studentId || parentId || teacherId;

    if (!loginId || !password || !role) {
      return res.status(400).json({ success: false, message: 'Provide id, password, and role' });
    }

    const config = getCollectionForRole(role);
    if (!config) return res.status(400).json({ success: false, message: 'Invalid role' });

    const query = { $or: config.idFields.map((field) => ({ [field]: loginId })) };
    const user = await config.model.findOne(query);

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await comparePassword(password, user.password, config.model, user._id);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(user._id, role);
    const userObject = user.toObject ? user.toObject() : user;

    // Never send password in response
    delete userObject.password;

    res.json({ success: true, token, user: { ...userObject, role } });
  } catch (err) {
    console.error('AUTH_LOGIN_ERROR:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const config = getCollectionForRole(decoded.role);

    if (!config) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    const user = await config.model.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const userObject = user.toObject ? user.toObject() : user;

    res.json({
      success: true,
      user: {
        ...userObject,
        role: decoded.role,
      },
    });
  } catch (err) {
    console.error('AUTH_ME_ERROR:', err.message);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
});

export default router;
