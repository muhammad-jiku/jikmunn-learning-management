'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useGetChapterQuizQuery,
  useSubmitQuizAnswersMutation,
} from '@/state/api';
import {
  CheckCircle,
  Clock,
  Loader2,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface QuizPlayerProps {
  courseId: string;
  sectionId: string;
  chapterId: string;
}

interface QuizResult {
  quizId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  questionResults: {
    questionId: string;
    userAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    earnedPoints: number;
  }[];
  submittedAt: string;
}

const QuizPlayer = ({ courseId, sectionId, chapterId }: QuizPlayerProps) => {
  const {
    data: quiz,
    isLoading,
    error,
  } = useGetChapterQuizQuery(
    { courseId, sectionId, chapterId },
    { skip: !courseId || !sectionId || !chapterId }
  );

  const [submitQuiz, { isLoading: isSubmitting }] =
    useSubmitQuizAnswersMutation();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleSubmit = useCallback(async () => {
    if (!quiz) return;

    try {
      const response = await submitQuiz({
        courseId,
        sectionId,
        chapterId,
        answers,
      }).unwrap();
      setResult(response as unknown as QuizResult);
      setQuizStarted(false);
    } catch {
      // Error handled by RTK Query
    }
  }, [quiz, submitQuiz, courseId, sectionId, chapterId, answers]);

  // Timer
  useEffect(() => {
    if (!quizStarted || !timeRemaining || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeRemaining, handleSubmit]);

  const startQuiz = () => {
    setQuizStarted(true);
    setResult(null);
    setAnswers({});
    setCurrentQuestion(0);
    if (quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit * 60);
    }
  };

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-6 w-6 animate-spin text-primary-700' />
        <span className='ml-2 text-sm text-customgreys-dirty-grey'>
          Loading quiz...
        </span>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className='py-8 text-center text-customgreys-dirty-grey'>
        <p>No quiz available for this chapter.</p>
      </div>
    );
  }

  // Show results
  if (result) {
    return (
      <div className='space-y-6'>
        {/* Score Summary */}
        <Card
          className={`border-2 ${result.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}
        >
          <CardContent className='flex flex-col items-center py-8'>
            {result.passed ? (
              <Trophy className='mb-3 h-12 w-12 text-green-500' />
            ) : (
              <XCircle className='mb-3 h-12 w-12 text-red-500' />
            )}

            <h3 className='mb-1 text-2xl font-bold text-white-100'>
              {result.percentage}%
            </h3>
            <p
              className={`mb-2 text-lg font-medium ${result.passed ? 'text-green-500' : 'text-red-500'}`}
            >
              {result.passed ? 'Passed!' : 'Not Passed'}
            </p>
            <p className='text-sm text-customgreys-dirty-grey'>
              {result.score} / {result.totalPoints} points (need{' '}
              {result.passingScore}% to pass)
            </p>
          </CardContent>
        </Card>

        {/* Question Results */}
        <div className='space-y-3'>
          {result.questionResults.map((qr, idx) => {
            const question = quiz.questions.find(
              (q) => q.questionId === qr.questionId
            );
            return (
              <Card
                key={qr.questionId}
                className={`border ${qr.isCorrect ? 'border-green-500/20' : 'border-red-500/20'}`}
              >
                <CardContent className='py-4'>
                  <div className='flex items-start gap-3'>
                    {qr.isCorrect ? (
                      <CheckCircle className='mt-0.5 h-5 w-5 shrink-0 text-green-500' />
                    ) : (
                      <XCircle className='mt-0.5 h-5 w-5 shrink-0 text-red-500' />
                    )}
                    <div className='flex-1'>
                      <p className='mb-2 text-sm font-medium text-white-100'>
                        {idx + 1}. {question?.text}
                      </p>
                      {!qr.isCorrect && (
                        <div className='space-y-1 text-xs'>
                          <p className='text-red-400'>
                            Your answer: {qr.userAnswer || 'Not answered'}
                          </p>
                          <p className='text-green-400'>
                            Correct answer: {qr.correctAnswer}
                          </p>
                        </div>
                      )}
                      <p className='mt-1 text-xs text-customgreys-dirty-grey'>
                        {qr.earnedPoints} / {qr.points} points
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Retry */}
        <div className='flex justify-center'>
          <Button
            onClick={startQuiz}
            className='bg-primary-700 hover:bg-primary-600'
          >
            <RotateCcw className='mr-2 h-4 w-4' />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Quiz start screen
  if (!quizStarted) {
    return (
      <Card className='border-customgreys-dark-grey'>
        <CardContent className='flex flex-col items-center py-8'>
          <h3 className='mb-2 text-xl font-semibold text-white-100'>
            {quiz.title}
          </h3>
          <div className='mb-6 space-y-1 text-center text-sm text-customgreys-dirty-grey'>
            <p>{quiz.questions.length} questions</p>
            <p>Passing score: {quiz.passingScore}%</p>
            {quiz.timeLimit && <p>Time limit: {quiz.timeLimit} minutes</p>}
          </div>
          <Button
            onClick={startQuiz}
            className='bg-primary-700 hover:bg-primary-600'
          >
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active quiz
  const question = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className='space-y-4'>
      {/* Progress & Timer */}
      <div className='flex items-center justify-between'>
        <span className='text-sm text-customgreys-dirty-grey'>
          Question {currentQuestion + 1} of {totalQuestions}
        </span>
        <div className='flex items-center gap-4'>
          <span className='text-xs text-customgreys-dirty-grey'>
            {answeredCount}/{totalQuestions} answered
          </span>
          {timeRemaining !== null && (
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                timeRemaining < 60 ? 'text-red-500' : 'text-white-100'
              }`}
            >
              <Clock className='h-4 w-4' />
              {formatTime(timeRemaining)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className='h-1.5 w-full rounded-full bg-customgreys-dark-grey'>
        <div
          className='h-1.5 rounded-full bg-primary-700 transition-all'
          style={{
            width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <Card className='border-customgreys-dark-grey'>
        <CardHeader>
          <CardTitle className='text-base text-white-100'>
            {question.text}
          </CardTitle>
          <p className='text-xs text-customgreys-dirty-grey'>
            {question.points} point{question.points !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent className='space-y-2'>
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => selectAnswer(question.questionId, option)}
              className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                answers[question.questionId] === option
                  ? 'border-primary-700 bg-primary-700/10 text-white-100'
                  : 'border-customgreys-dark-grey bg-customgreys-secondarybg text-customgreys-dirty-grey hover:border-customgreys-dirty-grey hover:text-white-100'
              }`}
            >
              <span className='mr-2 font-medium'>
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className='flex items-center justify-between'>
        <Button
          type='button'
          variant='outline'
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        <div className='flex gap-1'>
          {quiz.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestion(idx)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                idx === currentQuestion
                  ? 'bg-primary-700'
                  : answers[quiz.questions[idx].questionId]
                    ? 'bg-green-500'
                    : 'bg-customgreys-dark-grey'
              }`}
            />
          ))}
        </div>

        {currentQuestion < totalQuestions - 1 ? (
          <Button
            type='button'
            onClick={() =>
              setCurrentQuestion(
                Math.min(totalQuestions - 1, currentQuestion + 1)
              )
            }
            className='bg-primary-700 hover:bg-primary-600'
          >
            Next
          </Button>
        ) : (
          <Button
            type='button'
            onClick={handleSubmit}
            disabled={isSubmitting || answeredCount === 0}
            className='bg-green-600 hover:bg-green-500'
          >
            {isSubmitting ? (
              <Loader2 className='mr-1 h-4 w-4 animate-spin' />
            ) : null}
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;
