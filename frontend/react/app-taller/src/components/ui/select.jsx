import React from "react";

export function Select({ value, onValueChange, children, ...props }) {
  return (
    <select
      className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
      value={value}
      onChange={e => onValueChange(e.target.value)}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, ...props }) {
  return <>{children}</>;
}

export function SelectValue({ children, ...props }) {
  return <>{children}</>;
}

export function SelectContent({ children, ...props }) {
  return <>{children}</>;
}

export function SelectItem({ value, children, ...props }) {
  return (
    <option value={value} {...props}>
      {children}
    </option>
  );
}
