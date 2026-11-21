export function BrandLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#059669" />
      <path
        d="M16 39C16 29.6112 23.6112 22 33 22C42.3888 22 50 29.6112 50 39H16Z"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M13 44.5H51"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d="M33 15L36.5 18.5L33 22L29.5 18.5L33 15Z" fill="#F97316" />
      <path
        d="M25 33.5H39.5"
        stroke="#FDE68A"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
