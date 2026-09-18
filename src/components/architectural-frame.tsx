type ArchitecturalFrameProps = {
  children: React.ReactNode;
};

export function ArchitecturalFrame({
  children,
}: ArchitecturalFrameProps) {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 left-0 z-40 hidden w-20 border-r border-limestone bg-parchment lg:block xl:w-28"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 right-0 z-40 hidden w-20 border-l border-limestone bg-parchment lg:block xl:w-28"
      />

      <div className="lg:px-20 xl:px-28">{children}</div>
    </div>
  );
}