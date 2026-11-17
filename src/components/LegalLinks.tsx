import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useClubSlug } from '../hooks/useClub'

export function LegalLinks({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const slug = useClubSlug()
  const base = slug ? `/${slug}` : ''
  return (
    <div className={`flex justify-center gap-4 text-xs text-muted-2 ${className}`}>
      <Link to={`${base}/privacy`} className="hover:text-aka-text">
        {t('footer.privacy')}
      </Link>
      <Link to={`${base}/terms`} className="hover:text-aka-text">
        {t('footer.terms')}
      </Link>
    </div>
  )
}
