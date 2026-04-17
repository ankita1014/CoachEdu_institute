import React, { useState, useEffect } from "react";
import "./SkillsModal.css";
import axios from "axios";
import { motion } from "framer-motion";

const SkillsModal = ({ subject, close }) => {
  const [activeSkill, setActiveSkill] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [newChapter, setNewChapter] = useState("");

  // FETCH
  const fetchChapters = async (skillName) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/chapters/${skillName}`
      );
      setChapters(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ADD
  const addChapter = async () => {
    if (!newChapter || !activeSkill) return;

    try {
      await axios.post("http://localhost:5000/api/chapters", {
        skillName: activeSkill,
        subjectName: subject.name,
        chapterName: newChapter,
      });

      setNewChapter("");
      fetchChapters(activeSkill);
    } catch (err) {
      console.log(err);
    }
  };

  // DELETE
  const deleteChapter = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/chapters/${id}`);
      fetchChapters(activeSkill);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (activeSkill) fetchChapters(activeSkill);
  }, [activeSkill]);

  return (
    <div className="modal-overlay" onClick={close}>
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* HEADER */}
        <div className="modal-header">
          <h2>{subject.name}</h2>
          <button onClick={close}>✕</button>
        </div>

        {/* SKILLS */}
        <div className="skills-grid">
          {subject.skills.map((skill, index) => (
            <div
              key={index}
              className={`skill-card ${
                activeSkill === skill.name ? "active" : ""
              }`}
              onClick={() => setActiveSkill(skill.name)}
            >
              <h4>{skill.name}</h4>
            </div>
          ))}
        </div>

        {/* ACTIVE SKILL PANEL */}
        {activeSkill && (
          <div className="chapter-panel">
            <h3>{activeSkill} Chapters</h3>

            {/* INPUT */}
            <div className="add-box">
              <input
                type="text"
                placeholder="Enter chapter name..."
                value={newChapter}
                onChange={(e) => setNewChapter(e.target.value)}
              />
              <button onClick={addChapter}>Add</button>
            </div>

            {/* LIST */}
            <div className="chapter-list">
              {chapters.length === 0 ? (
                <p>No chapters yet</p>
              ) : (
                chapters.map((ch) => (
                  <div key={ch._id} className="chapter-item">
                    <span>{ch.chapterName}</span>
                    <button onClick={() => deleteChapter(ch._id)}>
                      ❌
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SkillsModal;