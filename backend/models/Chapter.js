import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
  skillName: String,
  subjectName: String,
  chapterName: String,
});

export default mongoose.model("Chapter", chapterSchema);