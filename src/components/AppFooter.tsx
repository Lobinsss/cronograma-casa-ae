import Image from "next/image";

export default function AppFooter() {
  return (
    <footer
      className="mt-auto border-t-2 px-5 py-6"
      style={{ borderColor: "var(--primary-light)", backgroundColor: "var(--primary-deeper)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <Image
          src="/logomgt.svg"
          alt="Matrix Green Technologies"
          width={120}
          height={76}
          className="h-10 w-auto opacity-95"
        />
        <p
          className="text-center text-[11px] uppercase tracking-wide"
          style={{ color: "rgba(235,217,153,0.65)", fontFamily: "var(--font-body)" }}
        >
          Powered by Matrix Green Technologies 2026
        </p>
      </div>
    </footer>
  );
}
