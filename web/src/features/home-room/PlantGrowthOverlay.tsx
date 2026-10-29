import type { PlantStage } from './plantGrowth';

/** Decorative sprigs drawn over the existing plant art; more appear as practice accumulates. */
export function PlantGrowthOverlay({ stage }: { stage: PlantStage }) {
  return (
    <svg className="plant-growth" data-stage={stage} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="plant-glow-grad">
          <stop offset="0" stopColor="#f6f0b0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f6f0b0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="plant-glow">
        <ellipse cx="50" cy="48" rx="46" ry="48" />
      </g>
      <g className="plant-leaves plant-leaves-1">
        <path d="M30 34c-12-1-16-10-14-17 10 0 16 6 14 17z" />
        <path d="M66 28c10-3 14-11 11-17-9 2-14 8-11 17z" />
      </g>
      <g className="plant-leaves plant-leaves-2">
        <path d="M50 18c-8-5-9-13-5-18 8 3 11 11 5 18z" />
        <circle cx="38" cy="56" r="2.6" className="plant-bud" />
        <circle cx="64" cy="48" r="2.6" className="plant-bud" />
      </g>
      <g className="plant-leaves plant-leaves-3">
        <g className="plant-bloom" transform="translate(30 44)">
          <circle r="4.4" />
          <circle cx="-4" cy="-3" r="2.6" />
          <circle cx="4" cy="-3" r="2.6" />
          <circle cx="0" cy="4" r="2.6" />
        </g>
        <g className="plant-bloom" transform="translate(70 36)">
          <circle r="4.4" />
          <circle cx="-4" cy="-3" r="2.6" />
          <circle cx="4" cy="-3" r="2.6" />
          <circle cx="0" cy="4" r="2.6" />
        </g>
        <g className="plant-bloom" transform="translate(52 62)">
          <circle r="3.6" />
          <circle cx="-3" cy="-2" r="2.1" />
          <circle cx="3" cy="-2" r="2.1" />
        </g>
      </g>
    </svg>
  );
}
