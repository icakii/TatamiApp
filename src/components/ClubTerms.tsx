import { termsBlocks } from '../lib/memberTerms'

// A club's rules text, rendered from plain text (numbered lines are headings).
export function ClubTermsText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {termsBlocks(text).map((b, i) =>
        b.heading ? (
          <p key={i} className="pt-2 font-display text-xs uppercase tracking-wide text-ink first:pt-0">
            {b.text}
          </p>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </div>
  )
}
