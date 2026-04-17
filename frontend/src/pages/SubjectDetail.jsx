import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/SubjectDetail.css";

import {
  getSubject,
  addSkillAPI,
  addChapterAPI,
  deleteSkillAPI,
} from "../services/api";

export default function SubjectDetail() {
  const { name } = useParams();

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [chapterInputs, setChapterInputs] = useState({});
  const [activeTab, setActiveTab] = useState("skills");
  const [loading, setLoading] = useState(true);

  // ✅ SAFE LOAD
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getSubject(name);
        setSkills(data?.skills || []);
      } catch (err) {
        console.error("Error loading subject:", err);
        setSkills([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [name]);

  // ✅ ADD SKILL
  const addSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      const data = await addSkillAPI(name, newSkill);
      setSkills(data.skills);
      setNewSkill("");
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ ADD CHAPTER
  const addChapter = async (index) => {
    const value = chapterInputs[index];
    if (!value) return;

    try {
      const data = await addChapterAPI(name, index, value);
      setSkills(data.skills);
      setChapterInputs({ ...chapterInputs, [index]: "" });
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ DELETE
  const deleteSkill = async (index) => {
    try {
      const data = await deleteSkillAPI(name, index);
      setSkills(data.skills);
    } catch (err) {
      console.error(err);
    }
  };

  const editSkill = (index) => {
    const newName = prompt("Edit skill name:");
    if (!newName) return;

    const updated = [...skills];
    updated[index].name = newName;
    setSkills(updated);
  };

  // ✅ LOADING STATE (IMPORTANT)
  if (loading) {
    return <h2 style={{ padding: "40px" }}>Loading...</h2>;
  }

  return (
    <div className="sd-container">

      {/* HEADER */}
      <div className="sd-header">
        <div>
          <h2>{name?.toUpperCase()}</h2>
          <p>{skills.length} Skills</p>
        </div>
      </div>

      {/* TABS */}
      <div className="sd-tabs">
        <button
          className={activeTab === "skills" ? "active" : ""}
          onClick={() => setActiveTab("skills")}
        >
          Skills
        </button>
        <button onClick={() => setActiveTab("chapters")}>
          Chapters
        </button>
        <button onClick={() => setActiveTab("overview")}>
          Overview
        </button>
      </div>

      {/* ADD SKILL */}
      {activeTab === "skills" && (
        <>
          <div className="add-bar">
            <input
              placeholder="Enter skill name..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
            <button onClick={addSkill}>Add</button>
          </div>

          <div className="skills-grid">
            {skills.map((skill, index) => (
              <div className="skill-card" key={index}>

                <div className="card-top">
                  <h3>{skill.name}</h3>
                  <div className="actions">
                    <span onClick={() => editSkill(index)}>✏️</span>
                    <span onClick={() => deleteSkill(index)}>❌</span>
                  </div>
                </div>

                <span className={`status ${skill.status || "pending"}`}>
                  {skill.status || "pending"}
                </span>

                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${skill.progress || 0}%` }}
                  />
                </div>

                <ul>
                  {skill.chapters?.map((ch, i) => (
                    <li key={i}>
                      {typeof ch === "object" ? ch.name : ch}
                    </li>
                  ))}
                </ul>

                <div className="chapter-add">
                  <input
                    placeholder="New chapter..."
                    value={chapterInputs[index] || ""}
                    onChange={(e) =>
                      setChapterInputs({
                        ...chapterInputs,
                        [index]: e.target.value,
                      })
                    }
                  />
                  <button onClick={() => addChapter(index)}>Add</button>
                </div>

                <p className="count">
                  {skill.chapters?.length || 0} chapters
                </p>
              </div>
            ))}

            <div className="add-card">+ Add New Skill</div>
          </div>
        </>
      )}
    </div>
  );
}