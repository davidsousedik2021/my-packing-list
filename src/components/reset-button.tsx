import type { ReactNode } from "react";

type ResetButtonProps = {
  onReset: () => void;
  children?: ReactNode;
  className?: string;
};

export default function ResetButton({
  onReset,
  children,
  className,
}: ResetButtonProps) {
  return (
    <button type="button" onClick={onReset} className={className ?? "btn btn-primary"}>
      {children ?? "Reset"}
    </button>
  );
}
