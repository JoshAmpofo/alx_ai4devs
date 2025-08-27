import * as React from "react";
import { twMerge } from "tailwind-merge";

export interface LabelProps extends React.ComponentPropsWithoutRef<"label"> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>((
  { className, ...props },
  ref
) => {
  return (
    <label
      ref={ref}
      className={twMerge(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
});

Label.displayName = "Label";
