export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className='font-mono text-[10px] uppercase tracking-widest text-zinc-500'>
      {children}
    </span>
  );
}
