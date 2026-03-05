import Image from "next/image";

type LegacyLoopLogoSize = "sm" | "md" | "hero";

type LegacyLoopLogoProps = {
  size: LegacyLoopLogoSize;
  showTagline?: boolean;
  className?: string;
};

const sizeStyles: Record<
  LegacyLoopLogoSize,
  {
    width: number;
    height: number;
  }
> = {
  sm: {
    width: 56,
    height: 40,
  },
  md: {
    width: 432,
    height: 307,
  },
  hero: {
    width: 810,
    height: 576,
  },
};

export function LegacyLoopLogo(props: LegacyLoopLogoProps) {
  const { size, className = "" } = props;
  const styles = sizeStyles[size];

  return (
    <Image
      src="/branding/legacy-loop-logo-2-clean.png"
      alt="Legacy Loop logo"
      width={styles.width}
      height={styles.height}
      className={["h-auto w-auto", className].join(" ")}
      priority={size === "hero"}
    />
  );
}
