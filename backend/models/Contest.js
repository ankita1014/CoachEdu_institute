import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Contest title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    default: 60,
  },
  questions: [
    {
      question: {
        type: String,
        required: true,
      },
      options: {
        type: [String],
        required: true,
        validate: [(arr) => arr.length === 4, 'Must have exactly 4 options'],
      },
      correctAnswer: {
        type: String,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed'],
    default: 'scheduled',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

contestSchema.pre('save', function (next) {
  if (this.startTime && this.duration && !this.endTime) {
    this.endTime = new Date(this.startTime.getTime() + this.duration * 60000);
  }
  next();
});

const Contest = mongoose.model('Contest', contestSchema);
export default Contest;
