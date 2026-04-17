import express from 'express';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';
import {
  sendEnrollmentConfirmation,
  sendStatusUpdateEmail,
} from '../utils/email.js';
import { sendResubmitConfirmation } from '../utils/emailResubmit.js';
import {
  addEnrollmentToSheet,
  updateEnrollmentStatusInSheet,
} from '../utils/googleSheets.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { courseId, ...enrollmentData } = req.body;

    if (courseId) {
      const selectedCourse = await Course.findById(courseId);
      if (!selectedCourse) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }
    }

    const newEnrollment = await Enrollment.create({
      user: req.user.id,
      course: courseId,
      ...enrollmentData,
    });

    await User.findByIdAndUpdate(req.user.id, {
      $push: { enrollments: newEnrollment._id },
    });

    await newEnrollment.populate('course');

    const currentUser = await User.findById(req.user.id);

    sendEnrollmentConfirmation(currentUser, newEnrollment).catch(() => {});
    addEnrollmentToSheet(newEnrollment, currentUser).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Enrollment submitted',
      enrollment: newEnrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const enrollmentId = req.params.id;
    const existingEnrollment = await Enrollment.findById(enrollmentId);

    if (!existingEnrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    const isOwner = existingEnrollment.user.toString() === req.user.id;
    if (!isOwner) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const updatedData = {
      ...req.body,
      status: 'pending',
      adminRemarks: '',
    };

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      updatedData,
      { new: true, runValidators: true }
    );

    const currentUser = await User.findById(req.user.id);

    sendResubmitConfirmation(currentUser, updatedEnrollment).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Enrollment resubmitted',
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const allEnrollments = await Enrollment.find()
      .select(
        'studentName fatherName motherName dateOfBirth gender aadharNumber mobileNumber address status adminRemarks createdAt class board'
      )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: allEnrollments.length,
      enrollments: allEnrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/stats/count', protect, async (req, res) => {
  try {
    const totalEnrollments = await Enrollment.countDocuments();

    res.status(200).json({
      success: true,
      count: totalEnrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/user/:userId', protect, async (req, res) => {
  try {
    const requestedUserId = req.params.userId;
    const isOwnProfile = req.user.id === requestedUserId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const userEnrollments = await Enrollment.find({ user: requestedUserId })
      .populate('course')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: userEnrollments.length,
      enrollments: userEnrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const enrollmentId = req.params.id;
    const enrollmentRecord = await Enrollment.findById(enrollmentId)
      .populate('user', 'name email phone')
      .populate('course');

    if (!enrollmentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    const isOwner = enrollmentRecord.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    res.status(200).json({
      success: true,
      enrollment: enrollmentRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const enrollmentId = req.params.id;

    const enrollmentRecord =
      await Enrollment.findById(enrollmentId).populate('user');

    if (!enrollmentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    const previousStatus = enrollmentRecord.status;
    enrollmentRecord.status = status;

    if (adminRemarks !== undefined) {
      enrollmentRecord.adminRemarks = adminRemarks;
    }

    await enrollmentRecord.save();

    const statusChanged = previousStatus !== status;
    if (statusChanged) {
      sendStatusUpdateEmail(enrollmentRecord.user, enrollmentRecord, previousStatus, status).catch(() => {});
      updateEnrollmentStatusInSheet(enrollmentRecord._id, status, adminRemarks).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Status updated',
      enrollment: enrollmentRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete enrollments',
      });
    }

    const enrollmentId = req.params.id;
    const enrollmentToDelete = await Enrollment.findById(enrollmentId);

    if (!enrollmentToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    await Enrollment.findByIdAndDelete(enrollmentId);

    res.status(200).json({
      success: true,
      message: 'Enrollment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
