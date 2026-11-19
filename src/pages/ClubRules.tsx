import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ClubTermsText } from '../components/ClubTerms'
import { useClub } from '../hooks/useClub'
import { memberTermsFor } from '../lib/memberTerms'

// /<club>/rules: the club's rules and consent text, readable any time.
export function ClubRules() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { data: club } = useClub()
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl uppercase tracking-wide">{t('clubRules.title')}</h1>
      <p className="mt-1 text-sm text-muted">{club?.name}</p>
      {club?.member_terms_updated_at && (
        <p className="mt-2 text-xs uppercase tracking-wide text-muted-2">
          {t('clubRules.updated', { date: new Date(club.member_terms_updated_at).toLocaleDateString(i18n.resolvedLanguage) })}
        </p>
      )}
      <ClubTermsText text={memberTermsFor(club)} className="mt-8 text-sm leading-relaxed text-muted" />
      <button type="button" onClick={() => navigate(-1)} className="mt-10 inline-block text-sm text-aka-text hover:underline">
        ← {t('privacy.back')}
      </button>
    </div>
  )
}
