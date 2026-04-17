import express from 'express';
import Question from '../models/Question.js';
import { protect, authorize } from '../middleware/auth.js';
import xlsx from 'xlsx';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { class: classLevel, chapter } = req.query;
    let searchQuery = { isActive: true };

    if (classLevel) {
      searchQuery.class = classLevel;
    }
    if (chapter) {
      const chapterTrimmed = chapter.trim();
      const chapterLower = chapterTrimmed.toLowerCase();
      const chapterUpper = chapterTrimmed.toUpperCase();
      const chapterCapitalized = chapterTrimmed.charAt(0).toUpperCase() + chapterTrimmed.slice(1).toLowerCase();
      searchQuery.$or = [
        { chapter: chapterTrimmed },
        { chapter: chapterLower },
        { chapter: chapterUpper },
        { chapter: chapterCapitalized },
      ];
    }

    const foundQuestions = await Question.find(searchQuery);

    const shuffledQuestions = foundQuestions.map((question) => {
      const questionObject = question.toObject();
      if (questionObject.options && Array.isArray(questionObject.options)) {
        for (let i = questionObject.options.length - 1; i > 0; i--) {
          const randomIndex = Math.floor(Math.random() * (i + 1));
          [questionObject.options[i], questionObject.options[randomIndex]] = [
            questionObject.options[randomIndex],
            questionObject.options[i],
          ];
        }
      }
      return questionObject;
    });

    res.status(200).json({
      success: true,
      count: shuffledQuestions.length,
      questions: shuffledQuestions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const count = await Question.countDocuments({ isActive: true });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.post('/bulk-upload', protect, authorize('admin'), async (req, res) => {
  try {
    const { fileData, questions: reqQuestions } = req.body;

    if (!fileData && (!reqQuestions || !Array.isArray(reqQuestions))) {
      return res.status(400).json({ success: false, message: 'No file data or questions provided' });
    }

    let questions = [];
    const errors = [];
    let jsonData = [];

    if (reqQuestions && Array.isArray(reqQuestions)) {
      jsonData = reqQuestions;
    } else {
      const buffer = Buffer.from(fileData.split(',')[1], 'base64');
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      jsonData = xlsx.utils.sheet_to_json(worksheet, {
        defval: '',
        blankrows: false,
        raw: false,
      });
    }

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      try {
        const allKeys = Object.keys(row);

        const getField = (fieldNames) => {
          for (let name of fieldNames) {
            const value = row[name];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              return String(value).trim();
            }
          }
          return '';
        };

        const getFieldByIndex = (index) => {
          const key = allKeys[index];
          if (key && row[key]) return String(row[key]).trim();
          return '';
        };

        let questionText = getField([
          'Question Text', 'QuestionText', 'Question', 'question',
          'QUESTION', 'question text', 'question_text', 'प्रश्न',
          'Question Text\n(English + Hindi)', 'Question Text (English + Hindi)',
        ]);
        if (!questionText) questionText = getFieldByIndex(0);
        if (!questionText || questionText.length < 3) continue;

        let questionEnglish = questionText;
        let questionHindi = '';
        if (questionText.includes('\n')) {
          const parts = questionText.split('\n');
          questionEnglish = parts[0].trim();
          questionHindi = parts.slice(1).join('\n').trim();
        }

        let opt1 = getField(['Option 1', 'Option1', 'option1', 'option 1', 'OPTION1', 'option_1', 'Option B', 'OptionB', 'option b', 'B']);
        let opt2 = getField(['Option 2', 'Option2', 'option2', 'option 2', 'OPTION2', 'option_2', 'Option C', 'OptionC', 'option c', 'C']);
        let opt3 = getField(['Option 3', 'Option3', 'option3', 'option 3', 'OPTION3', 'option_3', 'Option D', 'OptionD', 'option d', 'D']);
        let opt4 = getField(['Option 4', 'Option4', 'option4', 'option 4', 'OPTION4', 'option_4', 'Option E', 'OptionE', 'option e', 'E']);

        if (!opt1) opt1 = getFieldByIndex(1);
        if (!opt2) opt2 = getFieldByIndex(2);
        if (!opt3) opt3 = getFieldByIndex(3);
        if (!opt4) opt4 = getFieldByIndex(4);

        let correctAns = getField([
          'Correct Answer', 'CorrectAnswer', 'correctAnswer',
          'correct_answer', 'correct answer', 'CORRECTANSWER', 'Answer', 'answer',
        ]);
        if (!correctAns) correctAns = getFieldByIndex(5);

        let classLevel = getField(['Class', 'class', 'CLASS', 'Grade', 'grade']);
        if (!classLevel) classLevel = getFieldByIndex(6);

        let chapterName = getField([
          'Chapter Name', 'ChapterName', 'Chapter', 'chapter',
          'CHAPTER', 'chapter name', 'chapter_name', 'अध्याय',
        ]);
        if (!chapterName) chapterName = getFieldByIndex(7);

        if (classLevel) {
          classLevel = classLevel.toLowerCase().trim();
          if (classLevel.startsWith('class')) {
            classLevel = classLevel.slice(5).trim();
          } else if (classLevel.startsWith('grade')) {
            classLevel = classLevel.slice(5).trim();
          }
        }

        const options = [opt1, opt2, opt3, opt4].filter((opt) => opt && opt.length > 0);

        let finalCorrectAnswer = correctAns;
        if (correctAns) {
          const lowerCorrectAns = correctAns.toLowerCase();
          if (lowerCorrectAns.includes('option')) {
            for (let j = 1; j <= 4; j++) {
              if (lowerCorrectAns.includes(j.toString())) {
                if (options[j - 1]) finalCorrectAnswer = options[j - 1];
                break;
              }
            }
          }
        }

        const missingFields = [];
        if (!questionEnglish || questionEnglish.length < 3) missingFields.push('Question');
        if (options.length < 2) missingFields.push(`Options (found ${options.length})`);
        if (!correctAns) missingFields.push('CorrectAnswer');
        if (!classLevel) missingFields.push('Class');
        if (!chapterName) missingFields.push('Chapter');

        if (missingFields.length > 0) {
          errors.push({
            row: i + 2,
            message: `Missing: ${missingFields.join(', ')}`,
            data: { question: questionEnglish.substring(0, 50), class: classLevel || 'N/A', chapter: chapterName || 'N/A', options: options.length, keys: allKeys.join(', ') },
          });
          continue;
        }

        if (!['10', '12'].includes(classLevel)) {
          errors.push({ row: i + 2, message: `Invalid class "${classLevel}". Must be 10 or 12`, data: { question: questionEnglish.substring(0, 30) + '...' } });
          continue;
        }

        if (!options.includes(finalCorrectAnswer)) {
          let closestOption = null;
          const answerLower = finalCorrectAnswer.toLowerCase().trim();
          for (let j = 0; j < options.length; j++) {
            const optLower = options[j].toLowerCase().trim();
            if (optLower === answerLower || optLower.includes(answerLower) || answerLower.includes(optLower)) {
              closestOption = options[j];
              break;
            }
          }
          if (closestOption) {
            finalCorrectAnswer = closestOption;
          } else {
            errors.push({
              row: i + 2,
              message: `Correct answer "${correctAns}" doesn't match any option`,
              data: { question: questionText.substring(0, 30) + '...', correctAnswer: correctAns, options: options.join(' | ') },
            });
            continue;
          }
        }

        questions.push({
          question: questionEnglish,
          questionHindi,
          options,
          correctAnswer: finalCorrectAnswer,
          class: classLevel,
          chapter: chapterName,
          subject: getField(['Subject', 'subject', 'SUBJECT', 'विषय']) || 'Mathematics',
          isActive: true,
        });
      } catch (err) {
        errors.push({ row: i + 2, message: `Error: ${err.message}`, data: { error: 'Processing failed' } });
      }
    }

    let insertedCount = 0;
    if (questions.length > 0) {
      try {
        const result = await Question.insertMany(questions, { ordered: false });
        insertedCount = result.length;
      } catch (insertError) {
        if (insertError.writeErrors) {
          insertedCount = questions.length - insertError.writeErrors.length;
          insertError.writeErrors.forEach((err) => {
            errors.push({ row: 'DB Error', message: err.errmsg || 'Database insertion failed', data: {} });
          });
        } else {
          throw insertError;
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${insertedCount} questions`,
      uploaded: insertedCount,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message,
      uploaded: 0,
      errors: 1,
      errorDetails: [{ row: 'System', message: error.message, data: {} }],
    });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, message: 'Question created', question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.status(200).json({ success: true, message: 'Question updated', question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.status(200).json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
