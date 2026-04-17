import express from 'express';
import User from '../models/User.js';
import QuizResult from '../models/QuizResult.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const leaderboard = await QuizResult.aggregate([
      {
        $group: {
          _id: '$user',
          totalXP: { $sum: { $multiply: ['$score', 3] } },
          quizzesTaken: { $sum: 1 },
        },
      },
      {
        $sort: { totalXP: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $project: {
          _id: 1,
          totalXP: 1,
          quizzesTaken: 1,
          name: '$userInfo.name',
          avatar: '$userInfo.avatar',
        },
      },
    ]);

    res
      .status(200)
      .json({ success: true, count: leaderboard.length, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
