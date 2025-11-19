import type { Opportunity } from '../types/opportunity';

type OpportunityCardProps = {
  opportunity: Opportunity;
};

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { name, institution, location, type, modality, description, highlight } = opportunity;

  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-900/30 transition hover:border-white/30 hover:shadow-indigo-500/40">
      <div className="space-y-4">
        {highlight && (
          <span className="inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
            {highlight}
          </span>
        )}
        <div>
          <h3 className="text-xl font-semibold text-white">{name}</h3>
          <p className="flex items-center gap-2 text-sm text-white/70">
            <span>{institution}</span>
            <span aria-hidden="true" className="text-white/30">
              &middot;
            </span>
            <span>{location}</span>
          </p>
        </div>
        <p className="text-sm text-white/60">{description}</p>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full border border-white/20 px-3 py-1 text-white/80">{type}</span>
          <span className="rounded-full border border-white/20 px-3 py-1 text-white/80">{modality}</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
        <span className="text-white/60">Ver detalhes</span>
        <span aria-hidden className="text-white">&rarr;</span>
      </div>
    </article>
  );
}
