import express from 'express';
import QuizResult from '../models/QuizResult.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/submit', protect, async (req, res) => {
  try {
    const { className, chapter, score, totalQuestions, percentage } = req.body;

    let existingRecord = await QuizResult.findOne({
      user: req.user.id,
      class: className,
      chapter,
    });

    if (existingRecord) {
      return res.status(200).json({
        success: true,
        message: 'Revision completed. No new XP earned.',
        quizResult: existingRecord,
        isRevise: true,
      });
    } else {
      existingRecord = await QuizResult.create({
        user: req.user.id,
        class: className,
        chapter,
        score,
        totalQuestions,
        percentage,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Result saved',
      quizResult: existingRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    const userHistory = await QuizResult.find({ user: req.user.id }).sort({
      date: -1,
    });
    res.status(200).json({
      success: true,
      count: userHistory.length,
      history: userHistory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
