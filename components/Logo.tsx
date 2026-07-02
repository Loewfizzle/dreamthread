export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  } as const;
  return (
    <div className={`flex items-center gap-2 ${sizes[size]}`}>
      <div className="flex items-center gap-1.5">
        <div className="w-[7px] h-[7px] rounded-full bg-accent" />
        <span className="font-semibold tracking-[-0.015em]">dreamthread</span>
      </div>
    </div>
  );
}
