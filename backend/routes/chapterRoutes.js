import express from "express";
import Chapter from "../models/Chapter.js";

const router = express.Router();


// ➕ ADD CHAPTER
router.post("/", async (req, res) => {
  try {
    const { skillName, subjectName, chapterName } = req.body;

    const newChapter = new Chapter({
      skillName,
      subjectName,
      chapterName,
    });

    await newChapter.save();
    res.json(newChapter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 📥 GET CHAPTERS BY SKILL
router.get("/:skillName", async (req, res) => {
  try {
    const chapters = await Chapter.find({
      skillName: req.params.skillName,
    });

    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;