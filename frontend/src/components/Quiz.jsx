import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { questionsAPI, quizAPI } from '../services/api';
import Toast from './Toast';

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState('class-select');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [showWarning, setShowWarning] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && view === 'quiz' && questions.length > 0) {
        sessionStorage.removeItem('quizView');
        sessionStorage.removeItem('quizClass');
        sessionStorage.removeItem('quizChapter');
        navigate('/', { replace: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [view, questions, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const classParam = params.get('class');
    const chapterParam = params.get('chapter');

    if (!classParam && !chapterParam) {
      setView('class-select');
      setSelectedClass(null);
      setSelectedChapter(null);
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      setQuestions([]);
      setChapters([]);
      sessionStorage.removeItem('quizView');
      sessionStorage.removeItem('quizClass');
      sessionStorage.removeItem('quizChapter');
    } else if (classParam && !chapterParam) {
      setView('chapter-select');
      setSelectedClass(classParam);
      sessionStorage.setItem('quizView', 'chapter-select');
      sessionStorage.setItem('quizClass', classParam);
    } else if (classParam && chapterParam) {
      setView('quiz');
      setSelectedClass(classParam);
      setSelectedChapter(chapterParam);
      sessionStorage.setItem('quizView', 'quiz');
      sessionStorage.setItem('quizClass', classParam);
      sessionStorage.setItem('quizChapter', chapterParam);
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (view === 'class-select') {
      params.delete('class');
      params.delete('chapter');
    } else if (view === 'chapter-select' && selectedClass) {
      params.set('class', selectedClass);
      params.delete('chapter');
    } else if (view === 'quiz' && selectedClass && selectedChapter) {
      params.set('class', selectedClass);
      params.set('chapter', selectedChapter);
    }

    const newSearch = params.toString();
    const newPath = newSearch ? `/quiz?${newSearch}` : '/quiz';

    if (location.pathname + location.search !== newPath) {
      navigate(newPath, { replace: false });
    }
  }, [view, selectedClass, selectedChapter]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const classParam = params.get('class');
      const chapterParam = params.get('chapter');

      if (!classParam && !chapterParam) {
        setView('class-select');
      } else if (classParam && !chapterParam) {
        setView('chapter-select');
        setSelectedClass(classParam);
      } else if (classParam && chapterParam) {
        setView('quiz');
        setSelectedClass(classParam);
        setSelectedChapter(chapterParam);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleClassSelect = async (cls) => {
    setSelectedClass(cls);
    setLoading(true);
    try {
      const res = await questionsAPI.getAll({ class: cls });
      const chapterCounts = res.questions.reduce((acc, q) => {
        const name = q.chapter.trim();
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      const chaptersWithCounts = Object.entries(chapterCounts).map(
        ([name, count]) => ({
          name,
          count,
        })
      );

      setChapters(chaptersWithCounts);
      setView('chapter-select');
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleChapterSelect = async (chapter, classLevel = selectedClass) => {
    setSelectedChapter(chapter);
    setLoading(true);
    try {
      const res = await questionsAPI.getAll({ class: classLevel, chapter });
      setQuestions(res.questions);
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      setShowWarning(false);
      setView('quiz');
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, option) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
    if (showWarning) setShowWarning(false);
  };

  const handleNextQuestion = () => {
    if (!userAnswers[questions[currentQuestionIndex]._id]) {
      setShowWarning(true);
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowWarning(false);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowWarning(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(userAnswers).length < questions.length) {
      setShowWarning(true);
      return;
    }

    const { correct, total, percentage } = calculateScore();
    try {
      const res = await quizAPI.submit({
        className: selectedClass,
        chapter: selectedChapter,
        score: correct,
        totalQuestions: total,
        percentage,
      });

      setToast({
        message: `Quiz submitted! You scored ${correct}/${total} (${percentage}%)`,
        type: 'success',
      });
      window.dispatchEvent(new Event('quizCompleted'));
    } catch (error) {
      setToast({
        message: 'Failed to submit quiz. Please try again.',
        type: 'error',
      });
    }
    setView('result');
    window.scrollTo(0, 0);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (userAnswers[q._id] === q.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  };

  const handleRestart = () => {
    setUserAnswers({});
    setShowWarning(false);
    setCurrentQuestionIndex(0);
    setView('chapter-select');
    setQuestions([]);
  };

  const renderClassSelection = () => {
    return (
      <div className="class-select-container">
        {['10', '12'].map((cls) => (
          <div
            key={cls}
            onClick={() => handleClassSelect(cls)}
            className="class-card"
          >
            <h3 className="class-title">Class {cls}</h3>
            <p className="class-subtitle">Mathematics</p>
            <div className="start-practice-btn">Start Practice →</div>
          </div>
        ))}
      </div>
    );
  };

  const renderChapterSelection = () => {
    if (loading)
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Loading chapters...
        </div>
      );

    return (
      <div className="chapter-select-container">
        <button onClick={() => setView('class-select')} className="back-btn">
          ← Back to Class Selection
        </button>
        <h3 style={{ marginBottom: '30px', color: '#333' }}>
          Select a Chapter
        </h3>
        <div className="chapter-grid">
          {chapters.map((chapter) => (
            <div
              key={chapter.name}
              onClick={() => handleChapterSelect(chapter.name)}
              className="chapter-card"
            >
              <h5 className="chapter-name">{chapter.name}</h5>
              <span className="chapter-count">{chapter.count} Qs</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (!questions || questions.length === 0) {
      return (
        <div className="empty-state">
          <h3>Questions coming soon!</h3>
          <p>We are currently updating this chapter.</p>
          <button
            onClick={() => setView('chapter-select')}
            className="btn-primary"
            style={{ marginTop: '20px' }}
          >
            Back to Chapters
          </button>
        </div>
      );
    }
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <div>
            <h4 style={{ margin: 0, color: '#1a237e' }}>{selectedChapter}</h4>
            <small style={{ color: '#64748b' }}>Class {selectedClass}th</small>
          </div>
          <div
            className="badge"
            style={{ background: '#e3f2fd', color: '#1565c0' }}
          >
            Question {currentQuestionIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="quiz-progress-track">
          <div
            className="quiz-progress-bar"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          ></div>
        </div>

        <div className="question-card">
          <h4 className="question-text">{currentQuestion.question}</h4>
          {currentQuestion.questionHindi && (
            <p className="question-text-hindi">{currentQuestion.questionHindi}</p>
          )}
          <div className="options-grid">
            {currentQuestion.options.map((option) => (
              <div
                key={option}
                onClick={() => handleAnswerSelect(currentQuestion._id, option)}
                className={`option-item ${userAnswers[currentQuestion._id] === option ? 'selected' : ''}`}
              >
                <div className="option-circle">
                  {userAnswers[currentQuestion._id] === option && (
                    <div className="option-dot"></div>
                  )}
                </div>
                <span className="option-text">{option}</span>
              </div>
            ))}
          </div>
        </div>

        {showWarning && (
          <div className="quiz-warning">
            Please answer the question before proceeding.
          </div>
        )}

        <div className="quiz-footer">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="btn-prev"
          >
            Previous
          </button>
          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              className="btn-primary"
              style={{ padding: '15px 50px', fontSize: '1.1rem' }}
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="btn-primary"
              style={{ padding: '15px 30px', fontSize: '1rem' }}
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const { correct, total, percentage } = calculateScore();
    return (
      <div className="review-section">
        <div className="result-card">
          <h3
            style={{ fontSize: '2rem', color: '#1a237e', marginBottom: '10px' }}
          >
            Quiz Results
          </h3>
          <div
            className={`score-text ${percentage >= 70 ? 'score-high' : 'score-low'}`}
          >
            {percentage}%
          </div>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>
            You scored <strong>{correct}</strong> out of{' '}
            <strong>{total}</strong>
          </p>
          <button
            onClick={handleRestart}
            className="btn-primary"
            style={{ marginTop: '20px' }}
          >
            Take Another Quiz
          </button>
        </div>

        <h3 style={{ marginBottom: '20px', color: '#1a237e' }}>
          Review Answers
        </h3>

        {questions.map((q, index) => {
          const userAnswer = userAnswers[q._id];
          const isCorrect = userAnswer === q.correctAnswer;

          return (
            <div
              key={q._id}
              className={`review-card ${isCorrect ? 'correct' : 'incorrect'}`}
            >
              <h4 style={{ marginBottom: '15px', color: '#333' }}>
                <span style={{ color: '#1a237e', marginRight: '10px' }}>
                  Q{index + 1}.
                </span>
                {q.question}
                {q.questionHindi && (
                  <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '6px', fontWeight: 'normal' }}>
                    {q.questionHindi}
                  </div>
                )}
              </h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                {q.options.map((option) => {
                  let optionClass = 'option-review';

                  if (option === q.correctAnswer) {
                    optionClass += ' correct-answer';
                  } else if (option === userAnswer && !isCorrect) {
                    optionClass += ' wrong-answer';
                  }

                  return (
                    <div key={option} className={optionClass}>
                      {option}
                      {option === q.correctAnswer && (
                        <span style={{ float: 'right' }}>✅</span>
                      )}
                      {option === userAnswer && !isCorrect && (
                        <span style={{ float: 'right' }}>❌</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="quiz-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container">
        <div
          className="section-header text-center"
          style={{ marginBottom: '40px' }}
        >
          <div className="quiz-badge">Board-Focused • NCERT-Aligned</div>
          <h2 className="section-title">
            Practice <span className="highlight">Board-Level</span> Maths
            Questions
          </h2>
          <p className="section-subtitle">
            Chapter-wise quizzes for Class 10th and 12th to boost your board
            exam preparation.
          </p>
        </div>
        {view === 'class-select' && renderClassSelection()}
        {view === 'chapter-select' && renderChapterSelection()}
        {view === 'quiz' && renderQuiz()}
        {view === 'result' && renderResults()}
      </div>
    </section>
  );
};

export default Quiz;
