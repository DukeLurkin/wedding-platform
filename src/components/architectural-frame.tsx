import Image from "next/image";

type ArchitecturalFrameProps = {
  children: React.ReactNode;
};

export function ArchitecturalFrame({ children }: ArchitecturalFrameProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Image
        src="/images/architecture/marble-column.png"
        alt=""
        width={950}
        height={1655}
        priority
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-1/2 z-40 hidden h-[107vh] w-auto max-w-none -translate-x-[40%] -translate-y-1/2 select-none lg:block"
      />

      <Image
        src="/images/architecture/marble-column.png"
        alt=""
        width={950}
        height={1655}
        priority
        aria-hidden="true"
        className="pointer-events-none fixed right-0 top-1/2 z-40 hidden h-[107vh] w-auto max-w-none translate-x-[40%] -translate-y-1/2 select-none lg:block"
      />

      <div className="lg:px-24 xl:px-32">{children}</div>
    </div>
  );
}
