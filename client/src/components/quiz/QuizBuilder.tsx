/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  useDeleteChapterQuizMutation,
  useGetChapterQuizTeacherQuery,
  useUpsertChapterQuizMutation,
} from '@/state/api';
import {
  CheckCircle,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface QuizBuilderProps {
  courseId: string;
  sectionId: string;
  chapterId: string;
  onClose: () => void;
}

interface QuestionDraft {
  questionId: string;
  text: string;
  type: 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: string;
  points: number;
}

const QuizBuilder = ({
  courseId,
  sectionId,
  chapterId,
  onClose,
}: QuizBuilderProps) => {
  const { data: existingQuiz, isLoading } = useGetChapterQuizTeacherQuery(
    { courseId, sectionId, chapterId },
    { skip: !courseId || !sectionId || !chapterId }
  );

  const [upsertQuiz, { isLoading: isSaving }] = useUpsertChapterQuizMutation();
  const [deleteQuiz, { isLoading: isDeleting }] =
    useDeleteChapterQuizMutation();

  const [formInitialized, setFormInitialized] = useState(false);
  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  // Initialize form state from existing quiz data (runs once when data becomes available)
  if (existingQuiz && !formInitialized) {
    setFormInitialized(true);
    setTitle(existingQuiz.title);
    setPassingScore(existingQuiz.passingScore);
    setTimeLimit(existingQuiz.timeLimit);
    setQuestions(
      existingQuiz.questions.map((q) => ({
        questionId: q.questionId,
        text: q.text,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
      }))
    );
  }

  const addQuestion = (type: 'multiple-choice' | 'true-false') => {
    const newQuestion: QuestionDraft = {
      questionId: uuidv4(),
      text: '',
      type,
      options: type === 'true-false' ? ['True', 'False'] : ['', '', '', ''],
      correctAnswer: type === 'true-false' ? 'True' : '',
      points: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionDraft,
    value: any
  ) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push('');
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length <= 2) {
      toast.error('Must have at least 2 options');
      return;
    }
    const removedOption = updated[questionIndex].options[optionIndex];
    updated[questionIndex].options.splice(optionIndex, 1);
    // Clear correct answer if it was the removed option
    if (updated[questionIndex].correctAnswer === removedOption) {
      updated[questionIndex].correctAnswer = '';
    }
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Quiz title is required');
      return;
    }
    if (questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Question ${i + 1} needs text`);
        return;
      }
      if (!q.correctAnswer) {
        toast.error(`Question ${i + 1} needs a correct answer`);
        return;
      }
      if (q.type === 'multiple-choice' && q.options.some((o) => !o.trim())) {
        toast.error(`Question ${i + 1} has empty options`);
        return;
      }
    }

    try {
      await upsertQuiz({
        courseId,
        sectionId,
        chapterId,
        quiz: {
          title,
          questions,
          passingScore,
          timeLimit,
        },
      }).unwrap();
      toast.success('Quiz saved successfully');
    } catch {
      toast.error('Failed to save quiz');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await deleteQuiz({ courseId, sectionId, chapterId }).unwrap();
      setTitle('');
      setQuestions([]);
      setPassingScore(70);
      setTimeLimit(undefined);
      toast.success('Quiz deleted');
    } catch {
      toast.error('Failed to delete quiz');
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin text-primary-700' />
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-customgreys-secondarybg p-6'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-semibold text-white-100'>Quiz Builder</h2>
          <button
            onClick={onClose}
            className='text-customgreys-dirty-grey hover:text-white-100'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        {/* Quiz Settings */}
        <div className='mb-6 space-y-4'>
          <div>
            <label className='mb-1 block text-sm text-customgreys-dirty-grey'>
              Quiz Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Enter quiz title'
              className='border-none bg-customgreys-dark-grey'
            />
          </div>
          <div className='flex gap-4'>
            <div className='flex-1'>
              <label className='mb-1 block text-sm text-customgreys-dirty-grey'>
                Passing Score (%)
              </label>
              <Input
                type='number'
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className='border-none bg-customgreys-dark-grey'
              />
            </div>
            <div className='flex-1'>
              <label className='mb-1 block text-sm text-customgreys-dirty-grey'>
                Time Limit (minutes, optional)
              </label>
              <Input
                type='number'
                min={1}
                value={timeLimit ?? ''}
                onChange={(e) =>
                  setTimeLimit(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder='No limit'
                className='border-none bg-customgreys-dark-grey'
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className='mb-6 space-y-4'>
          <h3 className='text-lg font-medium text-white-100'>
            Questions ({questions.length})
          </h3>

          {questions.map((question, qIndex) => (
            <Card
              key={question.questionId}
              className='border-customgreys-dark-grey bg-customgreys-dark-grey'
            >
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2 text-sm text-white-100'>
                    <GripVertical className='h-4 w-4 text-customgreys-dirty-grey' />
                    Question {qIndex + 1}
                    <span className='rounded bg-primary-700/20 px-2 py-0.5 text-xs text-primary-700'>
                      {question.type === 'true-false'
                        ? 'True/False'
                        : 'Multiple Choice'}
                    </span>
                  </CardTitle>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='number'
                      min={1}
                      value={question.points}
                      onChange={(e) =>
                        updateQuestion(qIndex, 'points', Number(e.target.value))
                      }
                      className='w-16 border-none bg-customgreys-secondarybg text-center text-xs'
                      title='Points'
                    />
                    <span className='text-xs text-customgreys-dirty-grey'>
                      pts
                    </span>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className='text-customgreys-dirty-grey hover:text-red-500'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Input
                  value={question.text}
                  onChange={(e) =>
                    updateQuestion(qIndex, 'text', e.target.value)
                  }
                  placeholder='Enter question text'
                  className='border-none bg-customgreys-secondarybg'
                />

                {/* Options */}
                <div className='space-y-2'>
                  <label className='text-xs text-customgreys-dirty-grey'>
                    Options (click to mark correct answer)
                  </label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className='flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={() =>
                          updateQuestion(
                            qIndex,
                            'correctAnswer',
                            question.type === 'true-false' ? option : option
                          )
                        }
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          question.correctAnswer === option
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-customgreys-dirty-grey'
                        }`}
                        title='Mark as correct answer'
                      >
                        {question.correctAnswer === option && (
                          <CheckCircle className='h-4 w-4 text-green-500' />
                        )}
                      </button>
                      {question.type === 'true-false' ? (
                        <span className='text-sm text-white-100'>{option}</span>
                      ) : (
                        <Input
                          value={option}
                          onChange={(e) =>
                            updateOption(qIndex, oIndex, e.target.value)
                          }
                          placeholder={`Option ${oIndex + 1}`}
                          className='border-none bg-customgreys-secondarybg text-sm'
                        />
                      )}
                      {question.type !== 'true-false' &&
                        question.options.length > 2 && (
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className='text-customgreys-dirty-grey hover:text-red-500'
                          >
                            <X className='h-4 w-4' />
                          </button>
                        )}
                    </div>
                  ))}
                  {question.type === 'multiple-choice' &&
                    question.options.length < 6 && (
                      <button
                        onClick={() => addOption(qIndex)}
                        className='flex items-center gap-1 text-xs text-primary-700 hover:text-primary-600'
                      >
                        <Plus className='h-3 w-3' /> Add Option
                      </button>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Question Buttons */}
        <div className='mb-6 flex gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={() => addQuestion('multiple-choice')}
            className='border-customgreys-dirty-grey text-customgreys-dirty-grey hover:bg-customgreys-dark-grey hover:text-white-100'
          >
            <Plus className='mr-1 h-4 w-4' /> Multiple Choice
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => addQuestion('true-false')}
            className='border-customgreys-dirty-grey text-customgreys-dirty-grey hover:bg-customgreys-dark-grey hover:text-white-100'
          >
            <Plus className='mr-1 h-4 w-4' /> True/False
          </Button>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center justify-between border-t border-customgreys-dark-grey pt-4'>
          <div>
            {existingQuiz && (
              <Button
                type='button'
                variant='destructive'
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                ) : (
                  <Trash2 className='mr-1 h-4 w-4' />
                )}
                Delete Quiz
              </Button>
            )}
          </div>
          <div className='flex gap-3'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleSave}
              disabled={isSaving}
              className='bg-primary-700 hover:bg-primary-600'
            >
              {isSaving ? (
                <Loader2 className='mr-1 h-4 w-4 animate-spin' />
              ) : (
                <Save className='mr-1 h-4 w-4' />
              )}
              Save Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizBuilder;
