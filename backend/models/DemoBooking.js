import mongoose from 'mongoose';

const demoBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Invalid 10-digit mobile number'],
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required'],
  },
  preferredTime: {
    type: String,
    required: [true, 'Preferred time is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  adminRemarks: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DemoBooking = mongoose.model('DemoBooking', demoBookingSchema);
export default DemoBooking;
