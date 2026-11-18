/** The toy token bag: a chubby golden sack, tied with a pink ribbon, with a gold Moi crown coin on the front. 40 × 40. */
export const TOKEN_BAG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
<defs>
  <radialGradient id="bagBody" cx="38%" cy="35%" r="75%"><stop offset="0" stop-color="#FFF6D9"/><stop offset="0.5" stop-color="#F9D27A"/><stop offset="1" stop-color="#D99A2B"/></radialGradient>
  <radialGradient id="bagTop" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#FFF3CF"/><stop offset="1" stop-color="#E7B04A"/></radialGradient>
  <radialGradient id="bagCoin" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFF1C2"/><stop offset="0.55" stop-color="#E2BE68"/><stop offset="1" stop-color="#A57F2F"/></radialGradient>
</defs>
<ellipse cx="20" cy="37" rx="11" ry="1.8" fill="#000" opacity="0.10"/>
<path d="M13.5 10.5c-1.6-3 .6-5.6 3-4.4 1.4-2.6 5.6-2.6 7 0 2.4-1.2 4.6 1.4 3 4.4l-2.2 3.2h-8.6z" fill="url(#bagTop)" stroke="#B9801F" stroke-width="1.1" stroke-linejoin="round"/>
<path d="M15.2 15c-7.6 3.6-10.2 11.6-7.4 17.2 1.4 2.8 4.6 4 8.2 4h8c3.6 0 6.8-1.2 8.2-4 2.8-5.6.2-13.6-7.4-17.2z" fill="url(#bagBody)" stroke="#B9801F" stroke-width="1.2" stroke-linejoin="round"/>
<rect x="13.2" y="12.6" width="13.6" height="4" rx="2" fill="#E46C93" stroke="#B4436C" stroke-width="0.9"/>
<path d="M26.4 14.6c2.2-.6 3.4.6 3 2-.6-.8-1.6-1.2-3-.9" fill="#E46C93" stroke="#B4436C" stroke-width="0.8" stroke-linejoin="round"/>
<ellipse cx="13.6" cy="23.4" rx="2" ry="3.4" transform="rotate(20 13.6 23.4)" fill="#fff" opacity="0.65"/>
<circle cx="20.6" cy="27.4" r="5.6" fill="url(#bagCoin)" stroke="#86621E" stroke-width="1"/>
<circle cx="20.6" cy="27.4" r="4.3" fill="none" stroke="#FFF4CC" stroke-opacity="0.7" stroke-width="0.5"/>
<path d="M17.4 29.6l.7-4 1.7 1.7 .8-2.6 .8 2.6 1.7-1.7 .7 4z" fill="#F6DD95" stroke="#7D5A17" stroke-width="0.6" stroke-linejoin="round"/>
</svg>`;
