import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
  },
  class: {
    type: Number,
    required: [true, 'Class is required'],
    min: 1,
    max: 12,
  },
  medium: {
    type: String,
    enum: ['English', 'Hindi', 'Both'],
    required: [true, 'Medium is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    default: '1 Year',
  },
  features: [
    {
      type: String,
    },
  ],
  subjects: [
    {
      type: String,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Course = mongoose.model('Course', courseSchema);
export default Course;
