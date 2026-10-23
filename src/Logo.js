import React from "react";

function Logo({ className = "" }) {
  return (
    <svg
      className={`brand-mark ${className}`}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Veridoc AI logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="veridoc-gradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2684F4" />
          <stop offset="1" stopColor="#7546D8" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#veridoc-gradient)" />
      <path d="M16 10.5h11l7 7V27" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      <path d="M27 10.5v7h7" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      <path d="M13 15v15.5c0 4.9 4.4 7.6 11 10 6.6-2.4 11-5.1 11-10V23" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      <path d="m18.5 27 4.2 4.2 8-8" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
    </svg>
  );
}

export default Logo;
