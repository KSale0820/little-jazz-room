import type { PlantStage } from './plantGrowth';

/**
 * Decorative growth drawn over the plant art.
 * Stage 0 sprouts, 1 adds a climbing vine, 2 a second vine with buds, 3 blossoms and a soft glow.
 */
export function PlantGrowthOverlay({ stage }: { stage: PlantStage }) {
  return (
    <svg className="plant-growth" data-stage={stage} viewBox="0 0 100 200" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="plant-glow-grad">
          <stop offset="0" stopColor="#fff3b0" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff3b0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse className="plant-glow" cx="52" cy="100" rx="60" ry="100" fill="url(#plant-glow-grad)" />
      <g className="plant-vines" fill="none" strokeLinecap="round">
        <path className="pg s1 vine" d="M48 172C44 150 56 130 46 110 38 92 54 74 46 52 42 40 50 30 52 26" />
        <path className="pg s2 vine" d="M62 172C68 150 62 130 70 108 76 92 64 76 66 58" />
      </g>
      <g className="plant-leaves">
        <path className="pg s0" transform="translate(50 168) rotate(-30) scale(0.37)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s0" transform="translate(58 166) rotate(35) scale(0.37)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s1" transform="translate(46 150) rotate(-20) scale(0.54)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s1" transform="translate(40 128) rotate(-60) scale(0.61)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s1" transform="translate(54 112) rotate(40) scale(0.61)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s1" transform="translate(42 92) rotate(-50) scale(0.68)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s1" transform="translate(55 72) rotate(35) scale(0.68)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s2" transform="translate(44 52) rotate(-40) scale(0.61)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s2" transform="translate(52 34) rotate(30) scale(0.54)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s2" transform="translate(66 150) rotate(25) scale(0.54)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s2" transform="translate(72 126) rotate(60) scale(0.61)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s2" transform="translate(62 104) rotate(-30) scale(0.61)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s2" transform="translate(74 84) rotate(55) scale(0.68)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <path className="pg s2" transform="translate(63 62) rotate(-25) scale(0.61)" d="M0 0c-6-7-6-17 0-25 6 8 6 18 0 25z" />
        <circle className="pg bud s2" cx="36" cy="100" r="3.2" />
        <circle className="pg bud s2" cx="78" cy="70" r="3.2" />
        <circle className="pg bud s2" cx="58" cy="40" r="3.2" />
        <circle className="pg bud s2" cx="68" cy="118" r="3.2" />
        <g className="pg bloom pink s3" transform="translate(38 124) scale(0.68)"><circle cx="0.0" cy="-4.2" r="3" /><circle cx="4.0" cy="-1.3" r="3" /><circle cx="2.5" cy="3.4" r="3" /><circle cx="-2.5" cy="3.4" r="3" /><circle cx="-4.0" cy="-1.3" r="3" /><circle className="core" r="2.2" /></g>
        <g className="pg bloom gold s3" transform="translate(76 100) scale(0.61)"><circle cx="0.0" cy="-4.2" r="3" /><circle cx="4.0" cy="-1.3" r="3" /><circle cx="2.5" cy="3.4" r="3" /><circle cx="-2.5" cy="3.4" r="3" /><circle cx="-4.0" cy="-1.3" r="3" /><circle className="core" r="2.2" /></g>
        <g className="pg bloom pink s3" transform="translate(50 60) scale(0.68)"><circle cx="0.0" cy="-4.2" r="3" /><circle cx="4.0" cy="-1.3" r="3" /><circle cx="2.5" cy="3.4" r="3" /><circle cx="-2.5" cy="3.4" r="3" /><circle cx="-4.0" cy="-1.3" r="3" /><circle className="core" r="2.2" /></g>
        <g className="pg bloom gold s3" transform="translate(70 44) scale(0.54)"><circle cx="0.0" cy="-4.2" r="3" /><circle cx="4.0" cy="-1.3" r="3" /><circle cx="2.5" cy="3.4" r="3" /><circle cx="-2.5" cy="3.4" r="3" /><circle cx="-4.0" cy="-1.3" r="3" /><circle className="core" r="2.2" /></g>
        <g className="pg bloom gold s3" transform="translate(44 86) scale(0.54)"><circle cx="0.0" cy="-4.2" r="3" /><circle cx="4.0" cy="-1.3" r="3" /><circle cx="2.5" cy="3.4" r="3" /><circle cx="-2.5" cy="3.4" r="3" /><circle cx="-4.0" cy="-1.3" r="3" /><circle className="core" r="2.2" /></g>
      </g>
      <g className="plant-sparkles">
        <circle className="pg s3 sparkle" cx="30" cy="70" r="1.6" />
        <circle className="pg s3 sparkle" cx="80" cy="130" r="1.4" />
        <circle className="pg s3 sparkle" cx="60" cy="20" r="1.5" />
      </g>
    </svg>
  );
}
