import mongoose from 'mongoose';

const contestResultSchema = new mongoose.Schema({
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [
    {
      questionIndex: Number,
      selectedAnswer: String,
      isCorrect: Boolean,
    },
  ],
  score: {
    type: Number,
    default: 0,
  },
  xpEarned: {
    type: Number,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

contestResultSchema.index({ contest: 1, user: 1 }, { unique: true });

const ContestResult = mongoose.model('ContestResult', contestResultSchema);
export default ContestResult;
