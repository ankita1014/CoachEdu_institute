import express from 'express';
import Contest from '../models/Contest.js';
import ContestResult from '../models/ContestResult.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const allContests = await Contest.find().sort({ startTime: -1 });
    res.status(200).json({ success: true, contests: allContests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/active', protect, async (req, res) => {
  try {
    const currentTime = new Date();
    const scheduledContests = await Contest.find({
      status: { $in: ['scheduled', 'active'] },
    }).sort({ startTime: 1 });

    const activeContestsList = scheduledContests.map((contest) => {
      const contestEndTime = new Date(
        contest.startTime.getTime() + contest.duration * 60000
      );
      const isCurrentlyActive =
        currentTime >= contest.startTime && currentTime <= contestEndTime;

      return {
        ...contest.toObject(),
        isActive: isCurrentlyActive,
        endTime: contestEndTime,
      };
    });

    res.status(200).json({ success: true, contests: activeContestsList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const contest = await Contest.create(req.body);
    res.status(201).json({ success: true, contest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/bulk-upload', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      fileData,
      questions: reqQuestions,
      title: providedTitle,
      description: providedDescription,
      startTime: providedStartTime,
      endTime: providedEndTime,
      duration: providedDuration,
    } = req.body;

    if (!fileData && (!reqQuestions || !Array.isArray(reqQuestions))) {
      return res.status(400).json({
        success: false,
        message: 'No file data or questions provided',
      });
    }

    let contestData;
    let title = providedTitle || 'Imported Contest';
    let description = providedDescription || '';
    let startTime = providedStartTime || new Date().toISOString();
    let duration = providedDuration || 60;
    let endTime = providedEndTime || new Date(new Date(startTime).getTime() + parseInt(duration) * 60000).toISOString();

    let jsonData = [];

    if (reqQuestions && Array.isArray(reqQuestions)) {
      jsonData = reqQuestions;
    } else if (fileData && (fileData.includes('text/csv') || fileData.includes('spreadsheet'))) {
      const base64Data = fileData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      jsonData = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format or missing data',
      });
    }

    if (jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File or data is empty',
      });
    }

    const questions = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      const questionText =
        row['Question Text'] || row.question || row.Question || row.questionText;
      const option1 = row['Option 1'] || row.option1 || row.Option1;
      const option2 = row['Option 2'] || row.option2 || row.Option2;
      const option3 = row['Option 3'] || row.option3 || row.Option3;
      const option4 = row['Option 4'] || row.option4 || row.Option4;
      let correctAnswer =
        row['Correct Answer'] ||
        row.correctAnswer ||
        row.CorrectAnswer ||
        row.correct_answer;

      if (
        questionText &&
        option1 &&
        option2 &&
        option3 &&
        option4 &&
        correctAnswer
      ) {
        correctAnswer = String(correctAnswer).trim();

        const options = [
          String(option1).trim(),
          String(option2).trim(),
          String(option3).trim(),
          String(option4).trim(),
        ];

        let finalCorrectAnswer = correctAnswer;

        if (
          correctAnswer.toLowerCase() === 'option 1' ||
          correctAnswer === '1'
        ) {
          finalCorrectAnswer = options[0];
        } else if (
          correctAnswer.toLowerCase() === 'option 2' ||
          correctAnswer === '2'
        ) {
          finalCorrectAnswer = options[1];
        } else if (
          correctAnswer.toLowerCase() === 'option 3' ||
          correctAnswer === '3'
        ) {
          finalCorrectAnswer = options[2];
        } else if (
          correctAnswer.toLowerCase() === 'option 4' ||
          correctAnswer === '4'
        ) {
          finalCorrectAnswer = options[3];
        } else {
          const matchedOption = options.find(
            (opt) => opt.toLowerCase() === correctAnswer.toLowerCase()
          );
          if (matchedOption) {
            finalCorrectAnswer = matchedOption;
          }
        }

        questions.push({
          question: questionText,
          options: options,
          correctAnswer: finalCorrectAnswer,
        });
      }
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No valid questions found. Please ensure row columns are correct.',
      });
    }

    contestData = {
      title,
      description,
      startTime,
      endTime,
      duration: parseInt(duration),
      questions,
    };

    const contest = await Contest.create(contestData);

    res.status(201).json({
      success: true,
      message: `Contest "${contestData.title}" created with ${contestData.questions.length} questions`,
      contest,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to upload contest' });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!contest) {
      return res
        .status(404)
        .json({ success: false, message: 'Contest not found' });
    }

    res.status(200).json({ success: true, contest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const contest = await Contest.findByIdAndDelete(req.params.id);

    if (!contest) {
      return res
        .status(404)
        .json({ success: false, message: 'Contest not found' });
    }

    res.status(200).json({ success: true, message: 'Contest deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res
        .status(404)
        .json({ success: false, message: 'Contest not found' });
    }

    res.status(200).json({ success: true, contest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { answers } = req.body;
    const contestId = req.params.id;
    const userId = req.user._id;

    const selectedContest = await Contest.findById(contestId);
    if (!selectedContest) {
      return res
        .status(404)
        .json({ success: false, message: 'Contest not found' });
    }

    const alreadySubmitted = await ContestResult.findOne({
      contest: contestId,
      user: userId,
    });
    if (alreadySubmitted) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'You have already submitted this contest',
        });
    }

    let correctAnswersCount = 0;
    const userAnswers = answers.map((answer, index) => {
      const currentQuestion = selectedContest.questions[index];
      const isAnswerCorrect =
        currentQuestion &&
        answer.selectedAnswer === currentQuestion.correctAnswer;

      if (isAnswerCorrect) {
        correctAnswersCount++;
      }

      return {
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: isAnswerCorrect,
      };
    });

    const xpPoints = correctAnswersCount * 3;

    const contestResult = await ContestResult.create({
      contest: contestId,
      user: userId,
      answers: userAnswers,
      score: correctAnswersCount,
      xpEarned: xpPoints,
      totalQuestions: selectedContest.questions.length,
    });

    res.status(201).json({
      success: true,
      result: {
        score: correctAnswersCount,
        totalQuestions: selectedContest.questions.length,
        xpEarned: xpPoints,
        answers: userAnswers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/leaderboard', protect, async (req, res) => {
  try {
    const contestId = req.params.id;

    const results = await ContestResult.find({ contest: contestId })
      .populate('user', 'name email avatar')
      .sort({ xpEarned: -1, submittedAt: 1 })
      .lean();

    const leaderboard = results.map((result, index) => ({
      rank: index + 1,
      userId: result.user._id,
      userName: result.user.name,
      userEmail: result.user.email,
      userAvatar: result.user.avatar,
      score: result.score,
      xpEarned: result.xpEarned,
      totalQuestions: result.totalQuestions,
      submittedAt: result.submittedAt,
    }));

    res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/my-result', protect, async (req, res) => {
  try {
    const contestId = req.params.id;
    const userId = req.user._id;

    const result = await ContestResult.findOne({
      contest: contestId,
      user: userId,
    })
      .populate('contest', 'title questions')
      .lean();

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: 'No submission found' });
    }

    res.status(200).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
