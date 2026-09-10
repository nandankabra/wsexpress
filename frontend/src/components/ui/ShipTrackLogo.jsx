import React from 'react';

export function ShipTrackLogoIcon({ className = "h-8 w-8", ...props }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="st-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="st-grad-accent" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>

      {/* Rounded squircle backdrop */}
      <rect width="40" height="40" rx="10" fill="url(#st-grad-main)" />

      {/* Modern isometric geometric shipping mark */}
      {/* Top facet */}
      <path
        d="M20 9L29 14.2L20 19.4L11 14.2L20 9Z"
        fill="#FFFFFF"
        fillOpacity="0.95"
      />
      {/* Left facet */}
      <path
        d="M11 15.6L19.2 20.3V29.8L11 25.1V15.6Z"
        fill="url(#st-grad-accent)"
        fillOpacity="0.9"
      />
      {/* Right facet */}
      <path
        d="M20.8 20.3L29 15.6V25.1L20.8 29.8V20.3Z"
        fill="#E0E7FF"
        fillOpacity="0.75"
      />
      {/* Supersonic speed lines */}
      <path
        d="M6 19H13M4 23H10"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  );
}

export default function ShipTrackLogo({ className = "", textClassName = "", iconClassName = "h-8 w-8", showText = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ShipTrackLogoIcon className={iconClassName} />
      {showText && (
        <span className={`font-bold tracking-tight text-zinc-900 flex items-center ${textClassName}`}>
          Ship<span className="text-indigo-600">Track</span>
        </span>
      )}
    </div>
  );
}
