import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { cn } from "../../utils/cn";

export function FormInput({
  label,
  error,
  required = false,
  className,
  labelClassName,
  inputClassName,
  ...props
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className={cn("text-sm font-medium", labelClassName)}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        className={cn(
          error && "border-red-500 focus-visible:ring-red-500",
          inputClassName
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function FormTextarea({
  label,
  error,
  required = false,
  className,
  labelClassName,
  textareaClassName,
  ...props
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className={cn("text-sm font-medium", labelClassName)}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        className={cn(
          error && "border-red-500 focus-visible:ring-red-500",
          textareaClassName
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function FormSelect({
  label,
  error,
  required = false,
  className,
  labelClassName,
  selectClassName,
  children,
  ...props
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className={cn("text-sm font-medium", labelClassName)}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500",
          selectClassName
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
