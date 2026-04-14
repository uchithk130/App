type Props = {
  title: string;
  subtitle?: string;
};

export function AuthPageHeading({ title, subtitle }: Props) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm leading-relaxed text-slate-600 lg:text-base">{subtitle}</p> : null}
    </header>
  );
}
