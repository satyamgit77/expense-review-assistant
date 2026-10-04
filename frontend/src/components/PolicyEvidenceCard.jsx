import { BookOpen } from 'lucide-react';

export default function PolicyEvidenceCard({ evidence }) {
  if (!evidence) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <BookOpen size={16} className="text-indigo-600" /> Policy evidence
      </h3>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        {evidence.split('\n').map((line) => (
          <p key={line} className="border-l-2 border-indigo-200 pl-3">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}