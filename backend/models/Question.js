import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  questionHindi: {
    type: String,
    trim: true,
    default: '',
  },
  options: {
    type: [String],
    required: [true, 'At least 2 options are required'],
    validate: [
      (v) => Array.isArray(v) && v.length >= 2,
      'Options array must have at least 2 items',
    ],
  },
  correctAnswer: {
    type: String,
    required: [true, 'Correct answer is required'],
  },
  class: {
    type: String,
    required: [true, 'Class level is required'],
    enum: ['10', '12'],
  },
  chapter: {
    type: String,
    required: [true, 'Chapter name is required'],
    trim: true,
  },
  subject: {
    type: String,
    default: 'Mathematics',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

questionSchema.pre('save', function (next) {
  if (this.chapter) {
    this.chapter = this.chapter.trim();
  }
  next();
});

questionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.chapter) {
    update.chapter = update.chapter.trim();
  }
  if (update.$set && update.$set.chapter) {
    update.$set.chapter = update.$set.chapter.trim();
  }
  next();
});

const Question = mongoose.model('Question', questionSchema);
export default Question;
