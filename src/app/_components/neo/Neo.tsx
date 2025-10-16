import React from "react";

export const NeoSurface: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
  <div className={`neo-surface ${className || ""}`.trim()}>{children}</div>
);

export const NeoBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...rest }) => (
  <button className={`neo-btn cursor-pointer ${className || ""}`.trim()} {...rest} />
);

export const NeoInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={`input neo-inset ${className || ""}`.trim()} {...props} />
  )
);

NeoInput.displayName = "NeoInput";
