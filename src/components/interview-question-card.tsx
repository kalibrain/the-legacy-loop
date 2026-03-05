type InterviewQuestionCardProps = {
  question: { id: string; text: string };
  answer: string;
  loading: boolean;
  error?: string;
  followUpNotice?: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
};

export function InterviewQuestionCard({
  question,
  answer,
  loading,
  error,
  followUpNotice,
  onAnswerChange,
  onSubmit,
  onSkip,
}: InterviewQuestionCardProps) {
  return (
    <section className="card-surface rounded-xl p-6">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
        Current Question
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{question.text}</h2>

      {followUpNotice ? (
        <div className="mt-4 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {followUpNotice}
        </div>
      ) : null}

      <label
        htmlFor="interview-answer"
        className="mt-5 block text-sm font-medium text-slate-700"
      >
        Your response
      </label>
      <textarea
        id="interview-answer"
        value={answer}
        onChange={(event) => onAnswerChange(event.target.value)}
        placeholder="Share details, context, and examples..."
        className="mt-2 min-h-[170px] w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />

      {error ? (
        <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          aria-label="Submit interview answer"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={loading}
          aria-label="Skip this interview question"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Skip
        </button>
      </div>
    </section>
  );
}
