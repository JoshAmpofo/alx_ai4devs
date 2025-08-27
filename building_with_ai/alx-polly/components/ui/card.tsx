import * as React from "react";
import { cn } from "../../utils/cn";

export const Card = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
        {...props}
      />
    );
  }
);

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

type AsProp<E extends React.ElementType> = { as?: E };
type PolymorphicRef<E extends React.ElementType> = React.ComponentPropsWithRef<E>["ref"];
type PropsToOmit<E extends React.ElementType, P> = keyof (AsProp<E> & P);
type PolymorphicComponentProp<E extends React.ElementType, P> = P &
  AsProp<E> &
  Omit<React.ComponentPropsWithoutRef<E>, PropsToOmit<E, P>>;
type PolymorphicComponentPropWithRef<E extends React.ElementType, P> =
  PolymorphicComponentProp<E, P> & { ref?: PolymorphicRef<E> };

type CardTitleOwnProps = { className?: string };

const CardTitleInner = (
  { as, className, ...props }: any,
  ref: any
) => {
  const Component = (as ?? 'h3') as React.ElementType;
  return (
    <Component
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
};

type CardTitleComponent = <E extends React.ElementType = 'h3'>(
  props: PolymorphicComponentPropWithRef<E, CardTitleOwnProps>
) => React.ReactElement | null;

export const CardTitle = React.forwardRef(CardTitleInner) as unknown as CardTitleComponent;
(CardTitle as any).displayName = 'CardTitle';

export function CardDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className="text-sm text-muted-foreground" {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
