import { useState, useEffect } from 'react';
import { questionsAPI } from '../../services/api';
import ConfirmDialog from '../ConfirmDialog';
import Toast from '../Toast';

const CHAPTERS = {
  10: [
    'Real Numbers',
    'Polynomials',
    'Pair of Linear Equations in Two Variables',
    'Quadratic Equations',
    'Arithmetic Progressions',
    'Triangles',
    'Coordinate Geometry',
    'Introduction to Trigonometry',
    'Some Applications of Trigonometry',
    'Circles',
    'Constructions',
    'Areas Related to Circles',
    'Surface Areas and Volumes',
    'Statistics',
    'Probability',
  ],
  12: [
    'Relations and Functions',
    'Inverse Trigonometric Functions',
    'Matrices',
    'Determinants',
    'Continuity and Differentiability',
    'Application of Derivatives',
    'Integrals',
    'Application of Integrals',
    'Differential Equations',
    'Vector Algebra',
    'Three Dimensional Geometry',
    'Linear Programming',
    'Probability',
  ],
};

const QuestionManager = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [toast, setToast] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    class: '10',
    chapter: '',
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (selectedClassFilter === 'all') {
      setFilteredQuestions(questions);
    } else {
      setFilteredQuestions(
        questions.filter((q) => q.class === selectedClassFilter)
      );
    }
  }, [selectedClassFilter, questions]);

  const fetchQuestions = async () => {
    try {
      const res = await questionsAPI.getAll();
      setQuestions(res.questions);
    } catch (error) {}
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'class') {
      setCurrentQuestion((prev) => ({ ...prev, [name]: value, chapter: '' }));
    } else {
      setCurrentQuestion((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion((prev) => ({ ...prev, options: newOptions }));
  };

  const handleDelete = async () => {
    const { id } = deleteDialog;
    try {
      await questionsAPI.delete(id);
      fetchQuestions();
      setToast({ message: 'Question deleted successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error deleting question.', type: 'error' });
    } finally {
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ isOpen: false, id: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await questionsAPI.update(currentQuestion._id, currentQuestion);
        setToast({
          message: 'Question updated successfully!',
          type: 'success',
        });
      } else {
        await questionsAPI.create(currentQuestion);
        setToast({ message: 'Question added successfully!', type: 'success' });
      }

      setIsEditing(false);
      setCurrentQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        class: '10',
        chapter: '',
      });
      fetchQuestions();
    } catch (error) {
      setToast({
        message: 'Error saving question. Please try again.',
        type: 'error',
      });
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const validExtension = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv');
    if (!validExtension) {
      setToast({
        message: 'Invalid file type. Please upload .xlsx, .xls, or .csv file only.',
        type: 'error',
      });
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToast({
        message: 'File too large. Maximum size is 10MB.',
        type: 'error',
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setToast({ message: 'Parsing file on your device...', type: 'info' });
        
        const XLSX = await import('xlsx');
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          blankrows: false,
          raw: false,
        });

        if (jsonData.length === 0) {
          setToast({ message: 'File is empty or invalid structure.', type: 'error' });
          return;
        }

        setToast({ message: `Uploading ${jsonData.length} questions in chunks...`, type: 'info' });

        const chunkSize = 50;
        let totalUploaded = 0;
        let totalErrors = 0;
        let allErrors = [];

        for (let i = 0; i < jsonData.length; i += chunkSize) {
          const chunk = jsonData.slice(i, i + chunkSize);
          const chunkPayload = { questions: chunk };
          
          try {
            const result = await questionsAPI.bulkUpload(chunkPayload);
            totalUploaded += result.uploaded || 0;
            totalErrors += result.errors || 0;
            if (result.errorDetails) {
              allErrors = [...allErrors, ...result.errorDetails];
            }
          } catch (chunkError) {
            console.error('Chunk upload error:', chunkError);
            totalErrors += chunk.length;
          }
        }

        if (totalErrors > 0 && totalUploaded === 0) {
          setToast({ message: `Upload failed! ${totalErrors} errors found.`, type: 'error' });
        } else if (totalErrors > 0 && totalUploaded > 0) {
          setToast({ message: `Partially uploaded ${totalUploaded} questions. ${totalErrors} rows skipped.`, type: 'warning' });
          fetchQuestions();
        } else {
          setToast({
            message: `Success! Uploaded ${totalUploaded} questions successfully!`,
            type: 'success',
          });
          fetchQuestions();
          setShowBulkUpload(false);
        }
      } catch (error) {
        setToast({
          message: 'Frontend parsing failed. Please check the file format.',
          type: 'error',
        });
      }
    };

    reader.onerror = () => {
      setToast({
        message: 'Failed to read file. Please try again.',
        type: 'error',
      });
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="admin-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="question-manager-header">
        <h2 className="admin-header-title">Question Manager</h2>
        <button
          onClick={() => setShowBulkUpload(!showBulkUpload)}
          className="btn-primary bulk-upload-btn"
        >
          <i className="fas fa-file-excel"></i>
          {showBulkUpload ? 'Hide' : 'Bulk Upload'}
        </button>
      </div>

      {showBulkUpload && (
        <div className="admin-card bulk-upload-card">
          <h4 className="bulk-upload-title">
            <i className="fas fa-upload"></i> Bulk Upload Questions
          </h4>
          <p className="bulk-upload-description">
            Upload an Excel file (.xlsx, .xls) or CSV with your questions.
            Maximum file size: 10MB
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleBulkUpload}
            className="bulk-upload-input"
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-card question-form-card">
        <h3 className="question-form-title">
          {isEditing ? 'Edit Question' : 'Add New Question'}
        </h3>

        <div className="question-form-grid">
          <div className="form-group">
            <label className="form-label">Question Text</label>
            <textarea
              name="question"
              value={currentQuestion.question}
              onChange={handleInputChange}
              placeholder="Type your question here..."
              required
              className="form-input question-textarea"
            />
          </div>

          <div className="options-grid-form">
            {currentQuestion.options.map((opt, i) => (
              <div key={i} className="form-group">
                <label className="form-label">Option {i + 1}</label>
                <input
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={`Enter option ${i + 1}`}
                  required
                  className="form-input"
                />
              </div>
            ))}
          </div>

          <div className="select-filters-grid">
            <div className="form-group">
              <label className="form-label">Correct Answer</label>
              <select
                name="correctAnswer"
                value={currentQuestion.correctAnswer}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="">Select the correct option</option>
                {currentQuestion.options
                  .filter((opt) => opt.trim() !== '')
                  .map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Class</label>
              <select
                name="class"
                value={currentQuestion.class}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="10">Class 10</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Chapter Name</label>
              <select
                name="chapter"
                value={currentQuestion.chapter}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="">Select Chapter</option>
                {CHAPTERS[currentQuestion.class].map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {isEditing ? 'Update Question' : 'Save Question'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentQuestion({
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: '',
                    class: '10',
                    chapter: '',
                  });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="admin-card">
        <div className="questions-list-header">
          <h3 className="questions-list-title">All Questions</h3>
          <div className="class-filter-buttons">
            <button
              onClick={() => setSelectedClassFilter('all')}
              className={`class-filter-btn ${selectedClassFilter === 'all' ? 'active' : ''}`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setSelectedClassFilter('10')}
              className={`class-filter-btn ${selectedClassFilter === '10' ? 'active' : ''}`}
            >
              Class 10 ({questions.filter((q) => q.class === '10').length})
            </button>
            <button
              onClick={() => setSelectedClassFilter('12')}
              className={`class-filter-btn ${selectedClassFilter === '12' ? 'active' : ''}`}
            >
              Class 12 ({questions.filter((q) => q.class === '12').length})
            </button>
          </div>
        </div>

        <div className="enrollment-list-mobile">
          {filteredQuestions.map((q) => (
            <div key={q._id} className="enrollment-card-mobile">
              <div className="enrollment-card-header">
                <div>
                  <div className="enrollment-student-name question-card-text">
                    {q.question.length > 60
                      ? q.question.substring(0, 60) + '...'
                      : q.question}
                  </div>
                  <div className="enrollment-date">
                    Class {q.class} • {q.chapter}
                  </div>
                </div>
              </div>
              <div className="question-card-actions">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setCurrentQuestion(q);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn-action btn-view"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteDialog({ isOpen: true, id: q._id })}
                  className="btn-action btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-table-wrapper enrollment-table-desktop">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Chapter</th>
                <th>Question</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => (
                <tr key={q._id}>
                  <td className="question-table-class">Class {q.class}</td>
                  <td className="question-table-chapter">{q.chapter}</td>
                  <td className="question-table-text">{q.question}</td>
                  <td>
                    <div className="question-table-actions">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setCurrentQuestion(q);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="btn-action btn-view"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({ isOpen: true, id: q._id })
                        }
                        className="btn-action btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default QuestionManager;
