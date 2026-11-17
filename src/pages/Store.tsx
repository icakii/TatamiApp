import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MyReservationsCard } from '../components/app/MyReservationsCard'
import { PageHeader } from '../components/app/ui'
import { clubAsset, useClub } from '../hooks/useClub'
import { useMember, type Member } from '../hooks/useMember'
import { useReserve } from '../hooks/useReservations'
import { Reveal } from '../components/Section'
import { useReducedMotion } from '../hooks/useReducedMotion'

// Example catalogue: drawn product art instead of photos, prices in EUR.
// The drawings wear the club's own logo, name and colour.
// With the club's store option on, a logged-in student reserves an item
// with the child's measurements and the coach sees it in the admin panel;
// payment happens at the hall. Without it the page is just a catalogue.

interface Brand {
  logo: string | null
  name: string
}

// The print on the merch: the club logo in a white disc, or its initials.
function Badge({ brand, cx, cy, r, id }: { brand: Brand; cx: number; cy: number; r: number; id: string }) {
  const initials = brand.name.split(/\s+/).map((w) => w[0]).filter((c) => /\p{L}/u.test(c ?? '')).slice(0, 2).join('')
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#fbf6ea" />
      {brand.logo ? (
        <>
          <clipPath id={id}>
            <circle cx={cx} cy={cy} r={r - 2} />
          </clipPath>
          <image href={brand.logo} x={cx - r + 2} y={cy - r + 2} width={(r - 2) * 2} height={(r - 2) * 2} clipPath={`url(#${id})`} preserveAspectRatio="xMidYMid meet" />
        </>
      ) : (
        <text x={cx} y={cy + r * 0.35} textAnchor="middle" fontSize={r} fill="#1f1b16" fontFamily="Oswald, sans-serif">
          {initials}
        </text>
      )}
    </>
  )
}

function useBrand(): Brand {
  const { data: club } = useClub()
  return { logo: club?.logo_path ? clubAsset(club.id, club.logo_path) : null, name: club?.name ?? '' }
}

// "Спартак 14 – Плевен" -> "СПАРТАК"
const shortName = (name: string) => (name.split(/[\s–-]+/)[0] ?? name).toUpperCase().slice(0, 12)

function TeeArt({ brand }: { brand: Brand }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <path
        d="M70 38 L50 46 L22 74 L42 98 L58 86 L58 168 L142 168 L142 86 L158 98 L178 74 L150 46 L130 38 C124 52 112 58 100 58 C88 58 76 52 70 38 Z"
        fill="#1f1b16"
      />
      <path d="M70 38 C76 52 88 58 100 58 C112 58 124 52 130 38" fill="none" stroke="#3a332a" strokeWidth="4" />
      <Badge brand={brand} cx={100} cy={102} r={22} id="tee-logo" />
      <text x="100" y="146" textAnchor="middle" fontSize="11" letterSpacing="4" fill="#fbf6ea" fontFamily="Oswald, sans-serif">
        {shortName(brand.name)}
      </text>
    </svg>
  )
}

function GiArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <path
        d="M66 30 L36 44 L14 92 L36 104 L52 76 L54 170 L146 170 L148 76 L164 104 L186 92 L164 44 L134 30 Z"
        fill="#fbf6ea"
        stroke="#d4c49c"
        strokeWidth="3"
      />
      {/* Crossed lapels. */}
      <path d="M66 30 L100 112 L134 30" fill="none" stroke="#d4c49c" strokeWidth="10" strokeLinejoin="round" />
      <path d="M66 30 L112 120" fill="none" stroke="#e8dcc0" strokeWidth="8" />
      {/* Black belt with knot. */}
      <rect x="52" y="118" width="96" height="14" rx="2" fill="#1f1b16" />
      <rect x="92" y="114" width="18" height="22" rx="3" fill="#1f1b16" />
      <path d="M96 134 L86 162 L96 164 L104 136 Z M106 134 L116 160 L124 156 L112 132 Z" fill="#1f1b16" />
      <rect x="132" y="120" width="10" height="10" fill="#c2361f" />
    </svg>
  )
}

function BagArt({ brand }: { brand: Brand }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      {/* Drawstrings. */}
      <path d="M62 50 C40 90 44 150 56 176" fill="none" stroke="#1f1b16" strokeWidth="4" />
      <path d="M138 50 C160 90 156 150 144 176" fill="none" stroke="#1f1b16" strokeWidth="4" />
      <path d="M56 40 L144 40 L150 176 L50 176 Z" style={{ fill: 'var(--color-aka)' }} />
      <path d="M56 40 L144 40 L145 54 L55 54 Z" fill="#000" opacity="0.18" />
      <path d="M62 47 C90 60 110 60 138 47" fill="none" stroke="#1f1b16" strokeWidth="4" />
      <g transform="rotate(-6 100 118)">
        <Badge brand={brand} cx={100} cy={116} r={30} id="bag-logo" />
      </g>
    </svg>
  )
}

function BeltArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <rect x="18" y="86" width="164" height="22" rx="4" fill="#1f1b16" />
      <rect x="86" y="78" width="28" height="36" rx="5" fill="#2a251f" />
      <path d="M92 112 L76 168 L90 170 L102 116 Z" fill="#1f1b16" />
      <path d="M108 112 L124 166 L138 162 L116 110 Z" fill="#1f1b16" />
      <rect x="150" y="90" width="8" height="14" fill="#c9973f" />
      <rect x="162" y="90" width="8" height="14" fill="#c9973f" />
    </svg>
  )
}

const ITEMS: { key: string; price: number; art: (brand: Brand) => ReactNode; bg: string; sizes?: string[]; badge?: 'new' | 'popular' }[] = [
  { key: 'tee', price: 25, art: (b) => <TeeArt brand={b} />, bg: 'from-kin/25 to-sakura/30', sizes: ['XS', 'S', 'M', 'L', 'XL'], badge: 'new' },
  { key: 'gi', price: 59, art: () => <GiArt />, bg: 'from-ai/25 to-ai-soft/10', sizes: ['130', '140', '150', '160', '170', '180'], badge: 'popular' },
  { key: 'bag', price: 18, art: (b) => <BagArt brand={b} />, bg: 'from-jade/20 to-kin/15' },
  { key: 'belt', price: 12, art: () => <BeltArt />, bg: 'from-aka/15 to-kin/20', sizes: ['220', '240', '260', '280'] },
]

type Item = (typeof ITEMS)[number]

