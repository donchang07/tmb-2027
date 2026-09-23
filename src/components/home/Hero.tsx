export function Hero({ slogan }: { slogan: string }) {
  return (
    <section className="hero-gradient rounded-[16px] px-6 py-10 text-white shadow-md">
      <p className="text-sm font-medium uppercase tracking-wide text-white/80">TMB 2027 · Tour du Mont-Blanc</p>
      <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">{slogan}</h1>
      <p className="mt-3 max-w-md text-white/90">
        레주슈에서 샤모니까지, 반시계 방향 12일 · 리프트 없이 전 구간 도보.
      </p>
    </section>
  );
}
