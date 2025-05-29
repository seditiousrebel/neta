
import type { SVGProps } from 'react';

export function NetrikaLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 180 40"
      width="180"
      height="40"
      aria-label="Netrika Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap');
          .logo-text {
            font-family: 'Roboto', sans-serif;
            font-size: 30px;
            font-weight: 700;
            fill: url(#logoGradient);
          }
        `}
      </style>
      <text x="0" y="30" className="logo-text">
        Netrika
      </text>
    </svg>
  );
}