function ProductCard({
  item,
  index,
  reserved,
  onReserve,
  brand,
}: {
  brand: Brand
  item: Item
  index: number
  reserved: boolean
  onReserve: (item: Item, size: string | undefined) => void
}) {
  const { t } = useTranslation()
  const reduced = useReducedMotion()
  const [size, setSize] = useState(item.sizes?.[Math.floor((item.sizes.length - 1) / 2)])

  return (
    <Reveal delay={index * 0.08}>
      <motion.div
        whileHover={reduced ? undefined : { y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/10 bg-shiro/95 shadow-[0_24px_48px_-32px_rgba(31,27,22,0.6)]"
      >
        <div className={`relative aspect-square bg-linear-to-br ${item.bg}`}>
          {item.badge && (
            <span
              className={`absolute left-4 top-4 z-10 rounded-full px-3 py-1 font-display text-[11px] uppercase tracking-wide text-shiro ${
                item.badge === 'new' ? 'bg-aka' : 'bg-ai'
              }`}
            >
              {t(`store.badge.${item.badge}`)}
            </span>
          )}
          <motion.div
            className="absolute inset-8"
            whileHover={reduced ? undefined : { rotate: -4, scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          >
            {item.art(brand)}
          </motion.div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-ink">
              {t(`store.items.${item.key}.name`)}
            </h3>
            <p className="shrink-0 whitespace-nowrap font-display text-xl font-bold text-aka-text">{item.price} €</p>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t(`store.items.${item.key}.desc`)}</p>

          {item.sizes && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`relative min-w-10 rounded-lg px-2 py-1.5 font-display text-xs transition-colors ${
                    size === s ? 'text-shiro' : 'border border-ink/15 text-muted hover:text-ink'
                  }`}
                >
                  {size === s && (
                    <motion.span
                      layoutId={`size-${item.key}`}
                      className="absolute inset-0 rounded-lg bg-ink"
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                    />
                  )}
                  <span className="relative">{s}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-auto pt-5">
            <button
              type="button"
              onClick={() => onReserve(item, size)}
              className={`relative min-h-11 w-full overflow-hidden rounded-xl font-display text-sm uppercase tracking-wide transition-colors ${
                reserved ? 'bg-jade text-shiro' : 'bg-ink text-shiro hover:bg-aka'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={reserved ? 'done' : 'idle'}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  className="block"
                >
                  {reserved ? `✓ ${t('store.reserved')}` : t('store.reserve')}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.div>
    </Reveal>
  )
}

const fieldClass =
  'mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-kuro px-3 text-ink outline-none transition-colors focus:border-aka-text'

// The child's measurements go with the reservation so the coach brings the
// right size; prefilled from what we have on file.
function ReserveSheet({
  item,
  size,
  member,
  onDone,
  onClose,
}: {
  item: Item
  size: string | undefined
  member: Member
  onDone: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const brand = useBrand()
  const { data: club } = useClub()
  const reserve = useReserve(club?.id, member.id)
  const [height, setHeight] = useState(member.height_cm ? String(member.height_cm) : '')
  const [weight, setWeight] = useState(member.weight_kg ? String(member.weight_kg) : '')
  const [note, setNote] = useState('')
  const [error, setError] = useState(false)
  const age = member.birth_year ? new Date().getFullYear() - member.birth_year : null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(false)
    try {
      await reserve.mutateAsync({
        item_key: item.key,
        item_name: t(`store.items.${item.key}.name`),
        size: size ?? null,
        price_cents: item.price * 100,
        height_cm: height ? Number(height) : null,
        weight_kg: weight ? Number(weight) : null,
        note: note.trim() || null,
      })
      onDone()
    } catch {
      setError(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 sm:items-center sm:px-6"
      onClick={onClose}
    >
      <motion.form
        role="dialog"
        aria-modal="true"
        onSubmit={onSubmit}
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        exit={{ y: 60 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-shiro p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center gap-4">
          <div className={`h-20 w-20 shrink-0 rounded-2xl bg-linear-to-br p-2 ${item.bg}`}>{item.art(brand)}</div>
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold uppercase tracking-wide text-ink">
              {t(`store.items.${item.key}.name`)}
            </p>
            <p className="font-display text-aka-text">
              {item.price} €{size && <span className="ml-2 rounded-md bg-ink px-2 py-0.5 text-sm text-shiro">{size}</span>}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm text-muted">
          {t('store.sheet.for', { name: member.full_name })}
          {age != null && ` · ${t('store.sheet.age', { age })}`}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t('store.sheet.height')}</span>
            <input type="number" min={50} max={230} inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} className={fieldClass} />
          </label>
          <label>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t('store.sheet.weight')}</span>
            <input type="number" min={10} max={200} inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} className={fieldClass} />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t('store.sheet.note')}</span>
          <input maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('store.sheet.notePlaceholder')} className={fieldClass} />
        </label>
        {error && <p className="mt-3 rounded-xl bg-aka/10 px-4 py-3 text-sm text-aka-text">{t('store.sheet.error')}</p>}
        <p className="mt-4 text-xs text-muted">{t('store.sheet.pay')}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-ink/15 font-display text-sm uppercase tracking-wide text-muted">
            {t('admin.edit.cancel')}
          </button>
          <button
            type="submit"
            disabled={reserve.isPending}
            className="min-h-12 rounded-xl bg-aka font-display text-sm uppercase tracking-wide text-shiro shadow-[0_12px_24px_-12px_color-mix(in_srgb,var(--color-aka)_90%,transparent)] disabled:opacity-60"
          >
            {reserve.isPending ? '...' : t('store.reserve')}
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}

// A tab of the app now (signed in, member of the club), so no login detour.
// The catalogue is still the example one; it moves to the database next.
export function Store() {
  const { t } = useTranslation()
  const { data: club } = useClub()
  const { data: member } = useMember(club?.id)
  const [pending, setPending] = useState<{ item: Item; size: string | undefined } | null>(null)
  const [reserved, setReserved] = useState<Set<string>>(new Set())
  const brand = useBrand()

  function onReserve(item: Item, size: string | undefined) {
    // Without the option the page is just a catalogue example.
    if (!club?.store_enabled) {
      setReserved((s) => new Set(s).add(item.key))
      return
    }
    if (member) setPending({ item, size })
  }

  return (
    <div className="px-5 pb-6 pt-5">
      <PageHeader kanji="店" title={t('store.title')} tone="bg-aka" />
      <p className="mt-2 text-sm text-muted">{t('store.body')}</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3 lg:gap-6">
        {ITEMS.map((item, i) => (
          <ProductCard key={item.key} brand={brand} item={item} index={i} reserved={reserved.has(item.key)} onReserve={onReserve} />
        ))}
      </div>
      {club?.store_enabled && member && (
        <div className="mt-6 lg:max-w-md">
          <MyReservationsCard memberId={member.id} />
        </div>
      )}
      <p className="mt-6 text-center text-sm text-muted-2">{t('store.note')}</p>
      <AnimatePresence>
        {pending && member && (
          <ReserveSheet
            item={pending.item}
            size={pending.size}
            member={member}
            onClose={() => setPending(null)}
            onDone={() => {
              setReserved((s) => new Set(s).add(pending.item.key))
              setPending(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
