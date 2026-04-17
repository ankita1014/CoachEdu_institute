import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import demoBookingRoutes from './routes/demoBookingRoutes.js';
import contestRoutes from './routes/contestRoutes.js';
import teacherRoutes from "./routes/teacherRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import chapterRoutes from "./routes/chapterRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import { syncAllParents } from "./utils/parentSync.js";
import { syncPasswordFormat } from "./utils/parentSync.js";
dotenv.config();
connectDB().then(() => {
  syncAllParents();
  syncPasswordFormat();
});
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors({
  origin:"http://localhost:3000",
  credentials:true
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/chapters", chapterRoutes);
app.use(
  session({
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);
// other routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/demo-bookings', demoBookingRoutes);
app.use('/api/contests', contestRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/inquiry", inquiryRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'active' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
