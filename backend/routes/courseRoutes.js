import express from 'express';
import Course from '../models/Course.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { class: classLevel, medium } = req.query;
    let searchQuery = { isActive: true };

    if (classLevel) {
      searchQuery.class = parseInt(classLevel);
    }
    if (medium) {
      searchQuery.medium = medium;
    }

    const availableCourses = await Course.find(searchQuery).sort({ class: 1 });
    res.status(200).json({
      success: true,
      count: availableCourses.length,
      courses: availableCourses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats/count', async (req, res) => {
  try {
    const count = await Course.countDocuments({ isActive: true });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: 'Course not found' });

    res.status(200).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, message: 'Course created', course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: 'Course not found' });

    res.status(200).json({ success: true, message: 'Course updated', course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: 'Course not found' });

    res.status(200).json({ success: true, message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
