type IconProps = { className?: string };

const SIZE = 16;

export const TrashIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width={SIZE}
    height={SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable={false}
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const CheckIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width={SIZE}
    height={SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable={false}
  >
    <path d="M5 12l4 4L19 7" />
  </svg>
);

// Paper-plane / "send" shape.
export const SendIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width={SIZE}
    height={SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable={false}
  >
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

// Dim full ring + bright quarter arc — consumers rotate this via a CSS
// `animation` (e.g. `spin` keyframe from panda.config.ts) to read as a spinner.
export const SpinnerIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width={SIZE}
    height={SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    focusable={false}
  >
    <circle cx="12" cy="12" r="9" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" opacity="1" />
  </svg>
);
