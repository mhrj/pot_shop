import { twMerge } from 'tailwind-merge';

export default function Container({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag className={twMerge('mx-auto w-full max-w-7xl px-4 md:px-8', className)}>
      {children}
    </Tag>
  );
}
