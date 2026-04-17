import express from "express";
import Subject from "../models/Subject.js";

const router = express.Router();

// ── Default skills per subject ────────────────────────────────────────────────
const DEFAULT_SKILLS = {
  english: ["Grammar", "Reading", "Writing"],
  maths:   ["Numbers", "Addition", "Subtraction", "Tables"],
  marathi: ["Vachan (Reading)", "Lekhan (Writing)", "Shabda (Vocabulary)"],
  hindi:   ["Varnamala", "Shabd", "Vakya", "Reading"],
};

// ── GET subject — auto-seed defaults if empty ─────────────────────────────────
router.get("/:name", async (req, res) => {
  try {
    const key = req.params.name.toLowerCase();
    let subject = await Subject.findOne({ name: key });

    if (!subject) {
      // Create with defaults
      const defaults = (DEFAULT_SKILLS[key] || []).map((n) => ({ name: n, chapters: [], status: "pending", progress: 0 }));
      subject = await Subject.create({ name: key, skills: defaults });
    } else if (subject.skills.length === 0 && DEFAULT_SKILLS[key]) {
      // Seed defaults into existing empty subject
      subject.skills = DEFAULT_SKILLS[key].map((n) => ({ name: n, chapters: [], status: "pending", progress: 0 }));
      await subject.save();
    }

    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADD SKILL (with duplicate check) ─────────────────────────────────────────
router.post("/:name/skill", async (req, res) => {
  try {
    const { name, description } = req.body;
    const trimmed = (name || "").trim();

    if (!trimmed) {
      return res.status(400).json({ error: "Skill name is required" });
    }

    const key = req.params.name.toLowerCase();
    let subject = await Subject.findOne({ name: key });

    if (!subject) {
      subject = new Subject({ name: key, skills: [] });
    }

    // Duplicate check (case-insensitive)
    const exists = subject.skills.some(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      return res.status(409).json({ error: `Skill "${trimmed}" already exists` });
    }

    subject.skills.push({ name: trimmed, description: description || "", chapters: [], status: "pending", progress: 0 });
    await subject.save();

    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADD CHAPTER ───────────────────────────────────────────────────────────────
router.post("/:name/skill/:skillIndex/chapter", async (req, res) => {
  try {
    const { chapter } = req.body;
    const subject = await Subject.findOne({ name: req.params.name.toLowerCase() });
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    subject.skills[req.params.skillIndex].chapters.push(chapter);
    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE SKILL ──────────────────────────────────────────────────────────────
router.delete("/:name/skill/:index", async (req, res) => {
  try {
    const subject = await Subject.findOne({ name: req.params.name.toLowerCase() });
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    subject.skills.splice(req.params.index, 1);
    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE SKILL ──────────────────────────────────────────────────────────────
router.put("/:name/skill/:index", async (req, res) => {
  try {
    const { updatedSkill } = req.body;
    const subject = await Subject.findOne({ name: req.params.name.toLowerCase() });
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    subject.skills[req.params.index] = { ...subject.skills[req.params.index].toObject(), ...updatedSkill };
    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── TOGGLE CHAPTER COMPLETION ─────────────────────────────────────────────────
router.patch("/:name/skill/:skillIndex/chapter/:chapterIndex/toggle", async (req, res) => {
  try {
    const subject = await Subject.findOne({ name: req.params.name.toLowerCase() });
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    const skill = subject.skills[req.params.skillIndex];
    if (!skill) return res.status(404).json({ error: "Skill not found" });

    const chapter = skill.chapters[req.params.chapterIndex];
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });

    chapter.completed = !chapter.completed;

    // Recalculate skill progress from chapter completion
    const total = skill.chapters.length;
    const done  = skill.chapters.filter((c) => c.completed).length;
    skill.progress = total > 0 ? Math.round((done / total) * 100) : 0;

    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
