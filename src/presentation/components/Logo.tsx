import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string | undefined }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center gap-2 font-display text-lg font-extrabold tracking-tight",
        className,
      )}
    >
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pop">
        <span aria-hidden="true" className="text-sm font-black">
          S
        </span>
      </span>
      <span>Splitout!</span>
    </Link>
  );
}
