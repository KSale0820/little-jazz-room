/** Decorative night-window vignette closely following the approved Practice mockup. */
export function PracticeHeroVignette() {
  return (
    <svg className="p01-suave-window-art" viewBox="0 0 242 144" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="jazzNightSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#71618a" />
          <stop offset=".55" stopColor="#88749a" />
          <stop offset="1" stopColor="#d6a28f" />
        </linearGradient>
        <linearGradient id="jazzBrass" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f8d995" />
          <stop offset=".52" stopColor="#b98543" />
          <stop offset="1" stopColor="#795334" />
        </linearGradient>
        <radialGradient id="jazzLampGlow">
          <stop stopColor="#ffe8a6" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffe8a6" stopOpacity="0" />
        </radialGradient>
        <clipPath id="jazzArchClip">
          <path d="M141 132V54A49 49 0 0 1 239 54V132Z"/>
        </clipPath>
      </defs>
      <ellipse cx="111" cy="112" rx="58" ry="39" fill="url(#jazzLampGlow)"/>
      <g clipPath="url(#jazzArchClip)">
        <rect x="141" y="5" width="98" height="130" fill="url(#jazzNightSky)"/>
        <path d="M207 24a12 12 0 1 0 15 17a13 13 0 0 1-15-17Z" fill="#fce7a2"/>
        <g fill="#ffeaa5">
          <path d="M171 26l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/>
          <path d="M191 11l1 4 4 1-4 1-1 4-1-4-4-1 4-1Z"/>
          <path d="M225 61l1 4 4 1-4 1-1 4-1-4-4-1 4-1Z"/>
          <circle cx="156" cy="57" r="1.9"/><circle cx="210" cy="76" r="1.3"/>
        </g>
        <path d="M144 132V110h12V88h12v22h10V92h9v-19h9v33h11V92h14v-13h10v53Z" fill="#45445f"/>
        <g fill="#edc18b"><rect x="155" y="116" width="2" height="3"/><rect x="163" y="102" width="2" height="3"/><rect x="184" y="107" width="2" height="3"/><rect x="197" y="93" width="2" height="3"/><rect x="211" y="113" width="2" height="3"/><rect x="223" y="98" width="2" height="3"/><rect x="217" y="124" width="2" height="3"/><rect x="172" y="123" width="2" height="3"/></g>
      </g>
      <path d="M141 132V54A49 49 0 0 1 239 54V132" fill="none" stroke="#785958" strokeWidth="6"/>
      <path d="M141 132V54A49 49 0 0 1 239 54V132" fill="none" stroke="#d7ad8c" strokeWidth="2"/>
      <path d="M190 12v120M142 80h96" fill="none" stroke="#7e5e61" strokeWidth="5"/>
      <path d="M190 12v120M142 80h96" fill="none" stroke="#d4a48b" strokeWidth="1"/>
      <path d="M140 132h101" stroke="#805b4f" strokeWidth="7" strokeLinecap="round"/>
      <path d="M140 129h101" stroke="#e2bb98" strokeWidth="2" strokeLinecap="round"/>

      {/* Books on the sill, behind the trailing houseplant. */}
      <rect x="115" y="124" width="33" height="8" rx="2" fill="#6b6685" stroke="#665460" strokeWidth="1.5"/>
      <path d="M118 126h28M118 130h27" stroke="#efdbb6" strokeWidth="1.5"/>
      <rect x="136" y="128" width="32" height="5" rx="1" fill="#efddbc" stroke="#9d8065"/>

      {/* Brass desk lamp and its soft golden shade. */}
      <path d="M70 116V57Q70 37 89 30L101 26" fill="none" stroke="#825734" strokeWidth="7" strokeLinecap="round"/>
      <path d="M70 116V57Q70 37 89 30L101 26" fill="none" stroke="#e3ad62" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="101" cy="25" r="5" fill="#936434" stroke="#f7d69a" strokeWidth="2"/>
      <path d="M101 27l27 12-13 29-35-14Z" fill="url(#jazzBrass)" stroke="#8e623c" strokeWidth="2.5"/>
      <path d="M83 53q18 16 33 12" fill="none" stroke="#fff0c8" strokeWidth="3" strokeLinecap="round"/>
      <path d="M102 59l-8 19 27-9 10-24Z" fill="#ffdb8a" opacity=".18"/>

      {/* Lush botanicals, rendered as crisp discrete leaf shapes. */}
      <rect x="45" y="102" width="35" height="26" rx="3" fill="#baa09a" stroke="#857b6a" strokeWidth="3"/>
      <path d="M45 107h35" stroke="#eed5bd" strokeWidth="4"/>
      <path d="M63 104C63 85 52 69 44 64M63 99C70 76 86 73 96 65M61 103C55 83 35 90 31 84M60 95C61 69 54 52 46 46" stroke="#5a7050" strokeWidth="3.5" fill="none"/>
      <g fill="#75956a" stroke="#47634b" strokeWidth="1.3">
        <path d="M45 64q-15-9-18 3 10 12 18-3Z"/>
        <path d="M47 66q-1-15 10-13 8 10-10 13Z"/>
        <path d="M80 77q8-17 19-8-1 12-19 8Z"/>
        <path d="M76 78q-13-16-22-7 4 13 22 7Z"/>
        <path d="M35 84q-13-12-21-1 10 11 21 1Z"/>
        <path d="M47 48q-13-14-23-4 7 11 23 4Z"/>
        <path d="M51 58q0-15 12-13 5 12-12 13Z"/>
        <path d="M70 90q11-11 20-3-5 12-20 3Z"/>
        <path d="M54 95q-7-14-16-10-1 12 16 10Z"/>
      </g>
      <path d="M66 101q0 27-16 28t-8 12M51 117q-9 19-25 19" fill="none" stroke="#55734c" strokeWidth="3"/>
      <g fill="#739b69" stroke="#466444" strokeWidth="1.2">
        <path d="M55 117q-13-7-15 4 10 8 15-4Z"/>
        <path d="M47 131q9-12 17-2-7 9-17 2Z"/>
        <path d="M36 137q-10-11-18-3 10 10 18 3Z"/>
      </g>
    </svg>
  );
}
