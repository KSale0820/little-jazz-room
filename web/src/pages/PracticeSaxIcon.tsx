/** Compact golden tenor-sax symbol for the approved Free Practice hero.
 *  A vector with stepped pixel geometry, not a reused framed music-poster image.
 */
export function PracticeSaxIcon() {
  return (
    <svg className="p01-suave-sax-illustration" viewBox="0 0 110 105" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="jazzSaxBrass" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff0b5"/><stop offset=".28" stopColor="#f4c86f"/><stop offset=".65" stopColor="#c88030"/><stop offset="1" stopColor="#855021"/>
        </linearGradient>
        <linearGradient id="jazzSaxBell" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffe09a"/><stop offset=".45" stopColor="#e2a14c"/><stop offset="1" stopColor="#995624"/>
        </linearGradient>
      </defs>
      <g shapeRendering="crispEdges">
        {/* Bent mouthpiece, neck and the descending body of the instrument. */}
        <path d="M93 14H73V22H70V35H67V44H63V55H57V67H51V77H45" fill="none" stroke="#583a25" strokeWidth="17" strokeLinejoin="miter" strokeLinecap="square"/>
        <path d="M92 14H75V24H71V36H67V47H62V57H56V70H51V77H45" fill="none" stroke="url(#jazzSaxBrass)" strokeWidth="12" strokeLinejoin="miter" strokeLinecap="square"/>
        <path d="M89 10h14v7H89Z" fill="#583826"/>
        <path d="M88 10h11v4H88Z" fill="#d6af67"/>
        <path d="M74 19h5v17h-5v-8h-3v-8z" fill="#ffe29b" opacity=".83"/>
        <path d="M65 43h4v12h-5v8h-5v8h-4v8h-5" fill="none" stroke="#ffe4a0" strokeWidth="3"/>
        {/* Gold tone-holes and key arms. */}
        <g fill="#ffdf90" stroke="#69432b" strokeWidth="1.5">
          <rect x="61" y="43" width="6" height="6" rx="1"/>
          <rect x="57" y="53" width="6" height="6" rx="1"/>
          <rect x="51" y="63" width="6" height="6" rx="1"/>
          <rect x="45" y="72" width="6" height="6" rx="1"/>
        </g>
        <path d="M55 47h12M51 58h10M45 68h12" stroke="#9b5a2c" strokeWidth="2"/>
        {/* Upturned lower bell, with a dark rim and bright reflective pixels. */}
        <path d="M47 75H36V69H26V63H16V69H7V81H17V86H38V83H45Z" fill="#77421e" stroke="#4d3529" strokeWidth="3"/>
        <path d="M46 76H36V71H26V67H17V72H11V79H19V83H37V80H45Z" fill="url(#jazzSaxBell)"/>
        <ellipse cx="23" cy="72" rx="16" ry="8" fill="#5a3426" stroke="#ffe7a8" strokeWidth="3"/>
        <ellipse cx="23" cy="71" rx="10" ry="4" fill="#a96733"/>
        <path d="M16 67h18M19 81h13M50 77h-5" stroke="#fff0b3" strokeWidth="2" opacity=".85"/>
        <rect x="37" y="79" width="6" height="5" fill="#eebf67"/>
        <rect x="52" y="68" width="4" height="5" fill="#ffdb8c"/>
        <rect x="70" y="27" width="3" height="6" fill="#fbe3a7"/>
      </g>
    </svg>
  );
}
