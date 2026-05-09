import { useTheme } from '@/contexts/ThemeContext';

export function CompactLogo({ className = "" }: { className?: string }) {
  const { theme } = useTheme();
  
  const isLight = theme === 'light';
  
  return (
    <svg 
      width="200" 
      height="80" 
      viewBox="0 0 400 160" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=Outfit:wght@300&display=swap');
          `}
        </style>
        <radialGradient id="bgGlow" cx="25%" cy="50%" r="60%">
          <stop offset="0%" stopColor={isLight ? "#93c5fd" : "#00d4ff"} stopOpacity={isLight ? "0.15" : "0.07"}/>
          <stop offset="100%" stopColor={isLight ? "#ffffff" : "#060d1a"} stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isLight ? "#3b82f6" : "#00d4ff"}/>
          <stop offset="50%" stopColor={isLight ? "#2563eb" : "#0066ff"}/>
          <stop offset="100%" stopColor={isLight ? "#2563eb" : "#0066ff"} stopOpacity="0"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="400" height="160" rx="12" fill={isLight ? "#ffffff" : "#060d1a"}/>
      <rect width="400" height="160" rx="12" fill="url(#bgGlow)"/>

      {/* Border */}
      <rect width="400" height="160" rx="12" fill="none" stroke={isLight ? "#e5e7eb" : "#0a2040"} strokeWidth="1"/>

      {/* HEXAGON ICON */}
      {/* Outer hex */}
      <polygon
        points="72,12 108,32 108,72 72,92 36,72 36,32"
        fill={isLight ? "rgba(59, 130, 246, 0.08)" : "rgba(0,212,255,0.06)"}
        stroke={isLight ? "#3b82f6" : "#00d4ff"}
        strokeWidth="1.5"
        filter="url(#glow)"
      />
      {/* Inner hex */}
      <polygon
        points="72,26 100,42 100,62 72,78 44,62 44,42"
        fill={isLight ? "rgba(59, 130, 246, 0.12)" : "rgba(0,212,255,0.10)"}
      />
      {/* Stylized C letter inside */}
      <path
        d="M84 38 Q68 33 63 52 Q60 64 67 72 Q73 78 84 74"
        stroke={isLight ? "#3b82f6" : "#00d4ff"}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        filter="url(#glow)"
      />

      {/* TEXT */}
      {/* "Talk to" label */}
      <text
        x="130"
        y="58"
        fontFamily="'Outfit', 'Helvetica Neue', sans-serif"
        fontWeight="300"
        fontSize="13"
        fill={isLight ? "#3b82f6" : "#00d4ff"}
        letterSpacing="7"
        filter="url(#glow)"
      >TALK TO</text>

      {/* "CAS" main word */}
      <text
        x="128"
        y="108"
        fontFamily="'Syne', 'Arial Black', sans-serif"
        fontWeight="800"
        fontSize="56"
        fill={isLight ? "#1f2937" : "#ffffff"}
        letterSpacing="-1"
      >CAS</text>

      {/* Accent line */}
      <rect x="130" y="118" width="210" height="2" rx="1" fill="url(#accentLine)"/>
    </svg>
  );
}
