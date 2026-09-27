import { useAnimatedNumber } from '@/hooks/shared/use-animated-number';

const DEFAULT_FORMAT = new Intl.NumberFormat('ar-SY-u-nu-latn');

interface AnimatedNumberProps {
  value: number;
  format?: Intl.NumberFormat;
  /** Appended after the number, e.g. "%". */
  suffix?: string;
  className?: string;
}

/** A number that counts up to its value; screen readers get the final value only. */
export function AnimatedNumber({
  value,
  format = DEFAULT_FORMAT,
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const display = useAnimatedNumber(value);
  const final = `${format.format(value)}${suffix}`;
  return (
    <span className={className}>
      <span aria-hidden="true" className="tabular-nums">
        {format.format(Math.round(display))}
        {suffix}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
