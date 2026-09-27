export function Hero({ slogan }: { slogan: string }) {
  return (
    <section className="rounded-[var(--radius-card)] bg-black px-6 py-14 text-center text-white sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-alpine-bright">TMB 2027 · Tour du Mont-Blanc</p>
      <h1 className="mt-3 text-[40px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[56px]">{slogan}</h1>
      <p className="mx-auto mt-4 max-w-md break-keep text-[17px] leading-relaxed text-mist">
        레주슈에서 샤모니까지, 반시계 방향 12일 · 리프트 없이 전 구간 도보.
      </p>
    </section>
  );
}
