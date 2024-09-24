import { cn } from '@/lib/utils';
import type { HTMLAttributes, PropsWithChildren } from 'react';

export function TypographyH1({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <h1 className={cn('scroll-m-20 text-4xl font-bold tracking-tight', className)} {...props}>
      {children}
    </h1>
  );
}
export function TypographyH2({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <h2
      className={cn('scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0', className)}
      {...props}
    >
      {children}
    </h2>
  );
}
export function TypographyH3({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <h3 className={cn('scroll-m-20 text-2xl font-semibold tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}
export function TypographyH4({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <h4 className={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)} {...props}>
      {children}
    </h4>
  );
}
export function TypographyH5({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <h5 className={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)} {...props}>
      {children}
    </h5>
  );
}
export function TypographyH6({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <h6 className={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)} {...props}>
      {children}
    </h6>
  );
}
export function TypographyP({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <p className={cn('leading-7 [&:not(:first-child)]:mt-6', className)} {...props}>
      {children}
    </p>
  );
}
export function TypographyBlockquote({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLQuoteElement>>) {
  return (
    <blockquote className={cn('mt-6 border-l-2 pl-6 italic', className)} {...props}>
      {children}
    </blockquote>
  );
}
export function TypographyInlineCode({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <code
      className={cn('relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono', className)}
      {...props}
    >
      {children}
    </code>
  );
}
