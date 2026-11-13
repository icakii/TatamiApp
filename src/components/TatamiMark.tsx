// The Tatami seal, for screens that belong to no club yet (login, picker).
export function TatamiMark({ className = 'h-12 w-12 text-2xl' }: { className?: string }) {
  return (
    <span
      className={`flex -rotate-6 items-center justify-center rounded-[22%] bg-[#c2361f] font-brush leading-none text-shiro shadow-[0_12px_26px_-10px_rgba(194,54,31,0.9)] ${className}`}
      aria-label="Tatami"
    >
      畳
    </span>
  )
}
