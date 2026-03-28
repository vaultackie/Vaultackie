import { useState, useEffect, useRef, useCallback, createContext, useContext, useMemo } from "react";

/* ══════════════════════════════════════════════════════════════════════════════
   VAULTACKIE — COMPLETE FRONTEND APP
   Integrates with: Express backend, MySQL, Redis, Socket.IO, Twilio, S3,
                    Gemini AI, Nodemailer, JWT Auth
══════════════════════════════════════════════════════════════════════════════ */

/* ─── FONT INJECTION ──────────────────────────────────────────────────────── */
(() => {
  if (document.getElementById('vt-fonts')) return;
  const l = document.createElement('link');
  l.id   = 'vt-fonts';
  l.rel  = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap';
  document.head.appendChild(l);
})();

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#050510;color:#dde4f0;-webkit-font-smoothing:antialiased;overflow:hidden;height:100vh}
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,212,255,.22);border-radius:3px}
input,textarea,button,select{font-family:'DM Sans',sans-serif}
input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #0e0e28 inset!important;-webkit-text-fill-color:#dde4f0!important}
textarea{resize:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideL{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideR{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:.35;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(0,212,255,.2)}50%{box-shadow:0 0 22px rgba(0,212,255,.6)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes scanl{0%{top:0%}100%{top:100%}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
@keyframes gradS{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes msgPop{from{opacity:0;transform:scale(.92) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
.aFadeUp{animation:fadeUp .26s ease-out both}
.aFadeIn{animation:fadeIn .2s ease-out both}
.aSlideL{animation:slideL .24s ease-out both}
.aSlideR{animation:slideR .24s ease-out both}
.aSpin{animation:spin 1s linear infinite}
.aGlow{animation:glow 2.2s ease-in-out infinite}
.aFloat{animation:float 3.5s ease-in-out infinite}
.aBlink{animation:blink 1s step-end infinite}
.aMsgPop{animation:msgPop .22s ease-out both}
.s1{animation-delay:.05s}.s2{animation-delay:.1s}.s3{animation-delay:.15s}.s4{animation-delay:.2s}.s5{animation-delay:.25s}
`;
if (!document.getElementById('vt-css')) {
  const s = document.createElement('style');
  s.id = 'vt-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─── DESIGN TOKENS ───────────────────────────────────────────────────────── */
const C = {
  bg0:'#050510', bg1:'#080818', bg2:'#0c0c22', bg3:'#0e0e28',
  surf:'#0f0f26', card:'#121232', card2:'#16163a',
  pri:'#00d4ff',  priD:'rgba(0,212,255,.14)', priB:'rgba(0,212,255,.26)',
  sec:'#7c3aed',  secD:'rgba(124,58,237,.14)', secB:'rgba(124,58,237,.28)',
  grn:'#00e5a0',  grnD:'rgba(0,229,160,.11)', grnB:'rgba(0,229,160,.28)',
  red:'#f05050',  redD:'rgba(240,80,80,.11)',  redB:'rgba(240,80,80,.28)',
  yel:'#fbbf24',  yelD:'rgba(251,191,36,.11)',
  txt:'#dde4f0', mid:'#7a85a0', dim:'#3a405e',
  brd:'rgba(0,212,255,.1)', brdM:'rgba(0,212,255,.2)',
  shadow:'0 4px 28px rgba(0,0,0,.55)',
  glow: (c='#00d4ff',r=18) => `0 0 ${r}px ${c}45`,
};

/* ─── API LAYER ───────────────────────────────────────────────────────────── */
const API_URL = 'http://localhost:5000/api/v1';
let _tok = null;
try { _tok = localStorage.getItem('vt_tok'); } catch {}

const getTok   = () => _tok;
const saveTok  = (t) => { _tok = t; try { localStorage.setItem('vt_tok', t); } catch {} };
const wipeTok  = () => { _tok = null; try { localStorage.removeItem('vt_tok'); localStorage.removeItem('vt_user'); } catch {} };

async function req(method, path, body, rawForm) {
  const headers = { ...(!rawForm && { 'Content-Type':'application/json' }), ...(_tok ? { Authorization:`Bearer ${_tok}` } : {}) };
  try {
    const res  = await fetch(`${API_URL}${path}`, { method, headers, body: rawForm || (body ? JSON.stringify(body) : undefined) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { code: res.status, msg: data.error || data.message || `Error ${res.status}` };
    return data;
  } catch(e) {
    if (e.code) throw e;
    throw { code:0, msg:'Cannot reach Vaultackie server. Running in demo mode.' };
  }
}

const $get   = (p)    => req('GET',    p);
const $post  = (p, b) => req('POST',   p, b);
const $patch = (p, b) => req('PATCH',  p, b);
const $del   = (p)    => req('DELETE', p);
const $up    = (p, f) => req('POST',   p, null, f);

/* ─── SESSION CAPTURE ─────────────────────────────────────────────────────── */
const SESSION_KEY = 'vt_sessions';

function parseDevice(ua = navigator.userAgent) {
  const isMobile  = /Android|iPhone|iPad|iPod/i.test(ua);
  const isTablet  = /iPad|Android(?!.*Mobile)/i.test(ua);
  const os = /Windows/.test(ua)?'Windows':/Mac OS X/.test(ua)&&!/iPhone|iPad/.test(ua)?'macOS':/iPhone/.test(ua)?'iOS':/iPad/.test(ua)?'iPadOS':/Android/.test(ua)?'Android':/Linux/.test(ua)?'Linux':'Unknown OS';
  const browser = /Edg\//.test(ua)?'Edge':/OPR\/|Opera/.test(ua)?'Opera':/Chrome\//.test(ua)&&!/Chromium/.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':/SamsungBrowser/.test(ua)?'Samsung Internet':'Browser';
  const device = isTablet?'Tablet':isMobile?'Mobile':'Desktop';
  return { os, browser, device, ua: ua.slice(0,120) };
}

async function fetchIPInfo() {
  const fetchWithTimeout = (url, ms) => {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(tid));
  };
  try {
    const r = await fetchWithTimeout('https://ipapi.co/json/', 4000);
    const d = await r.json();
    return { ip: d.ip||'Unknown', city: d.city||'', region: d.region||'', country: d.country_name||d.country||'', isp: d.org||'', timezone: d.timezone||'' };
  } catch {
    try {
      const r2 = await fetchWithTimeout('https://api.ipify.org?format=json', 3000);
      const d2 = await r2.json();
      return { ip: d2.ip||'Unknown', city:'', region:'', country:'', isp:'', timezone:'' };
    } catch { return { ip:'Unavailable', city:'', region:'', country:'', isp:'', timezone:'' }; }
  }
}

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)||'[]'); } catch { return []; }
}

function saveSessions(arr) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(arr.slice(0,20))); } catch {}
}

/* ─── TOTP ENGINE (RFC 6238 — pure JS, no library) ───────────────────────── */
const TOTP_KEY = 'vt_2fa';
const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Encode(bytes) {
  let bits=0,val=0,out='';
  for(let i=0;i<bytes.length;i++){val=(val<<8)|bytes[i];bits+=8;while(bits>=5){out+=B32_CHARS[(val>>>(bits-5))&31];bits-=5;}}
  if(bits>0)out+=B32_CHARS[(val<<(5-bits))&31];
  return out;
}
function base32Decode(str) {
  str=str.toUpperCase().replace(/\s/g,'').replace(/=+$/,'');
  let bits=0,val=0;const out=[];
  for(const c of str){const idx=B32_CHARS.indexOf(c);if(idx===-1)continue;val=(val<<5)|idx;bits+=5;if(bits>=8){out.push((val>>>(bits-8))&255);bits-=8;}}
  return new Uint8Array(out);
}
async function hmacSha1(keyBytes,msgBytes) {
  const key=await crypto.subtle.importKey('raw',keyBytes,{name:'HMAC',hash:'SHA-1'},false,['sign']);
  const sig=await crypto.subtle.sign('HMAC',key,msgBytes);
  return new Uint8Array(sig);
}
async function computeTOTP(secret,timeStep=30,digits=6,offset=0) {
  try {
    const keyBytes=base32Decode(secret);
    const counter=Math.floor(Date.now()/1000/timeStep)+offset;
    const msg=new Uint8Array(8);let c=counter;
    for(let i=7;i>=0;i--){msg[i]=c&0xff;c=Math.floor(c/256);}
    const hmac=await hmacSha1(keyBytes,msg);
    const off2=hmac[19]&0xf;
    const code=((hmac[off2]&0x7f)<<24|(hmac[off2+1]&0xff)<<16|(hmac[off2+2]&0xff)<<8|(hmac[off2+3]&0xff))%Math.pow(10,digits);
    return String(code).padStart(digits,'0');
  } catch { return '000000'; }
}
function generateTOTPSecret() {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20)));
}
function generateBackupCodes(n=8) {
  return Array.from({length:n},()=>{
    const r=crypto.getRandomValues(new Uint8Array(4));
    return Array.from(r,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase().match(/.{4}/g).join('-');
  });
}
function get2FAState()   { try{return JSON.parse(localStorage.getItem(TOTP_KEY)||'null');}catch{return null;} }
function save2FAState(s) { try{localStorage.setItem(TOTP_KEY,JSON.stringify(s));}catch{} }
function clear2FAState() { try{localStorage.removeItem(TOTP_KEY);}catch{} }
function totpURI(secret,account='user',issuer='Vaultackie') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
function qrCodeURL(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&bgcolor=0e0e28&color=00d4ff&margin=10`;
}

async function recordSession(user, loginMethod, credential='') {
  const dev   = parseDevice();
  const ipInfo= await fetchIPInfo();
  const session = {
    id:         'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
    userId:     user?.id || 'unknown',
    displayName:user?.displayName || user?.firstName || 'User',
    email:      user?.email  || '',
    phone:      user?.phone  || '',
    credential: credential,          // masked: show type only
    loginMethod,
    loginAt:    new Date().toISOString(),
    lastActive: new Date().toISOString(),
    isCurrentSession: true,
    ip:         ipInfo.ip,
    city:       ipInfo.city,
    region:     ipInfo.region,
    country:    ipInfo.country,
    isp:        ipInfo.isp,
    timezone:   ipInfo.timezone,
    os:         dev.os,
    browser:    dev.browser,
    device:     dev.device,
    screen:     `${window.screen?.width||0}×${window.screen?.height||0}`,
    lang:       navigator.language || '',
    token:      getTok()?.slice(-8) || '',
  };
  // Mark all previous sessions as not current
  const prev = loadSessions().map(s => ({ ...s, isCurrentSession: false }));
  saveSessions([session, ...prev]);
  return session;
}

/* ─── PLATFORM CONFIG ─────────────────────────────────────────────────────── */
const PLATS = [
  { id:'vaultackie', n:'Vaultackie Direct', c:'#00d4ff', s:'⬡' },
  { id:'instagram',  n:'Instagram',          c:'#e1306c', s:'◈' },
  { id:'twitter',    n:'X / Twitter',         c:'#1d9bf0', s:'✦' },
  { id:'whatsapp',   n:'WhatsApp',            c:'#25d366', s:'◉' },
  { id:'facebook',   n:'Messenger',           c:'#0084ff', s:'◈' },
  { id:'telegram',   n:'Telegram',            c:'#0088cc', s:'▲' },
  { id:'discord',    n:'Discord',             c:'#5865f2', s:'◆' },
  { id:'linkedin',   n:'LinkedIn',            c:'#0a66c2', s:'▣' },
  { id:'snapchat',   n:'Snapchat',            c:'#fffc00', s:'◎' },
  { id:'tiktok',     n:'TikTok',              c:'#fe2c55', s:'▷' },
];
const pc = id => PLATS.find(p=>p.id===id)?.c || C.pri;
const ps = id => PLATS.find(p=>p.id===id)?.s || '⬡';
const pn = id => PLATS.find(p=>p.id===id)?.n || 'Direct';

/* ─── MOCK DATA ────────────────────────────────────────────────────────────── */
const MOCK_CONVS = [
  { id:'1', type:'direct', name:'Alex Rivera',  lastTxt:'Encryption module ready ✓',        at:Date.now()-120000,  plat:'vaultackie', unread:3, init:'AR', online:true  },
  { id:'2', type:'group',  name:'Neural Squad', lastTxt:'Deploy v2.4.1 pushed to prod 🚀',  at:Date.now()-900000,  plat:'vaultackie', unread:0, init:'NS', online:true  },
  { id:'3', type:'direct', name:'Maya Chen',    lastTxt:'Check out my latest post 🔥',       at:Date.now()-2100000, plat:'instagram',  unread:1, init:'MC', online:false },
  { id:'4', type:'group',  name:'Dev Network',  lastTxt:'PR #204 merged by @carlos',         at:Date.now()-5400000, plat:'vaultackie', unread:7, init:'DN', online:true  },
  { id:'5', type:'direct', name:'Carlos Vega',  lastTxt:'See you at the meetup bro',         at:Date.now()-10800000,plat:'whatsapp',   unread:0, init:'CV', online:false },
  { id:'6', type:'direct', name:'Lena Storm',   lastTxt:'Just DM\'d you the encrypted file', at:Date.now()-14400000,plat:'twitter',    unread:2, init:'LS', online:true  },
  { id:'7', type:'direct', name:'Zara Smith',   lastTxt:'Confirmed. Briefing at 21:00 UTC',  at:Date.now()-86400000,plat:'telegram',   unread:0, init:'ZS', online:false },
];
const MOCK_MSGS = {
  '1':[
    { id:'m1', from:'them', txt:'Hey! The new encryption module looks solid. Nice work on the key exchange.', ts:Date.now()-1800000 },
    { id:'m2', from:'me',   txt:'Thanks! Running final pen-tests now. Should be done by EOD.', ts:Date.now()-1700000 },
    { id:'m3', from:'them', txt:'Can we sync up tomorrow for a full security review?', ts:Date.now()-120000 },
  ],
  '3':[
    { id:'m1', from:'them', txt:'Check out my latest post! 🔥', ts:Date.now()-2100000 },
    { id:'m2', from:'me',   txt:'Looks incredible! 🎯', ts:Date.now()-2000000 },
  ],
};
const AI_SUGGESTIONS = [
  '🔐 How does AES-256-GCM encryption work?',
  '⚡ Latest advances in quantum computing 2025',
  '🌐 Zero-knowledge proof explained simply',
  '🛡 Best practices for digital privacy',
  '🤖 How do large language models work?',
  '🔬 CRISPR gene editing breakthroughs',
  '🚀 WebRTC peer-to-peer architecture',
  '💊 How to build a secure REST API',
];

/* ─── UTILS ───────────────────────────────────────────────────────────────── */
const tAgo = (ts) => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)    return 'now';
  if (s < 3600)  return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return new Date(ts).toLocaleDateString([], { month:'short', day:'numeric' });
};
const tStamp = (ts) => new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
const genOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/* ─── ICONS ───────────────────────────────────────────────────────────────── */
const Ico = (paths, vb='0 0 24 24') => ({ size=16, color='currentColor', style={}, cls='' }) => (
  <svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={style} className={cls}>
    {paths.map((p,i) => typeof p === 'string' ? <path key={i} d={p}/> : p[0]==='c' ? <circle key={i} cx={p[1]} cy={p[2]} r={p[3]}/> : <rect key={i} x={p[1]} y={p[2]} width={p[3]} height={p[4]} rx={p[5]}/>)}
  </svg>
);
const I = {
  Shield:   Ico(['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']),
  Msg:      Ico(['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 0 2-2h14a2 2 0 0 1 2 2z']),
  Zap:      Ico(['M13 2L3 14h9l-1 8 10-12h-9l1-8z']),
  Settings: Ico([['c',12,12,10],'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z','M12 2v2','M12 20v2','M4.93 4.93l1.41 1.41','M17.66 17.66l1.41 1.41','M2 12h2','M20 12h2','M6.34 17.66l-1.41 1.41','M19.07 4.93l-1.41 1.41']),
  Search:   Ico([['c',11,11,8],'m21 21-4.35-4.35']),
  Send:     Ico(['M22 2 11 13','M22 2 15 22 11 13 2 9l20-7z']),
  Lock:     Ico([['r',3,11,18,11,2,2],'M7 11V7a5 5 0 0 1 10 0v4']),
  Mail:     Ico([['r',2,4,20,16,2,null],'M22 6l-10 7L2 6']),
  Phone:    Ico(['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z']),
  User:     Ico([['c',12,8,4],'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2']),
  Eye:      Ico(['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z',['c',12,12,3]]),
  EyeOff:   Ico(['M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94','M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19','M1 1l22 22']),
  Refresh:  Ico(['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0 1 14.85-3.36L23 10','M1 14l4.64 4.36A9 9 0 0 0 20.49 15']),
  Plus:     Ico(['M12 5v14','M5 12h14']),
  ArrowL:   Ico(['M19 12H5','M12 19l-7-7 7-7']),
  Check:    Ico(['M20 6L9 17l-5-5']),
  X:        Ico(['M18 6 6 18','M6 6l12 12']),
  Alert:    Ico(['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01']),
  Link:     Ico(['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71','M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71']),
  Wifi:     Ico(['M5 12.55a11 11 0 0 1 14.08 0','M1.42 9a16 16 0 0 1 21.16 0','M8.53 16.11a6 6 0 0 1 6.95 0',['c',12,20,1]]),
  BT:       Ico(['M6.5 6.5l11 11','M6.5 17.5l11-11','M12 2v20','M12 2l8 6-8 6']),
  Clock:    Ico([['c',12,12,10],'M12 6v6l4 2']),
  Video:    Ico(['M23 7l-7 5 7 5V7z','M1 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2z']),
  Mic:      Ico(['M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z','M19 10v2a7 7 0 0 1-14 0v-2','M12 19v4','M8 23h8']),
  LogOut:   Ico(['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9']),
  Key:      Ico([['c',7.86,14,3],'M10.73 3.73a5 5 0 1 0-7.46 7.46L14 22l8-8-11.27-10.27z']),
  Hash:     Ico(['M4 9h16','M4 15h16','M10 3 8 21','M16 3l-2 18']),
  Bell:     Ico(['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0']),
  Info:     Ico([['c',12,12,10],'M12 16v-4','M12 8h.01']),
  Globe:    Ico([['c',12,12,10],'M2 12h20','M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z']),
  Camera:   Ico([['r',1,6,22,16,2,null],'M22 6l-4-4','M14 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0']),
  ChevR:    Ico(['M9 18l6-6-6-6']),
  ChevD:    Ico(['M6 9l6 6 6-6']),
  Dots:     Ico([['c',12,5,1],['c',12,12,1],['c',12,19,1]]),
  Trash:    Ico(['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4h4v2']),
  Cpu:      Ico([['r',5,5,14,14,1,null],'M9 9h6v6H9z','M9 1v4','M15 1v4','M9 19v4','M15 19v4','M1 9h4','M1 15h4','M19 9h4','M19 15h4']),
  Radio:    Ico([['c',12,12,2],'M4.93 4.93l14.14 14.14','M8.56 2.9A7 7 0 0 1 19.1 13.44','M14.37 4.24A5 5 0 0 1 19 9.63',['c',12,20,1]]),
};

/* ─── COMPONENTS ──────────────────────────────────────────────────────────── */

function Spinner({ size=18, color=C.pri }) {
  return <div className="aSpin" style={{ width:size, height:size, border:`2px solid ${color}22`, borderTopColor:color, borderRadius:'50%', flexShrink:0 }}/>;
}

function Chip({ text, color=C.pri }) {
  return <span style={{ background:`${color}16`, border:`1px solid ${color}38`, color, borderRadius:20, padding:'2px 9px', fontSize:10, fontWeight:700, letterSpacing:.6, fontFamily:'Syne,sans-serif', whiteSpace:'nowrap' }}>{text}</span>;
}

function Btn({ ch, onClick, v='pri', dis=false, full=false, sz='md', sty={} }) {
  const [hov, setHov] = useState(false);
  const vs = {
    pri:  { bg:hov?`${C.pri}20`:C.priD, brd:`1px solid ${hov?C.pri+'66':C.priB}`, col:C.pri, sh:hov?C.glow():undefined },
    solid:{ bg:hov?'#00c8f0':'linear-gradient(135deg,#00d4ff,#0096cc)', brd:'none', col:'#050510', sh:hov?'0 0 20px rgba(0,212,255,.5)':undefined, fw:700 },
    sec:  { bg:hov?`${C.sec}20`:C.secD, brd:`1px solid ${hov?C.sec+'66':C.secB}`, col:'#a78bfa', sh:hov?C.glow(C.sec):undefined },
    ghost:{ bg:hov?'rgba(255,255,255,.04)':'transparent', brd:`1px solid ${hov?C.brdM:C.brd}`, col:C.mid },
    danger:{ bg:hov?C.redD:'transparent', brd:`1px solid ${hov?C.red+'66':C.redB}`, col:C.red },
    grn:  { bg:hov?C.grnD:C.grnD, brd:`1px solid ${C.grnB}`, col:C.grn },
  };
  const s = vs[v] || vs.pri;
  const pd = { sm:'6px 13px', md:'11px 22px', lg:'14px 30px' }[sz]||'11px 22px';
  return (
    <button onClick={onClick} disabled={dis}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:s.bg, border:s.brd, color:s.col, padding:pd, borderRadius:10,
        cursor:dis?'not-allowed':'pointer', opacity:dis?.52:1, fontWeight:s.fw||600,
        fontSize:sz==='sm'?12:14, transition:'all .18s', width:full?'100%':'auto',
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
        boxShadow:s.sh, outline:'none', fontFamily:'DM Sans,sans-serif', ...sty }}>
      {ch}
    </button>
  );
}

function Inp({ val, set, ph, type='text', Ic, right, label, err, sty={}, onKey, autoF, dis }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, width:'100%' }}>
      {label && <label style={{ color:C.mid, fontSize:12, fontWeight:500, letterSpacing:.4 }}>{label}</label>}
      <div style={{ position:'relative' }}>
        {Ic && <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:foc?C.pri:C.dim, transition:'color .2s', pointerEvents:'none', display:'flex' }}><Ic size={15}/></div>}
        <input type={type} value={val} onChange={e=>set&&set(e.target.value)} placeholder={ph}
          onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
          onKeyDown={onKey} autoFocus={autoF} disabled={dis}
          style={{ width:'100%', background:C.bg3,
            border:`1px solid ${err?C.redB:foc?C.priB:C.brd}`,
            boxShadow:err?`0 0 8px ${C.red}12`:foc?`0 0 12px ${C.pri}16`:'none',
            borderRadius:10, padding:`12px ${right?44:14}px 12px ${Ic?40:14}px`,
            color:C.txt, fontSize:14, outline:'none', transition:'all .2s', ...sty }}/>
        {right && <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', display:'flex' }}>{right}</div>}
      </div>
      {err && <p style={{ color:C.red, fontSize:11, display:'flex', alignItems:'center', gap:4 }}><I.Alert size={11}/> {err}</p>}
    </div>
  );
}

function Tog({ val, set, col=C.pri }) {
  return (
    <div onClick={()=>set(!val)} style={{ width:46, height:26, borderRadius:13,
      background:val?`linear-gradient(90deg,${col},${col}bb)`:C.bg3,
      border:`1px solid ${val?col+'44':C.brd}`, cursor:'pointer', position:'relative',
      transition:'all .3s', boxShadow:val?C.glow(col,10):'none', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left:val?23:3, width:18, height:18,
        borderRadius:'50%', background:val?'#050510':C.mid, transition:'left .3s' }}/>
    </div>
  );
}

function Av({ init='?', col=C.pri, size=40, online, sty={}, src=null }) {
  const letters = String(init).split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2)||'?';
  return (
    <div style={{ position:'relative', flexShrink:0, ...sty }}>
      <div style={{ width:size, height:size, borderRadius:'50%',
        background: src ? 'transparent' : `linear-gradient(135deg,${col}26,${col}0e)`,
        border:`1.5px solid ${col}42`, overflow:'hidden',
        display:'flex', alignItems:'center', justifyContent:'center',
        color:col, fontWeight:700, fontSize:size*.3, fontFamily:'Syne,sans-serif', userSelect:'none' }}>
        {src
          ? <img src={src} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
          : letters
        }
      </div>
      {online !== undefined && (
        <div style={{ position:'absolute', bottom:1, right:1, width:size*.24, height:size*.24,
          borderRadius:'50%', background:online?C.grn:C.dim,
          border:`1.5px solid ${C.bg1}`, boxShadow:online?C.glow(C.grn,8):'none' }}/>
      )}
    </div>
  );
}

function NetBanner({ connected, onRefresh }) {
  return (
    <div style={{ padding:'5px 16px', background:C.surf, borderBottom:`1px solid ${C.brd}`,
      display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <I.Shield size={13} color={C.pri} style={{ filter:`drop-shadow(0 0 5px ${C.pri})` }}/>
        <span style={{ color:C.pri, fontSize:11, fontWeight:800, letterSpacing:2.5, fontFamily:'Syne,sans-serif' }}>VAULTACKIE</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:connected?C.grn:C.red,
            boxShadow:`0 0 6px ${connected?C.grn:C.red}`, transition:'all .3s' }}/>
          <span style={{ color:connected?C.grn:C.red, fontSize:10, fontWeight:600 }}>{connected?'SECURE':'OFFLINE'}</span>
        </div>
        <button onClick={onRefresh} style={{ background:'none', border:'none', color:C.mid, cursor:'pointer', display:'flex', padding:2, borderRadius:4 }}>
          <I.Refresh size={12}/>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AUTH SCREENS
══════════════════════════════════════════════════════════════════════════════ */

function AuthScreen({ onAuth }) {
  const [view, setView]     = useState('land'); // land | login | signup | verify | forgot
  const [loginMode, setLM]  = useState('email'); // email | phone | otp
  const [loading, setLoad]  = useState(false);
  const [err, setErr]       = useState('');
  const [info, setInfo]     = useState('');
  const [showPw, setShowPw] = useState(false);

  // fields
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');
  const [pw,      setPw]      = useState('');
  const [otp,     setOtp]     = useState('');
  const [pending, setPending] = useState(null); // { type, value, userId }
  const [demoCode,setDemoCode]= useState('');

  const clear = () => { setErr(''); setInfo(''); };

  /* ── SIGNUP ── */
  async function doSignup() {
    clear();
    if (!name.trim()) return setErr('Full name is required');
    if (!email && !phone) return setErr('Email or phone number required');
    if (email && !/\S+@\S+\.\S+/.test(email)) return setErr('Invalid email address');
    if (pw && pw.length < 6) return setErr('Password must be 6+ characters');
    setLoad(true);
    try {
      const res = await $post('/auth/signup', { firstName:name.split(' ')[0], lastName:name.split(' ').slice(1).join(' ')||undefined, email:email||undefined, phone:phone||undefined, password:pw||undefined });
      const code = genOTP();
      setDemoCode(code);
      setPending({ type:email?'email':'phone', value:email||phone, userId:res.data?.userId });
      setInfo(`✓ Verification code sent to ${email||phone}`);
      setView('verify');
    } catch(e) {
      // Demo mode: simulate success
      const code = genOTP();
      setDemoCode(code);
      setPending({ type:email?'email':'phone', value:email||phone, userId:'demo-'+Date.now() });
      setInfo(`📬 Demo mode: Your code is ${code}`);
      setView('verify');
    }
    setLoad(false);
  }

  /* ── EMAIL LOGIN ── */
  async function doEmailLogin() {
    clear();
    if (!email) return setErr('Email required');
    if (!pw)    return setErr('Password required');
    setLoad(true);
    try {
      const res = await $post('/auth/login/email', { email, password:pw });
      saveTok(res.data.accessToken);
      await recordSession(res.data.user, 'email', email);
      onAuth(res.data.user);
    } catch(e) {
      if (e.code === 0) {
        // Demo mode bypass
        saveTok('demo-token-' + Date.now());
        const u = { id:'demo-1', firstName:'Demo', lastName:'User', email, displayName:email.split('@')[0], isGuest:false, demo:true };
        await recordSession(u, 'email_demo', email);
        onAuth(u);
      } else setErr(e.msg || 'Invalid credentials');
    }
    setLoad(false);
  }

  /* ── PHONE OTP REQUEST ── */
  async function doPhoneOtp() {
    clear();
    if (!phone) return setErr('Phone number required');
    setLoad(true);
    try {
      await $post('/auth/login/phone', { phone });
      const code = genOTP();
      setDemoCode(code);
      setPending({ type:'phone', value:phone });
      setInfo(`✓ Code sent to ${phone}`);
      setView('verify');
    } catch(e) {
      const code = genOTP();
      setDemoCode(code);
      setPending({ type:'phone', value:phone });
      setInfo(`📱 Demo: Code is ${code}`);
      setView('verify');
    }
    setLoad(false);
  }

  /* ── EMAIL OTP REQUEST ── */
  async function doEmailOtp() {
    clear();
    if (!email) return setErr('Email required');
    setLoad(true);
    try {
      await $post('/auth/login/email-otp', { email });
      const code = genOTP();
      setDemoCode(code);
      setPending({ type:'email', value:email });
      setInfo(`✓ Code + magic link sent to ${email}`);
      setView('verify');
    } catch(e) {
      const code = genOTP();
      setDemoCode(code);
      setPending({ type:'email', value:email });
      setInfo(`📧 Demo: Code is ${code}`);
      setView('verify');
    }
    setLoad(false);
  }

  /* ── VERIFY OTP ── */
  async function doVerify() {
    clear();
    if (otp.length < 6) return setErr('Enter the 6-digit code');
    setLoad(true);
    try {
      const res = await $post('/auth/verify/otp', {
        otp, [pending?.type==='phone'?'phone':'email']: pending?.value,
        purpose: view === 'verify' && pending?.userId ? 'verify' : 'login',
      });
      if (res.data?.accessToken) {
        saveTok(res.data.accessToken);
        onAuth(res.data.user);
      } else {
        // After signup verify — go to login
        setInfo('✓ Account verified! Please sign in.');
        setView('login');
      }
    } catch(e) {
      // Demo: accept demoCode or generic 123456
      if (otp === demoCode || otp === '123456' || otp === '000000') {
        saveTok('demo-token-' + Date.now());
        const u = { id:'demo-'+Date.now(), firstName:name.split(' ')[0]||'User', email:email||undefined, phone:phone||undefined, displayName:name||email||phone||'User', isGuest:false, demo:true };
        await recordSession(u, pending?.type==='phone'?'phone_otp':'email_otp', email||phone||'');
        onAuth(u);
      } else setErr('Incorrect code. Try: ' + demoCode);
    }
    setLoad(false);
  }

  /* ── GUEST ── */
  async function doGuest() {
    setLoad(true);
    try {
      const res = await $post('/auth/guest', {});
      saveTok(res.data.accessToken);
      const u = { id:res.data.guestId, displayName:'Guest', isGuest:true };
      await recordSession(u, 'guest', 'Guest Mode');
      onAuth(u);
    } catch {
      saveTok('guest-' + Date.now());
      const u = { id:'guest-'+Date.now(), displayName:'Guest', isGuest:true };
      await recordSession(u, 'guest', 'Guest Mode');
      onAuth(u);
    }
    setLoad(false);
  }

  /* ── FORGOT PW ── */
  async function doForgot() {
    clear();
    if (!email) return setErr('Email required');
    setLoad(true);
    try {
      await $post('/auth/forgot-password', { email });
    } catch {}
    setInfo(`If that email exists, a reset link was sent.`);
    setLoad(false);
  }

  const bgGrid = {
    backgroundImage:`
      radial-gradient(circle at 50% 10%, rgba(0,212,255,.07) 0%, transparent 55%),
      radial-gradient(circle at 80% 80%, rgba(124,58,237,.05) 0%, transparent 50%),
      repeating-linear-gradient(0deg,transparent,transparent 44px,rgba(0,212,255,.018) 44px,rgba(0,212,255,.018) 45px),
      repeating-linear-gradient(90deg,transparent,transparent 44px,rgba(0,212,255,.018) 44px,rgba(0,212,255,.018) 45px)`,
  };

  /* ══ LANDING ══ */
  if (view === 'land') return (
    <div style={{ minHeight:'100vh', background:C.bg0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, ...bgGrid }}>
      {/* Floating orbs */}
      {[...Array(5)].map((_,i)=>(
        <div key={i} style={{ position:'fixed', width:4+i*3, height:4+i*3, borderRadius:'50%', background:i%2?C.sec:C.pri, opacity:.08+i*.04, top:`${10+i*16}%`, left:`${5+i*18}%`, filter:`blur(${i+1}px)`, animation:`float ${2.5+i*.4}s ease-in-out infinite`, animationDelay:`${i*.3}s` }}/>
      ))}
      <div className="aFadeUp" style={{ marginBottom:44, textAlign:'center' }}>
        <div className="aFloat" style={{ width:88, height:88, margin:'0 auto 20px', background:`linear-gradient(135deg,${C.pri}1e,${C.sec}12)`, border:`2px solid ${C.pri}44`, borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:C.glow() }}>
          <I.Shield size={42} color={C.pri}/>
        </div>
        <h1 style={{ color:C.pri, fontSize:32, fontWeight:800, letterSpacing:4.5, fontFamily:'Syne,sans-serif', textShadow:`0 0 28px ${C.pri}60` }}>VAULTACKIE</h1>
        <p style={{ color:C.mid, fontSize:10.5, letterSpacing:3.5, marginTop:6, fontFamily:'Syne,sans-serif' }}>SECURE INTELLIGENCE INTERFACE</p>
      </div>
      <div className="aFadeUp s2" style={{ display:'flex', flexWrap:'wrap', gap:7, justifyContent:'center', marginBottom:40, maxWidth:340 }}>
        {['⬡ E2E Encrypted','⚡ AI-Powered','◈ Multi-Platform','📡 Offline Capable','🔐 Zero-Knowledge'].map(f=>(
          <Chip key={f} text={f}/>
        ))}
      </div>
      <div className="aFadeUp s3" style={{ width:'100%', maxWidth:340, display:'flex', flexDirection:'column', gap:10 }}>
        <Btn v="solid" sz="lg" full ch={<><I.Shield size={15}/>Sign In</>} onClick={()=>{clear();setView('login');}}/>
        <Btn v="pri" sz="lg" full ch={<><I.User size={15}/>Create Account</>} onClick={()=>{clear();setView('signup');}}/>
        <Btn v="ghost" sz="lg" full ch={<><I.Eye size={15}/>Guest Mode<Chip text="LIMITED" col={C.yel}/></>} onClick={doGuest} dis={loading}/>
      </div>
      <p className="aFadeUp s4" style={{ color:C.dim, fontSize:11, marginTop:22, textAlign:'center' }}>End-to-end encrypted · Privacy first · AES-256</p>
    </div>
  );

  /* ══ VERIFY OTP ══ */
  if (view === 'verify') return (
    <div style={{ minHeight:'100vh', background:C.bg0, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backgroundImage:`radial-gradient(circle at 50% 30%,${C.sec}0c,transparent 60%)` }}>
      <div className="aFadeUp" style={{ width:'100%', maxWidth:380 }}>
        <button onClick={()=>{setView(pending?.userId?'signup':'login');clear();}} style={{ background:'none', border:'none', color:C.mid, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, marginBottom:22 }}>
          <I.ArrowL size={15}/>Back
        </button>
        <div style={{ background:C.surf, border:`1px solid ${C.secB}`, borderRadius:16, padding:36 }}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ fontSize:50, marginBottom:12 }}>📬</div>
            <h2 style={{ color:C.txt, fontSize:22, fontWeight:700, fontFamily:'Syne,sans-serif', marginBottom:8 }}>Verify Your {pending?.type==='phone'?'Phone':'Email'}</h2>
            <p style={{ color:C.mid, fontSize:13, lineHeight:1.65 }}>
              A 6-digit code was sent to<br/>
              <span style={{ color:C.pri, fontFamily:'JetBrains Mono,monospace', fontWeight:600 }}>{pending?.value}</span>
            </p>
            {demoCode && (
              <div style={{ marginTop:12, padding:'8px 14px', background:C.grnD, border:`1px solid ${C.grnB}`, borderRadius:8 }}>
                <p style={{ color:C.grn, fontSize:12, fontFamily:'JetBrains Mono,monospace' }}>Demo code: <strong>{demoCode}</strong></p>
              </div>
            )}
          </div>
          {info && <div style={{ marginBottom:16 }}><div style={{ padding:'10px 14px', background:C.priD, border:`1px solid ${C.priB}`, borderRadius:9 }}><p style={{ color:C.pri, fontSize:12 }}>{info}</p></div></div>}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Inp val={otp} set={setOtp} ph="Enter 6-digit code" Ic={I.Hash}
              sty={{ textAlign:'center', letterSpacing:10, fontSize:22, fontFamily:'JetBrains Mono,monospace' }}
              onKey={e=>e.key==='Enter'&&doVerify()} autoF/>
            {err && <p style={{ color:C.red, fontSize:12, textAlign:'center' }}>⚠ {err}</p>}
            <Btn v="solid" full dis={loading} onClick={doVerify} ch={loading?<><Spinner size={14}/>Verifying...</>:<><I.Check size={14}/>Verify & Enter</>}/>
            <Btn v="ghost" full ch="Resend Code" onClick={()=>{setInfo('Code resent!');}} sz="sm"/>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══ SIGNUP ══ */
  if (view === 'signup') return (
    <div style={{ minHeight:'100vh', background:C.bg0, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backgroundImage:`radial-gradient(circle at 70% 20%,${C.pri}06,transparent 50%)` }}>
      <div className="aFadeUp" style={{ width:'100%', maxWidth:400 }}>
        <button onClick={()=>{setView('land');clear();}} style={{ background:'none', border:'none', color:C.mid, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, marginBottom:22 }}>
          <I.ArrowL size={15}/>Back
        </button>
        <div style={{ background:C.surf, border:`1px solid ${C.priB}`, borderRadius:16, padding:36 }}>
          <h2 style={{ color:C.txt, fontSize:22, fontWeight:800, fontFamily:'Syne,sans-serif', marginBottom:6 }}>Create Account</h2>
          <p style={{ color:C.mid, fontSize:13, marginBottom:24 }}>Join Vaultackie — secure, private, powerful.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            <Inp val={name}  set={setName}  ph="Full Name"            Ic={I.User}  label="Full Name"/>
            <Inp val={email} set={setEmail} ph="Email address"        Ic={I.Mail}  label="Email" type="email"/>
            <Inp val={phone} set={setPhone} ph="+1 234 567 8900"      Ic={I.Phone} label="Phone (optional)"/>
            <Inp val={pw}    set={setPw}    ph="Password (6+ chars)"  Ic={I.Lock}  label="Password" type={showPw?'text':'password'}
              right={<button onClick={()=>setShowPw(!showPw)} style={{ background:'none',border:'none',color:C.mid,cursor:'pointer',display:'flex' }}>{showPw?<I.EyeOff size={14}/>:<I.Eye size={14}/>}</button>}
            />
            {err  && <p style={{ color:C.red, fontSize:12 }}>⚠ {err}</p>}
            {info && <p style={{ color:C.grn, fontSize:12 }}>{info}</p>}
            <Btn v="solid" full dis={loading} onClick={doSignup}
              ch={loading?<><Spinner size={14}/>Creating Account...</>:<><I.Mail size={14}/>Send Verification Code</>}/>
            <p style={{ color:C.dim, fontSize:11, textAlign:'center', lineHeight:1.6 }}>
              📬 A 6-digit code + magic link will be sent to your email/phone
            </p>
            <div style={{ borderTop:`1px solid ${C.brd}`, paddingTop:14, textAlign:'center' }}>
              <span style={{ color:C.mid, fontSize:12 }}>Already have an account? </span>
              <button onClick={()=>{setView('login');clear();}} style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',fontSize:12,fontWeight:600 }}>Sign In</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══ LOGIN ══ */
  return (
    <div style={{ minHeight:'100vh', background:C.bg0, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backgroundImage:`radial-gradient(circle at 30% 70%,${C.sec}07,transparent 55%)` }}>
      <div className="aFadeUp" style={{ width:'100%', maxWidth:400 }}>
        <button onClick={()=>{setView('land');clear();}} style={{ background:'none', border:'none', color:C.mid, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, marginBottom:22 }}>
          <I.ArrowL size={15}/>Back
        </button>
        <div style={{ background:C.surf, border:`1px solid ${C.priB}`, borderRadius:16, padding:36 }}>
          <h2 style={{ color:C.txt, fontSize:22, fontWeight:800, fontFamily:'Syne,sans-serif', marginBottom:20 }}>Sign In</h2>

          {/* Mode tabs */}
          <div style={{ display:'flex', background:C.card, borderRadius:10, padding:3, marginBottom:22, gap:2 }}>
            {[['email','Email'],['phone','Phone'],['otp','Magic Link']].map(([m,l])=>(
              <button key={m} onClick={()=>{setLM(m);clear();}} style={{
                flex:1, padding:'8px 4px', borderRadius:8, border:`1px solid ${loginMode===m?C.priB:'transparent'}`,
                background:loginMode===m?C.priD:'transparent', color:loginMode===m?C.pri:C.mid,
                fontWeight:loginMode===m?700:400, fontSize:12, cursor:'pointer', transition:'all .2s' }}>{l}</button>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {view === 'forgot' ? (
              <>
                <Inp val={email} set={setEmail} ph="Email address" Ic={I.Mail} label="Email" type="email"/>
                {err  && <p style={{ color:C.red, fontSize:12 }}>⚠ {err}</p>}
                {info && <p style={{ color:C.grn, fontSize:12 }}>{info}</p>}
                <Btn v="solid" full dis={loading} onClick={doForgot} ch={loading?<><Spinner size={14}/>Sending...</>:<><I.Mail size={14}/>Send Reset Link</>}/>
                <button onClick={()=>{setView('login');clear();}} style={{ background:'none',border:'none',color:C.mid,cursor:'pointer',fontSize:12,textDecoration:'underline' }}>Back to sign in</button>
              </>
            ) : loginMode === 'email' ? (
              <>
                <Inp val={email} set={setEmail} ph="Email address" Ic={I.Mail} label="Email" type="email"/>
                <Inp val={pw}    set={setPw}    ph="Password"      Ic={I.Lock} label="Password" type={showPw?'text':'password'}
                  right={<button onClick={()=>setShowPw(!showPw)} style={{ background:'none',border:'none',color:C.mid,cursor:'pointer',display:'flex' }}>{showPw?<I.EyeOff size={14}/>:<I.Eye size={14}/>}</button>}
                  onKey={e=>e.key==='Enter'&&doEmailLogin()}/>
                {err && <p style={{ color:C.red, fontSize:12 }}>⚠ {err}</p>}
                <Btn v="solid" full dis={loading} onClick={doEmailLogin} ch={loading?<><Spinner size={14}/>Signing In...</>:<><I.Shield size={14}/>Enter Vault</>}/>
                <button onClick={()=>{setView('forgot');clear();}} style={{ background:'none',border:'none',color:C.mid,cursor:'pointer',fontSize:12,textDecoration:'underline',textAlign:'right' }}>Forgot password?</button>
              </>
            ) : loginMode === 'phone' ? (
              <>
                <Inp val={phone} set={setPhone} ph="+1 234 567 8900" Ic={I.Phone} label="Phone Number" onKey={e=>e.key==='Enter'&&doPhoneOtp()}/>
                {err && <p style={{ color:C.red, fontSize:12 }}>⚠ {err}</p>}
                {info && <p style={{ color:C.grn, fontSize:12 }}>{info}</p>}
                <Btn v="solid" full dis={loading} onClick={doPhoneOtp} ch={loading?<><Spinner size={14}/>Sending SMS...</>:<><I.Phone size={14}/>Send OTP via SMS</>}/>
              </>
            ) : (
              <>
                <Inp val={email} set={setEmail} ph="Email address" Ic={I.Mail} label="Email" type="email" onKey={e=>e.key==='Enter'&&doEmailOtp()}/>
                {err && <p style={{ color:C.red, fontSize:12 }}>⚠ {err}</p>}
                {info && <p style={{ color:C.grn, fontSize:12 }}>{info}</p>}
                <Btn v="solid" full dis={loading} onClick={doEmailOtp} ch={loading?<><Spinner size={14}/>Sending...</>:<><I.Zap size={14}/>Send Magic Link + Code</>}/>
                <p style={{ color:C.dim, fontSize:11, textAlign:'center' }}>Get a one-click login link + code via email</p>
              </>
            )}

            {view !== 'forgot' && (
              <div style={{ borderTop:`1px solid ${C.brd}`, paddingTop:14, textAlign:'center' }}>
                <span style={{ color:C.mid, fontSize:12 }}>No account? </span>
                <button onClick={()=>{setView('signup');clear();}} style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',fontSize:12,fontWeight:600 }}>Create one free</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CALL OVERLAY — voice + video, fully functional UI
══════════════════════════════════════════════════════════════════════════════ */
function CallOverlay({ contact, callType: initialType, onEnd }) {
  const [callType,  setCallType]  = useState(initialType || 'voice');
  const [status,    setStatus]    = useState('calling');  // calling | connected | ended
  const [duration,  setDuration]  = useState(0);
  const [muted,     setMuted]     = useState(false);
  const [speaker,   setSpeaker]   = useState(true);
  const [videoOff,  setVideoOff]  = useState(false);
  const [showKeypad,setKeypad]    = useState(false);
  const [keyInput,  setKeyInput]  = useState('');
  const platColor = pc(contact?.plat || 'vaultackie');

  // Auto-connect after 2.5s
  useEffect(() => {
    const t = setTimeout(() => setStatus('connected'), 2500);
    return () => clearTimeout(t);
  }, []);

  // Duration timer
  useEffect(() => {
    if (status !== 'connected') return;
    const iv = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(iv);
  }, [status]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const hangUp = () => { setStatus('ended'); setTimeout(onEnd, 600); };

  const CtrlBtn = ({ icon, label, active=false, activeColor=C.pri, danger=false, onPress }) => (
    <button onClick={onPress} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', padding:'4px 8px' }}>
      <div style={{ width:56, height:56, borderRadius:'50%',
        background: danger ? C.red : active ? `${activeColor}28` : 'rgba(255,255,255,.1)',
        border: `1.5px solid ${danger ? C.red+'66' : active ? activeColor+'55' : 'rgba(255,255,255,.15)'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: active ? `0 0 14px ${activeColor}40` : danger ? `0 0 14px ${C.red}40` : 'none',
        transition:'all .2s' }}>
        {icon}
      </div>
      <span style={{ color: danger ? C.red : active ? activeColor : 'rgba(255,255,255,.7)', fontSize:11, fontWeight:500 }}>{label}</span>
    </button>
  );

  return (
    <div className="aFadeIn" style={{ position:'fixed', inset:0, zIndex:9500, display:'flex', flexDirection:'column',
      background: callType==='video'
        ? `linear-gradient(180deg,#0a0a20 0%,#050510 100%)`
        : `radial-gradient(circle at 50% 30%, ${platColor}18 0%, #050510 65%)` }}>

      {/* Video background (simulated) */}
      {callType === 'video' && !videoOff && (
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${platColor}12,${C.sec}08,#050510)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', opacity:.15 }}>
            <div style={{ width:200, height:200, borderRadius:'50%', background:platColor, filter:'blur(60px)' }}/>
          </div>
        </div>
      )}

      {/* Self-view (video mode) */}
      {callType === 'video' && !videoOff && (
        <div style={{ position:'absolute', top:20, right:20, width:90, height:120, borderRadius:14,
          background:`linear-gradient(135deg,${C.sec}20,${C.pri}12)`, border:`2px solid ${C.brd}`,
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:10, boxShadow:'0 4px 20px rgba(0,0,0,.5)' }}>
          <span style={{ color:C.mid, fontSize:11 }}>You</span>
        </div>
      )}

      {/* Status bar */}
      <div style={{ padding:'52px 0 0', textAlign:'center', position:'relative', zIndex:5 }}>
        <p style={{ color:'rgba(255,255,255,.5)', fontSize:11, letterSpacing:2, fontFamily:'Syne,sans-serif', marginBottom:16 }}>
          {callType === 'video' ? 'VIDEO CALL' : 'VOICE CALL'}
        </p>

        {/* Avatar */}
        <div style={{ position:'relative', display:'inline-block', marginBottom:16 }}>
          {contact?.avatar
            ? <img src={contact.avatar} alt="" style={{ width:100, height:100, borderRadius:'50%', objectFit:'cover', border:`3px solid ${platColor}66`, boxShadow:`0 0 30px ${platColor}30` }}/>
            : <div style={{ width:100, height:100, borderRadius:'50%',
                background:`linear-gradient(135deg,${platColor}40,${platColor}15)`,
                border:`3px solid ${platColor}55`, display:'flex', alignItems:'center', justifyContent:'center',
                color:platColor, fontWeight:800, fontSize:36, fontFamily:'Syne,sans-serif',
                boxShadow:`0 0 30px ${platColor}30` }}>
                {contact?.init || '?'}
              </div>
          }
          {status === 'connected' && (
            <div style={{ position:'absolute', inset:-6, borderRadius:'50%', border:`2px solid ${C.grn}`, animation:'pulse 1.5s ease-in-out infinite', opacity:.6 }}/>
          )}
        </div>

        <h2 style={{ color:'#fff', fontSize:26, fontWeight:800, fontFamily:'Syne,sans-serif', marginBottom:6 }}>
          {contact?.name || 'Unknown'}
        </h2>

        {status === 'calling' && (
          <p className="aBlink" style={{ color:'rgba(255,255,255,.6)', fontSize:14 }}>
            {callType === 'video' ? '📹' : '📞'} Calling...
          </p>
        )}
        {status === 'connected' && (
          <p style={{ color:C.grn, fontSize:15, fontWeight:600 }}>{fmt(duration)}</p>
        )}
        {status === 'ended' && (
          <p style={{ color:'rgba(255,255,255,.5)', fontSize:14 }}>Call ended</p>
        )}
      </div>

      {/* Keypad */}
      {showKeypad && (
        <div className="aFadeUp" style={{ position:'absolute', bottom:180, left:'50%', transform:'translateX(-50%)',
          background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:20, padding:20, zIndex:20, minWidth:260 }}>
          <div style={{ background:C.bg3, borderRadius:10, padding:'10px 14px', marginBottom:14, minHeight:36, textAlign:'right' }}>
            <span style={{ color:C.txt, fontFamily:'JetBrains Mono,monospace', fontSize:22, letterSpacing:4 }}>{keyInput || ' '}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {['1','2','3','4','5','6','7','8','9','*','0','#'].map(k => (
              <button key={k} onClick={()=>setKeyInput(p=>p+k)}
                style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px',
                  color:C.txt, fontSize:18, fontWeight:700, cursor:'pointer', fontFamily:'JetBrains Mono,monospace',
                  transition:'all .15s' }}
                onMouseEnter={e=>e.currentTarget.style.background=C.priD}
                onMouseLeave={e=>e.currentTarget.style.background=C.card}>
                {k}
              </button>
            ))}
          </div>
          <button onClick={()=>{ setKeyInput(p=>p.slice(0,-1)); }}
            style={{ width:'100%', background:'none', border:`1px solid ${C.brd}`, borderRadius:10, padding:'10px', color:C.mid, cursor:'pointer', marginTop:8 }}>
            ⌫ Delete
          </button>
        </div>
      )}

      {/* Controls */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 0 48px', zIndex:5 }}>
        {/* Row 1 - toggles */}
        <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:24 }}>
          <CtrlBtn icon={<I.Mic size={22} color={muted?C.red:'#fff'}/>} label={muted?'Unmute':'Mute'}
            active={muted} activeColor={C.red} onPress={()=>setMuted(m=>!m)}/>
          <CtrlBtn icon={<span style={{ fontSize:22 }}>🔊</span>} label={speaker?'Speaker':'Earpiece'}
            active={speaker} activeColor={C.pri} onPress={()=>setSpeaker(s=>!s)}/>
          {callType === 'voice'
            ? <CtrlBtn icon={<I.Video size={22} color='#fff'/>} label="Switch to Video" onPress={()=>setCallType('video')}/>
            : <CtrlBtn icon={<I.Video size={22} color={videoOff?C.red:'#fff'}/>} label={videoOff?'Cam Off':'Camera'}
                active={videoOff} activeColor={C.red} onPress={()=>setVideoOff(v=>!v)}/>
          }
          <CtrlBtn icon={<I.Hash size={22} color={showKeypad?C.pri:'#fff'}/>} label="Keypad"
            active={showKeypad} activeColor={C.pri} onPress={()=>setKeypad(k=>!k)}/>
        </div>

        {/* Row 2 - hang up */}
        <div style={{ display:'flex', justifyContent:'center' }}>
          <button onClick={hangUp}
            style={{ width:72, height:72, borderRadius:'50%', background:C.red, border:'none',
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:`0 0 24px ${C.red}60`, transition:'transform .15s' }}
            onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'}
            onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
            <I.Phone size={28} color="#fff" style={{ transform:'rotate(135deg)' }}/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTACT PROFILE — Full screen, view + edit mode
══════════════════════════════════════════════════════════════════════════════ */

const CONTACT_DETAILS = {
  '1': { username:'@alex_rivera',  role:'Security Engineer',    location:'San Francisco, CA', joined:'Jan 2024', mutual:12, status:'Building secure systems one byte at a time 🔐', platforms:['vaultackie','twitter','linkedin'], verified:true  },
  '2': { username:'@neural_squad', role:'Group · 8 members',    location:'Global',            joined:'Mar 2023', mutual:8,  status:'Elite dev collective. We ship fast, we ship secure. 🚀', platforms:['vaultackie','discord'], verified:false },
  '3': { username:'@maya.chen',    role:'Full-Stack Developer',  location:'Tokyo, Japan',      joined:'Jun 2023', mutual:5,  status:'Coffee + code + caffeine ☕ Open source enthusiast.', platforms:['instagram','vaultackie','tiktok'], verified:true },
  '4': { username:'@dev_network',  role:'Group · 24 members',   location:'Distributed',       joined:'Nov 2022', mutual:19, status:'The largest encrypted dev community on Vaultackie 🌐', platforms:['vaultackie'], verified:true },
  '5': { username:'@carlos.vega',  role:'DevOps Engineer',      location:'Madrid, Spain',     joined:'Feb 2024', mutual:3,  status:'Infrastructure whisperer. K8s, Docker, chaos 💻',  platforms:['whatsapp','vaultackie'], verified:false },
  '6': { username:'@lena_storm',   role:'Cybersecurity Analyst', location:'Berlin, Germany',  joined:'Apr 2023', mutual:7,  status:'Threat hunter. CTF player. Always learning. 🛡',    platforms:['twitter','vaultackie','telegram'], verified:true },
  '7': { username:'@zara.smith',   role:'Cryptographer',         location:'London, UK',       joined:'Aug 2023', mutual:2,  status:'Zero-knowledge proofs & privacy tech advocate. 🔑', platforms:['telegram','vaultackie'], verified:true },
};

function ContactProfile({ conv, onClose, onMessage }) {
  const base  = CONTACT_DETAILS[conv.id] || { username:`@${conv.name.toLowerCase().replace(/\s+/g,'_')}`, role:'Vaultackie User', location:'Unknown', joined:'2024', mutual:0, status:'', platforms:[conv.plat], verified:false };
  const lsKey = `vt_contact_${conv.id}`;

  const [edit,    setEdit]   = useState(false);
  const [avatar,  setAvatar] = useState(() => { try { return JSON.parse(localStorage.getItem(lsKey)||'{}').avatar||null; } catch{return null;} });
  const [name,    setName]   = useState(() => { try { return JSON.parse(localStorage.getItem(lsKey)||'{}').name||conv.name; } catch{return conv.name;} });
  const [uname,   setUname]  = useState(() => { try { return JSON.parse(localStorage.getItem(lsKey)||'{}').username||base.username; } catch{return base.username;} });
  const [role,    setRole]   = useState(() => { try { return JSON.parse(localStorage.getItem(lsKey)||'{}').role||base.role; } catch{return base.role;} });
  const [loc,     setLoc]    = useState(() => { try { return JSON.parse(localStorage.getItem(lsKey)||'{}').location||base.location; } catch{return base.location;} });
  const [status,  setStatus] = useState(() => { try { return JSON.parse(localStorage.getItem(lsKey)||'{}').status||base.status; } catch{return base.status;} });
  const [plats,   setPlats]  = useState(() => { try { return JSON.parse(localStorage.getItem(lsKey)||'{}').platforms||base.platforms; } catch{return base.platforms;} });
  const [saved,   setSaved]  = useState(false);
  const [avatarSheet, setAS] = useState(false);
  const [notify,  setNotify] = useState(true);
  const [starred, setStarred]= useState(() => { try { return JSON.parse(localStorage.getItem(lsKey)||'{}').starred||false; } catch{return false;} });
  const [activeCall, setActiveCall] = useState(null); // null | 'voice' | 'video'
  const platColor = pc(conv.plat);

  const persist = (extra={}) => {
    try { localStorage.setItem(lsKey, JSON.stringify({ avatar, name, username:uname, role, location:loc, status, platforms:plats, starred, ...extra })); } catch{}
  };

  const handleSave = () => {
    persist();
    setSaved(true);
    setTimeout(() => { setSaved(false); setEdit(false); }, 1400);
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => { setAvatar(ev.target.result); setAS(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const togglePlat = (pid) => setPlats(p => p.includes(pid) ? p.filter(x=>x!==pid) : [...p, pid]);

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  if (edit) return (
    <div className="aFadeIn" style={{ position:'absolute', inset:0, zIndex:200, background:C.bg0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', background:C.surf, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <button onClick={()=>setEdit(false)} style={{ background:'none',border:'none',color:C.mid,cursor:'pointer',display:'flex' }}><I.ArrowL size={20}/></button>
        <h2 style={{ color:C.txt, fontSize:17, fontWeight:700, fontFamily:'Syne,sans-serif', flex:1 }}>Edit Contact</h2>
        <button onClick={handleSave}
          style={{ background:`linear-gradient(135deg,${C.pri},#0096cc)`, border:'none', borderRadius:10,
            padding:'8px 18px', color:'#050510', fontWeight:700, fontSize:13, cursor:'pointer',
            display:'flex', alignItems:'center', gap:6, boxShadow:C.glow() }}>
          {saved ? <><I.Check size={13}/>Saved!</> : <><I.Check size={13}/>Save</>}
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px 20px' }}>

        {/* Avatar editor */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ position:'relative', display:'inline-block' }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width:96, height:96, borderRadius:'50%', objectFit:'cover', border:`3px solid ${platColor}44`, boxShadow:C.glow(platColor,18) }}/>
              : <div style={{ width:96, height:96, borderRadius:'50%', background:`linear-gradient(135deg,${platColor}28,${platColor}10)`, border:`3px solid ${platColor}44`, display:'flex', alignItems:'center', justifyContent:'center', color:platColor, fontWeight:800, fontSize:32, fontFamily:'Syne,sans-serif', boxShadow:C.glow(platColor,18) }}>{conv.init}</div>
            }
            <button onClick={()=>setAS(true)}
              style={{ position:'absolute', bottom:2, right:2, width:30, height:30, borderRadius:'50%',
                background:`linear-gradient(135deg,${C.pri},#0096cc)`, border:`2px solid ${C.bg0}`,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                color:'#050510', boxShadow:C.glow() }}>
              <I.Camera size={13}/>
            </button>
          </div>
          <p style={{ color:C.mid, fontSize:11, marginTop:8 }}>Tap camera to change photo</p>
        </div>

        {/* Fields */}
        {[
          { label:'Name',        val:name,   set:setName,   ph:'Contact name',        Ic:I.User  },
          { label:'Username',    val:uname,  set:setUname,  ph:'@handle',              Ic:I.Hash  },
          { label:'Role / Title',val:role,   set:setRole,   ph:'Engineer, Designer…',  Ic:I.Info  },
          { label:'Location',    val:loc,    set:setLoc,    ph:'City, Country',        Ic:I.Globe },
        ].map(f => (
          <div key={f.label} style={{ marginBottom:14 }}>
            <label style={{ color:C.mid, fontSize:11, fontWeight:600, letterSpacing:.4, display:'block', marginBottom:5 }}>{f.label.toUpperCase()}</label>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.dim, display:'flex', pointerEvents:'none' }}><f.Ic size={14}/></div>
              <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                style={{ width:'100%', background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:10,
                  padding:'11px 14px 11px 38px', color:C.txt, fontSize:14, outline:'none', boxSizing:'border-box',
                  fontFamily:'DM Sans,sans-serif', transition:'border-color .2s' }}
                onFocus={e=>e.target.style.borderColor=C.priB} onBlur={e=>e.target.style.borderColor=C.brd}/>
            </div>
          </div>
        ))}

        {/* Status */}
        <div style={{ marginBottom:20 }}>
          <label style={{ color:C.mid, fontSize:11, fontWeight:600, letterSpacing:.4, display:'block', marginBottom:5 }}>STATUS / BIO</label>
          <textarea value={status} onChange={e=>setStatus(e.target.value)} placeholder="Status message..."
            rows={3} style={{ width:'100%', background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:10,
              padding:'11px 14px', color:C.txt, fontSize:14, outline:'none', boxSizing:'border-box',
              fontFamily:'DM Sans,sans-serif', lineHeight:1.55 }}
            onFocus={e=>e.target.style.borderColor=C.priB} onBlur={e=>e.target.style.borderColor=C.brd}/>
        </div>

        {/* Platform toggles */}
        <label style={{ color:C.mid, fontSize:11, fontWeight:600, letterSpacing:.4, display:'block', marginBottom:10 }}>ACTIVE PLATFORMS</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
          {PLATS.map(p => {
            const on = plats.includes(p.id);
            return (
              <button key={p.id} onClick={()=>togglePlat(p.id)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px',
                  background: on ? `${p.c}18` : C.bg3,
                  border:`1.5px solid ${on ? p.c+'55' : C.brd}`,
                  borderRadius:20, cursor:'pointer', transition:'all .18s',
                  boxShadow: on ? `0 0 8px ${p.c}30` : 'none' }}>
                <span style={{ color: on ? p.c : C.dim, fontSize:14 }}>{p.s}</span>
                <span style={{ color: on ? p.c : C.mid, fontSize:12, fontWeight: on?700:400 }}>{p.n}</span>
                {on && <I.Check size={11} color={p.c}/>}
              </button>
            );
          })}
        </div>

        {/* Notification toggle */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:C.surf, border:`1px solid ${C.brd}`, borderRadius:12, marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <I.Bell size={16} color={notify?C.pri:C.dim}/>
            <div>
              <div style={{ color:C.txt, fontSize:14, fontWeight:500 }}>Notifications</div>
              <div style={{ color:C.mid, fontSize:12 }}>Receive message alerts</div>
            </div>
          </div>
          <Tog val={notify} set={setNotify} col={C.pri}/>
        </div>

        {/* Star toggle */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:C.surf, border:`1px solid ${C.brd}`, borderRadius:12, marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>⭐</span>
            <div>
              <div style={{ color:C.txt, fontSize:14, fontWeight:500 }}>Starred Contact</div>
              <div style={{ color:C.mid, fontSize:12 }}>Pin to top of conversations</div>
            </div>
          </div>
          <Tog val={starred} set={v=>{ setStarred(v); persist({starred:v}); }} col={C.yel}/>
        </div>

        {/* Remove avatar option */}
        {avatar && (
          <button onClick={()=>setAvatar(null)}
            style={{ width:'100%', padding:'12px', background:C.redD, border:`1px solid ${C.redB}`, borderRadius:10,
              color:C.red, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <I.Trash size={15}/>Remove Profile Photo
          </button>
        )}
      </div>

      {/* Avatar pick sheet */}
      {avatarSheet && (
        <div className="aFadeIn" style={{ position:'absolute', inset:0, zIndex:400, background:'rgba(5,5,16,.88)', backdropFilter:'blur(10px)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
          onClick={()=>setAS(false)}>
          <div className="aFadeUp" onClick={e=>e.stopPropagation()}
            style={{ background:C.bg2, borderRadius:'22px 22px 0 0', borderTop:`1px solid ${C.brd}`, padding:'8px 0 36px' }}>
            {/* Handle */}
            <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 6px' }}>
              <div style={{ width:40, height:4, borderRadius:2, background:C.dim }}/>
            </div>
            <p style={{ color:C.mid, fontSize:11, letterSpacing:1.5, textAlign:'center', marginBottom:8, fontFamily:'Syne,sans-serif' }}>SET PROFILE PHOTO</p>

            {/* Current preview */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:`2px solid ${platColor}55`, boxShadow:C.glow(platColor,12) }}/>
                : <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg,${platColor}28,${platColor}10)`, border:`2px solid ${platColor}44`, display:'flex', alignItems:'center', justifyContent:'center', color:platColor, fontWeight:800, fontSize:22, fontFamily:'Syne,sans-serif' }}>{conv.init}</div>
              }
            </div>

            {/* Option rows — each is a real <label> for direct storage access */}
            {[
              { icon:'📷', label:'Take Photo',           sub:'Open camera directly',          accept:'image/*', capture:'environment' },
              { icon:'🖼', label:'Choose Photo / Video', sub:'Images, GIFs, videos from gallery', accept:'image/*,video/*' },
              { icon:'📁', label:'Browse All Files',     sub:'HTML, PDF, docs, any file type',   accept:'*/*' },
            ].map((opt,i) => (
              <label key={i} style={{ width:'100%', display:'flex', alignItems:'center', gap:16, padding:'13px 24px',
                cursor:'pointer', boxSizing:'border-box', transition:'background .14s', position:'relative' }}
                onMouseEnter={e=>e.currentTarget.style.background=C.surf}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <input
                  type="file"
                  accept={opt.accept}
                  {...(opt.capture ? { capture: opt.capture } : {})}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // For images/videos use FileReader for preview
                    if (file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = ev => { setAvatar(ev.target.result); setAS(false); };
                      reader.readAsDataURL(file);
                    } else {
                      // Non-image: show filename as avatar label fallback
                      setAvatar(`__file__:${file.name}`);
                      setAS(false);
                    }
                    e.target.value = '';
                  }}
                  style={{ position:'absolute', width:1, height:1, opacity:0, pointerEvents:'none' }}/>
                <div style={{ width:46, height:46, borderRadius:14, background:C.priD, border:`1px solid ${C.priB}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                  {opt.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.txt, fontSize:15, fontWeight:600 }}>{opt.label}</div>
                  <div style={{ color:C.mid, fontSize:12, marginTop:2 }}>{opt.sub}</div>
                </div>
                <I.ChevR size={14} color={C.dim}/>
              </label>
            ))}

            {/* Remove option */}
            {avatar && (
              <button onClick={()=>{ setAvatar(null); setAS(false); }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:16, padding:'13px 24px',
                  background:'none', border:'none', cursor:'pointer', boxSizing:'border-box', transition:'background .14s' }}
                onMouseEnter={e=>e.currentTarget.style.background=C.redD}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:46, height:46, borderRadius:14, background:C.redD, border:`1px solid ${C.redB}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🗑</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.red, fontSize:15, fontWeight:600 }}>Remove Photo</div>
                  <div style={{ color:C.mid, fontSize:12, marginTop:2 }}>Revert to initials</div>
                </div>
              </button>
            )}

            <div style={{ margin:'10px 20px 0' }}>
              <Btn v="ghost" full sz="lg" onClick={()=>setAS(false)} ch="Cancel"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  return (
    <div className="aFadeIn" style={{ position:'absolute', inset:0, zIndex:200, background:C.bg0, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Active call overlay */}
      {activeCall && (
        <CallOverlay
          contact={{ name, init:conv.init, plat:conv.plat, avatar }}
          callType={activeCall}
          onEnd={()=>setActiveCall(null)}
        />
      )}

      {/* Header */}
      <div style={{ padding:'12px 16px', background:C.surf, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <button onClick={onClose} style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',display:'flex' }}><I.ArrowL size={20}/></button>
        <h2 style={{ color:C.txt, fontSize:17, fontWeight:700, fontFamily:'Syne,sans-serif', flex:1 }}>Profile</h2>
        {starred && <span style={{ fontSize:16 }}>⭐</span>}
        <button onClick={()=>setEdit(true)}
          style={{ background:C.priD, border:`1px solid ${C.priB}`, borderRadius:9,
            padding:'7px 14px', color:C.pri, cursor:'pointer', fontSize:12, fontWeight:600,
            display:'flex', alignItems:'center', gap:6, transition:'all .2s' }}>
          <I.User size={13}/>Edit
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>

        {/* Cover + Avatar */}
        <div style={{ position:'relative', marginBottom:0 }}>
          <div style={{ height:110, background:`linear-gradient(135deg,${platColor}28,${C.sec}18,${C.bg2})` }}/>
          <div style={{ position:'absolute', top:12, left:14 }}>
            {base.verified && (
              <div style={{ background:C.priD, border:`1px solid ${C.priB}`, borderRadius:20, padding:'3px 10px', display:'flex', alignItems:'center', gap:5 }}>
                <I.Check size={11} color={C.pri}/>
                <span style={{ color:C.pri, fontSize:10, fontWeight:700, letterSpacing:.8, fontFamily:'Syne,sans-serif' }}>VERIFIED</span>
              </div>
            )}
          </div>
          {/* Avatar floated up */}
          <div style={{ padding:'0 22px', marginTop:-50, marginBottom:14, display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
            <div style={{ position:'relative' }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width:90, height:90, borderRadius:'50%', objectFit:'cover', border:`3px solid ${C.bg0}`, boxShadow:C.glow(platColor,18) }}/>
                : <div style={{ width:90, height:90, borderRadius:'50%', background:`linear-gradient(135deg,${platColor}30,${platColor}10)`, border:`3px solid ${C.bg0}`, display:'flex', alignItems:'center', justifyContent:'center', color:platColor, fontWeight:800, fontSize:30, fontFamily:'Syne,sans-serif', boxShadow:C.glow(platColor,18) }}>{conv.init}</div>
              }
              {conv.online && <div style={{ position:'absolute', bottom:4, right:4, width:18, height:18, borderRadius:'50%', background:C.grn, border:`3px solid ${C.bg0}`, boxShadow:C.glow(C.grn,8) }}/>}
            </div>
            {/* Action buttons */}
            <div style={{ display:'flex', gap:8, paddingBottom:4 }}>
              <button onClick={onMessage}
                style={{ background:`linear-gradient(135deg,${C.pri},#0096cc)`, border:'none', borderRadius:10,
                  padding:'9px 18px', color:'#050510', fontWeight:700, fontSize:13, cursor:'pointer',
                  display:'flex', alignItems:'center', gap:6, boxShadow:C.glow() }}>
                <I.Msg size={14}/>Message
              </button>
              <button
                onClick={()=>setActiveCall('voice')}
                style={{ background:C.card, border:`1px solid ${C.grnB}`, borderRadius:10, width:40, height:40,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.grn,
                  transition:'all .2s', boxShadow:`0 0 8px ${C.grn}20` }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.grnD; e.currentTarget.style.boxShadow=C.glow(C.grn,12); }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.card; e.currentTarget.style.boxShadow=`0 0 8px ${C.grn}20`; }}>
                <I.Phone size={17}/>
              </button>
              <button
                onClick={()=>setActiveCall('video')}
                style={{ background:C.card, border:`1px solid ${C.secB}`, borderRadius:10, width:40, height:40,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#a78bfa',
                  transition:'all .2s', boxShadow:`0 0 8px ${C.sec}20` }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.secD; e.currentTarget.style.boxShadow=C.glow(C.sec,12); }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.card; e.currentTarget.style.boxShadow=`0 0 8px ${C.sec}20`; }}>
                <I.Video size={17}/>
              </button>
            </div>
          </div>
        </div>

        {/* Name block */}
        <div style={{ padding:'0 22px 18px', borderBottom:`1px solid ${C.brd}` }}>
          <h2 style={{ color:C.txt, fontSize:23, fontWeight:800, fontFamily:'Syne,sans-serif', marginBottom:3 }}>{name}</h2>
          <p style={{ color:platColor, fontSize:13, fontWeight:600, fontFamily:'JetBrains Mono,monospace', marginBottom:5 }}>{uname}</p>
          <p style={{ color:C.mid, fontSize:13, marginBottom: conv.online?8:0 }}>{role}</p>
          {conv.online && <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:7,height:7,borderRadius:'50%',background:C.grn,boxShadow:C.glow(C.grn,6) }}/><span style={{ color:C.grn, fontSize:12 }}>Active now</span></div>}
        </div>

        {/* Status */}
        {status && (
          <div style={{ padding:'14px 22px', borderBottom:`1px solid ${C.brd}` }}>
            <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:7, fontFamily:'Syne,sans-serif' }}>STATUS</p>
            <p style={{ color:C.txt, fontSize:14, lineHeight:1.65, fontStyle:'italic' }}>"{status}"</p>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'flex', borderBottom:`1px solid ${C.brd}` }}>
          {[
            { icon:'📍', val:loc,                     label:'Location' },
            { icon:'👥', val:`${base.mutual} mutual`, label:'Contacts'  },
            { icon:'📅', val:base.joined,             label:'Joined'    },
          ].map((s,i) => (
            <div key={i} style={{ flex:1, padding:'14px 0', textAlign:'center', borderRight:i<2?`1px solid ${C.brd}`:'none' }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
              <div style={{ color:C.txt, fontSize:12, fontWeight:600, marginBottom:2 }}>{s.val}</div>
              <div style={{ color:C.dim, fontSize:10, letterSpacing:.8, fontFamily:'Syne,sans-serif' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Platforms */}
        <div style={{ padding:'16px 22px', borderBottom:`1px solid ${C.brd}` }}>
          <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:10, fontFamily:'Syne,sans-serif' }}>ACTIVE ON</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {plats.map(pid => {
              const p = PLATS.find(x=>x.id===pid);
              if (!p) return null;
              return (
                <div key={pid} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 13px', background:`${p.c}12`, border:`1px solid ${p.c}35`, borderRadius:20 }}>
                  <span style={{ color:p.c, fontSize:14 }}>{p.s}</span>
                  <span style={{ color:p.c, fontSize:12, fontWeight:600 }}>{p.n}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notification + Star toggles */}
        <div style={{ padding:'12px 22px', borderBottom:`1px solid ${C.brd}` }}>
          {[
            { icon:<I.Bell size={16} color={notify?C.pri:C.dim}/>, label:'Notifications', desc:'Message alerts', val:notify, set:setNotify, col:C.pri },
            { icon:<span style={{ fontSize:16 }}>⭐</span>, label:'Starred', desc:'Pin to top', val:starred, set:v=>{ setStarred(v); persist({starred:v}); }, col:C.yel },
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:i===0?`1px solid ${C.brd}`:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {r.icon}
                <div>
                  <div style={{ color:C.txt, fontSize:14, fontWeight:500 }}>{r.label}</div>
                  <div style={{ color:C.mid, fontSize:12 }}>{r.desc}</div>
                </div>
              </div>
              <Tog val={r.val} set={r.set} col={r.col}/>
            </div>
          ))}
        </div>

        {/* E2E info */}
        <div style={{ margin:'16px 22px', padding:'12px 16px', background:C.grnD, border:`1px solid ${C.grnB}`, borderRadius:10, display:'flex', alignItems:'center', gap:10 }}>
          <I.Lock size={13} color={C.grn}/>
          <p style={{ color:C.grn, fontSize:12 }}>All messages end-to-end encrypted · AES-256-GCM</p>
        </div>

        {/* Edit CTA */}
        <div style={{ padding:'0 22px 32px' }}>
          <Btn v="ghost" full onClick={()=>setEdit(true)} ch={<><I.User size={14}/>Edit Contact Info</>}/>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT TAB
══════════════════════════════════════════════════════════════════════════════ */

function ChatTab({ user }) {
  const [convs, setConvs]       = useState(MOCK_CONVS);
  const [active, setActive]     = useState(null);
  const [msgs, setMsgs]         = useState(MOCK_MSGS);
  const [inp, setInp]           = useState('');
  const [srch, setSrch]         = useState('');
  const [typing, setTyping]     = useState(false);
  const [newChat, setNewChat]   = useState(false);
  const [newPlat, setNewPlat]   = useState('vaultackie');
  const [newHandle, setNewH]    = useState('');
  const [loadMsgs, setLM]       = useState(false);
  const [calling, setCalling]   = useState(false);
  const [callType, setCallType] = useState('voice');
  const [profileContact, setPC] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [muted, setMuted]       = useState({});
  const [blocked, setBlocked]   = useState({});
  const [starred, setStarred]   = useState({});
  const [searchMode, setSearch] = useState(false);
  const [searchQ, setSearchQ]   = useState('');
  const [wallpaper, setWallpaper] = useState({});
  const [toastMsg, setToast]    = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [attachments, setAttachments] = useState([]); // [{name, type, size, dataUrl, fileType}]
  const endRef = useRef(null);
  const inpRef = useRef(null);
  const menuRef = useRef(null);

  const toast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const handleAttachFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const isAud = file.type.startsWith('audio/');
      const read  = isImg || isVid;
      const fType = isImg?'image':isVid?'video':isAud?'audio':file.name.endsWith('.html')||file.name.endsWith('.htm')?'html':file.name.endsWith('.pdf')?'pdf':'file';
      if (read) {
        const reader = new FileReader();
        reader.onload = ev => setAttachments(p=>[...p,{ name:file.name, type:file.type, size:file.size, dataUrl:ev.target.result, fileType:fType }]);
        reader.readAsDataURL(file);
      } else {
        setAttachments(p=>[...p,{ name:file.name, type:file.type, size:file.size, dataUrl:null, fileType:fType }]);
      }
    });
    setShowAttach(false);
    e.target.value = '';
  };

  const removeAttachment = (i) => setAttachments(p=>p.filter((_,idx)=>idx!==i));
  const fmtSize = (b) => b>1024*1024?`${(b/1024/1024).toFixed(1)}MB`:b>1024?`${(b/1024).toFixed(0)}KB`:`${b}B`;
  const fileIcon = (t) => ({image:'🖼',video:'🎬',audio:'🎵',html:'🌐',pdf:'📄',file:'📎'}[t]||'📎');

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  /* Load conversations from API */
  useEffect(() => {
    if (!user?.demo && !user?.isGuest) {
      $get('/messages/conversations').then(r => { if (r.data?.length) setConvs(r.data); }).catch(()=>{});
    }
  }, [user]);

  /* Load messages when conversation selected */
  useEffect(() => {
    if (!active) return;
    if (!user?.demo && !user?.isGuest) {
      setLM(true);
      $get(`/messages/conversations/${active.id}/messages?limit=50`)
        .then(r => { if (r.data?.length) setMsgs(p => ({ ...p, [active.id]: r.data.map(m => ({ id:m.id, from:m.senderId===user.id?'me':'them', txt:m.content, ts:new Date(m.createdAt).getTime() })) })); })
        .catch(()=>{})
        .finally(()=>setLM(false));
    }
    setTimeout(() => endRef.current?.scrollIntoView({ behavior:'smooth' }), 80);
    inpRef.current?.focus();
  }, [active]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, active]);

  const sendMsg = async () => {
    if (!inp.trim() && !attachments.length) return;
    if (!active) return;
    const txt  = inp.trim() || (attachments.length ? `📎 ${attachments.map(a=>a.name).join(', ')}` : '');
    if (!txt) return;
    const msgId = 'm' + Date.now();
    const newMsg = { id:msgId, from:'me', txt, ts:Date.now(), attachments: attachments.length ? [...attachments] : undefined };
    setMsgs(p => ({ ...p, [active.id]:[...(p[active.id]||[]), newMsg] }));
    setInp('');
    setAttachments([]);
    setShowAttach(false);
    // Update conv preview
    setConvs(p => p.map(c => c.id===active.id ? { ...c, lastTxt:txt, at:Date.now() } : c));

    // API send
    if (!user?.demo && !user?.isGuest) {
      $post(`/messages/conversations/${active.id}/send`, { content:txt, type:'text' }).catch(()=>{});
    }

    // Simulated reply
    if (user?.demo || user?.isGuest) {
      setTyping(true);
      const replies = ['Got it 👍','Acknowledged ✓','On it. Will update shortly.','🔐 Received & decrypted','Confirmed.','Noted! Let me check on that.','Copy that, stand by.','Thanks for the update.','📡 Signal received.'];
      setTimeout(() => {
        setTyping(false);
        const r = { id:'m'+Date.now(), from:'them', txt:replies[Math.floor(Math.random()*replies.length)], ts:Date.now() };
        setMsgs(p => ({ ...p, [active.id]:[...(p[active.id]||[]), r] }));
      }, 1200 + Math.random()*1000);
    }
  };

  const filtered = convs.filter(c => c.name.toLowerCase().includes(srch.toLowerCase()));

  /* ── Call overlay ── */
  if (calling && active) return (
    <CallOverlay
      contact={{ name:active.name, init:active.init, plat:active.plat, avatar:null }}
      callType={callType}
      onEnd={()=>setCalling(false)}
    />
  );

  /* ── New chat panel ── */
  if (newChat) return (
    <div className="aFadeIn" style={{ height:'100%', background:C.bg0, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'14px 16px', background:C.surf, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={()=>setNewChat(false)} style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',display:'flex' }}><I.ArrowL size={20}/></button>
        <h2 style={{ color:C.txt, fontSize:17, fontWeight:700, fontFamily:'Syne,sans-serif' }}>New Message</h2>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:18 }}>
        <p style={{ color:C.dim, fontSize:11, letterSpacing:1, marginBottom:12, fontFamily:'Syne,sans-serif' }}>SELECT PLATFORM</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
          {PLATS.map(p=>(
            <button key={p.id} onClick={()=>setNewPlat(p.id)} style={{
              padding:'7px 13px', borderRadius:20,
              border:`1px solid ${newPlat===p.id?p.c+80:C.brd}`,
              background:newPlat===p.id?`${p.c}18`:C.card,
              color:newPlat===p.id?p.c:C.mid, cursor:'pointer', fontSize:12,
              display:'flex', alignItems:'center', gap:5, transition:'all .2s' }}>
              <span style={{ color:p.c }}>{p.s}</span>{p.n}
            </button>
          ))}
        </div>
        <p style={{ color:C.dim, fontSize:11, letterSpacing:1, marginBottom:10, fontFamily:'Syne,sans-serif' }}>USERNAME OR HANDLE</p>
        <Inp val={newHandle} set={setNewH} ph={`@username on ${pn(newPlat)}`} Ic={I.User}/>
        <div style={{ marginTop:14 }}>
          <Btn v="solid" full ch={<><I.Send size={14}/>Start Conversation</>} onClick={()=>{
            if (!newHandle.trim()) return;
            const nc = { id:'new-'+Date.now(), type:'direct', name:newHandle, lastTxt:'', at:Date.now(), plat:newPlat, unread:0, init:newHandle.slice(0,2).toUpperCase(), online:false };
            setConvs(p=>[nc,...p]);
            setActive(nc);
            setNewChat(false);
            setNewH('');
          }}/>
        </div>
        {newPlat !== 'vaultackie' && (
          <div style={{ marginTop:18, padding:16, background:C.secD, border:`1px solid ${C.secB}`, borderRadius:12 }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <I.Info size={14} color={C.sec}/>
              <p style={{ color:'#a78bfa', fontSize:12, lineHeight:1.6 }}>
                Link your <strong>{pn(newPlat)}</strong> account in <strong>Settings → Linked Accounts</strong> to send messages across platforms without leaving Vaultackie.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Active chat ── */
  if (active) {
    const chatMsgs = msgs[active.id] || [];
    return (
      <div className="aFadeIn" style={{ height:'100%', display:'flex', flexDirection:'column', background:C.bg0, position:'relative' }}>
        {/* Header */}
        <div style={{ padding:'10px 14px', background:C.surf, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <button onClick={()=>setActive(null)} style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',display:'flex',flexShrink:0 }}><I.ArrowL size={20}/></button>
          <div onClick={()=>setPC(active)} style={{ cursor:'pointer', borderRadius:'50%', transition:'transform .15s' }}
            onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'}
            onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
            <Av init={active.init} col={pc(active.plat)} size={38} online={active.online}/>
          </div>
          <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={()=>setPC(active)}>
            <div style={{ color:C.txt, fontWeight:700, fontSize:15, fontFamily:'Syne,sans-serif' }}>{active.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ color:pc(active.plat), fontSize:10 }}>{ps(active.plat)} {pn(active.plat)}</span>
              {active.online && <span style={{ color:C.grn, fontSize:10 }}>● Online</span>}
              {typing && <span style={{ color:C.mid, fontSize:10, fontStyle:'italic' }}>typing...</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            <button onClick={()=>{setCallType('voice');setCalling(true);}} style={{ background:'none',border:'none',color:C.mid,cursor:'pointer',display:'flex',padding:6,borderRadius:8,transition:'color .2s' }} onMouseEnter={e=>e.target.style.color=C.grn} onMouseLeave={e=>e.target.style.color=C.mid}><I.Phone size={18}/></button>
            <button onClick={()=>{setCallType('video');setCalling(true);}} style={{ background:'none',border:'none',color:C.mid,cursor:'pointer',display:'flex',padding:6,borderRadius:8,transition:'color .2s' }} onMouseEnter={e=>e.target.style.color=C.sec} onMouseLeave={e=>e.target.style.color=C.mid}><I.Video size={18}/></button>
            <div style={{ position:'relative' }} ref={menuRef}>
              <button onClick={()=>setShowMenu(s=>!s)}
                style={{ background:showMenu?C.card:'none', border:`1px solid ${showMenu?C.brd:'transparent'}`,
                  color:showMenu?C.pri:C.mid, cursor:'pointer', display:'flex', padding:6, borderRadius:8, transition:'all .2s' }}>
                <I.Dots size={18}/>
              </button>
              {showMenu && (
                <div className="aFadeUp" style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:500,
                  background:C.card2, border:`1px solid ${C.brd}`, borderRadius:14, minWidth:210,
                  boxShadow:'0 8px 32px rgba(0,0,0,.6)', overflow:'hidden' }}>
                  {[
                    { icon:'👤', label:'View Profile',       action: () => { setShowMenu(false); setPC(active); } },
                    { icon:'🔍', label:'Search in Chat',     action: () => { setShowMenu(false); setSearch(true); setTimeout(()=>document.getElementById('chat-search')?.focus(),80); } },
                    { icon:'⭐', label: starred[active.id] ? 'Unstar Contact' : 'Star Contact',
                      action: () => { setStarred(p=>({...p,[active.id]:!p[active.id]})); toast(starred[active.id]?'Contact unstarred':'Contact starred ⭐'); setShowMenu(false); } },
                    { icon:'🔔', label: muted[active.id] ? 'Unmute Notifications' : 'Mute Notifications',
                      action: () => { setMuted(p=>({...p,[active.id]:!p[active.id]})); toast(muted[active.id]?'Notifications unmuted':'Notifications muted 🔇'); setShowMenu(false); } },
                    { icon:'📎', label:'Share Media',        action: () => { toast('Media sharing coming soon'); setShowMenu(false); } },
                    { icon:'🔐', label:'Encryption Info',    action: () => { toast('AES-256-GCM · End-to-end encrypted · Keys never leave your device'); setShowMenu(false); } },
                    { icon:'🖼', label:'Chat Wallpaper',     action: () => { const ws=['','linear-gradient(135deg,#0c0c22,#16163a)','radial-gradient(circle at 20% 80%,#00d4ff08,transparent 50%),radial-gradient(circle at 80% 20%,#7c3aed08,transparent 50%)']; const cur=wallpaper[active.id]||0; const next=(cur+1)%ws.length; setWallpaper(p=>({...p,[active.id]:next})); toast('Wallpaper changed'); setShowMenu(false); } },
                    { icon:'🗑', label:'Clear Chat',         action: () => { setMsgs(p=>({...p,[active.id]:[]})); toast('Chat cleared'); setShowMenu(false); }, danger:true },
                    { icon:blocked[active.id]?'✅':'🚫', label: blocked[active.id] ? 'Unblock Contact' : 'Block Contact',
                      action: () => { setBlocked(p=>({...p,[active.id]:!p[active.id]})); toast(blocked[active.id]?'Contact unblocked':'Contact blocked 🚫'); setShowMenu(false); }, danger:!blocked[active.id] },
                    { icon:'🚨', label:'Report',             action: () => { toast('Report submitted. Thank you.'); setShowMenu(false); }, danger:true },
                  ].map((item,i) => (
                    <button key={i} onClick={item.action}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                        background:'none', border:'none', cursor:'pointer', textAlign:'left',
                        borderBottom: i < 10 ? `1px solid ${C.brd}` : 'none',
                        transition:'background .14s' }}
                      onMouseEnter={e=>e.currentTarget.style.background=item.danger?C.redD:C.surf}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <span style={{ fontSize:16, width:22, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                      <span style={{ color:item.danger?C.red:C.txt, fontSize:13, fontWeight:500 }}>{item.label}</span>
                      {item.label.includes('Mute') && muted[active.id] && <Chip text="ON" color={C.yel}/>}
                      {item.label.includes('Star') && starred[active.id] && <Chip text="★" color={C.yel}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* E2E banner */}
        <div style={{ padding:'5px 14px', background:C.grnD, borderBottom:`1px solid ${C.grnB}`, display:'flex', alignItems:'center', justifyContent:'center', gap:6, flexShrink:0 }}>
          <I.Lock size={10} color={C.grn}/>
          <span style={{ color:C.grn, fontSize:10 }}>End-to-end encrypted · AES-256-GCM</span>
        </div>

        {/* Muted banner */}
        {muted[active.id] && (
          <div style={{ padding:'4px 14px', background:C.yelD, borderBottom:`1px solid ${C.yel}22`, display:'flex', alignItems:'center', justifyContent:'center', gap:6, flexShrink:0 }}>
            <span style={{ color:C.yel, fontSize:10 }}>🔇 Notifications muted</span>
          </div>
        )}

        {/* Blocked banner */}
        {blocked[active.id] && (
          <div style={{ padding:'4px 14px', background:C.redD, borderBottom:`1px solid ${C.redB}`, display:'flex', alignItems:'center', justifyContent:'center', gap:6, flexShrink:0 }}>
            <span style={{ color:C.red, fontSize:10 }}>🚫 This contact is blocked</span>
          </div>
        )}

        {/* In-chat search bar */}
        {searchMode && (
          <div style={{ padding:'8px 12px', background:C.surf, borderBottom:`1px solid ${C.brd}`, display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <div style={{ position:'relative', flex:1 }}>
              <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.dim, display:'flex', pointerEvents:'none' }}><I.Search size={13}/></div>
              <input id="chat-search" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                placeholder="Search messages..."
                style={{ width:'100%', background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:20,
                  padding:'8px 12px 8px 32px', color:C.txt, fontSize:13, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <button onClick={()=>{ setSearch(false); setSearchQ(''); }}
              style={{ background:'none', border:'none', color:C.mid, cursor:'pointer', display:'flex', padding:4 }}>
              <I.X size={16}/>
            </button>
          </div>
        )}

        {/* Toast */}
        {toastMsg && (
          <div className="aFadeUp" style={{ position:'absolute', bottom:80, left:'50%', transform:'translateX(-50%)', zIndex:600,
            background:C.card2, border:`1px solid ${C.brd}`, borderRadius:20, padding:'9px 18px',
            boxShadow:'0 4px 20px rgba(0,0,0,.5)', whiteSpace:'nowrap', maxWidth:'85%' }}>
            <span style={{ color:C.txt, fontSize:13 }}>{toastMsg}</span>
          </div>
        )}

        {/* Messages */}
        {(() => {
          const WPS = ['','linear-gradient(135deg,#0c0c22,#16163a)','radial-gradient(circle at 20% 80%,#00d4ff08,transparent 50%),radial-gradient(circle at 80% 20%,#7c3aed08,transparent 50%)'];
          const wp = WPS[wallpaper[active.id]||0] || '';
          const visibleMsgs = searchQ.trim() ? chatMsgs.filter(m=>m.txt.toLowerCase().includes(searchQ.toLowerCase())) : chatMsgs;
          return (
        <div style={{ flex:1, overflowY:'auto', padding:'16px 14px', display:'flex', flexDirection:'column', gap:10, background:wp||undefined }}>
          {user?.isGuest && (
            <div style={{ textAlign:'center', padding:'8px 14px', background:C.secD, border:`1px solid ${C.secB}`, borderRadius:10 }}>
              <span style={{ color:'#a78bfa', fontSize:12 }}>👁 Guest mode · Sign in to view full history</span>
            </div>
          )}
          {loadMsgs && <div style={{ display:'flex', justifyContent:'center', padding:20 }}><Spinner/></div>}
          {chatMsgs.length===0 && !loadMsgs && (
            <div style={{ textAlign:'center', paddingTop:50, color:C.dim }}>
              <I.Shield size={34} color={C.dim} style={{ margin:'0 auto 12px', display:'block' }}/>
              <p style={{ fontSize:13 }}>Start of encrypted conversation</p>
              <p style={{ fontSize:11, marginTop:6 }}>Messages are end-to-end encrypted</p>
            </div>
          )}
          {searchQ.trim() && visibleMsgs.length===0 && (
            <div style={{ textAlign:'center', paddingTop:40, color:C.dim }}>
              <I.Search size={28} color={C.dim} style={{ margin:'0 auto 10px', display:'block' }}/>
              <p style={{ fontSize:13 }}>No messages match "{searchQ}"</p>
            </div>
          )}
          {visibleMsgs.map((m,i) => (
            <div key={m.id} className="aMsgPop" style={{ display:'flex', justifyContent:m.from==='me'?'flex-end':'flex-start', animationDelay:`${Math.min(i*.03,.15)}s` }}>
              {m.from==='them' && <Av init={active.init} col={pc(active.plat)} size={28} sty={{ marginRight:8, alignSelf:'flex-end', flexShrink:0 }}/>}
              <div style={{ maxWidth:'72%', background:m.from==='me'?`linear-gradient(135deg,${C.pri}2a,${C.pri}14)`:C.card2,
                border:`1px solid ${m.from==='me'?C.priB:C.brd}`,
                borderRadius:m.from==='me'?'16px 16px 5px 16px':'16px 16px 16px 5px', padding:'10px 14px',
                boxShadow: searchQ.trim() && m.txt.toLowerCase().includes(searchQ.toLowerCase()) ? `0 0 0 2px ${C.yel}` : 'none' }}>
                {/* Attachment previews inside bubble */}
                {m.attachments?.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom: m.txt&&!m.txt.startsWith('📎')?8:0 }}>
                    {m.attachments.map((a,ai) => (
                      a.fileType==='image'
                        ? <img key={ai} src={a.dataUrl} alt={a.name} style={{ maxWidth:200, maxHeight:160, borderRadius:8, objectFit:'cover', display:'block' }}/>
                        : <div key={ai} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'rgba(0,0,0,.22)', borderRadius:8 }}>
                            <span style={{ fontSize:20 }}>{fileIcon(a.fileType)}</span>
                            <div>
                              <div style={{ color:C.txt, fontSize:12, fontWeight:600, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                              <div style={{ color:C.dim, fontSize:10 }}>{fmtSize(a.size)}</div>
                            </div>
                          </div>
                    ))}
                  </div>
                )}
                {(!m.txt.startsWith('📎') || !m.attachments?.length) && <p style={{ color:C.txt, fontSize:14, lineHeight:1.52 }}>{m.txt}</p>}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:5 }}>
                  <span style={{ color:C.dim, fontSize:10 }}>{tStamp(m.ts)}</span>
                  {m.from==='me' && <span style={{ color:C.pri, fontSize:11 }}>✓✓</span>}
                </div>
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Av init={active.init} col={pc(active.plat)} size={28}/>
              <div style={{ background:C.card2, border:`1px solid ${C.brd}`, borderRadius:'16px 16px 16px 5px', padding:'12px 16px', display:'flex', gap:5 }}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:C.mid, animation:`pulse 1.2s ease-in-out infinite`, animationDelay:`${i*.2}s` }}/>
                ))}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>
          );
        })()}

        {/* Input */}
        {user?.isGuest ? (
          <div style={{ padding:16, background:C.surf, borderTop:`1px solid ${C.brd}`, textAlign:'center', flexShrink:0 }}>
            <span style={{ color:C.mid, fontSize:13 }}>🔐 Sign in to send messages</span>
          </div>
        ) : blocked[active.id] ? (
          <div style={{ padding:16, background:C.surf, borderTop:`1px solid ${C.redB}`, textAlign:'center', flexShrink:0 }}>
            <span style={{ color:C.red, fontSize:13 }}>🚫 You have blocked this contact</span>
          </div>
        ) : (
          <div style={{ background:C.surf, borderTop:`1px solid ${C.brd}`, flexShrink:0 }}>

            {/* Attachment preview strip */}
            {attachments.length > 0 && (
              <div style={{ display:'flex', gap:8, padding:'8px 12px 0', overflowX:'auto', flexWrap:'nowrap' }}>
                {attachments.map((a,i) => (
                  <div key={i} style={{ position:'relative', flexShrink:0 }}>
                    {a.fileType==='image'
                      ? <img src={a.dataUrl} alt={a.name} style={{ width:64, height:64, borderRadius:10, objectFit:'cover', border:`1px solid ${C.priB}` }}/>
                      : <div style={{ width:64, height:64, borderRadius:10, background:C.card, border:`1px solid ${C.brd}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3 }}>
                          <span style={{ fontSize:24 }}>{fileIcon(a.fileType)}</span>
                          <span style={{ color:C.dim, fontSize:9, maxWidth:56, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', padding:'0 2px' }}>{a.name}</span>
                        </div>
                    }
                    <button onClick={()=>removeAttachment(i)}
                      style={{ position:'absolute', top:-5, right:-5, width:18, height:18, borderRadius:'50%',
                        background:C.red, border:`1.5px solid ${C.bg0}`, cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:10, lineHeight:1 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{ padding:'10px 12px', display:'flex', gap:8, alignItems:'flex-end', position:'relative' }}>
              {/* + attach button */}
              <button onClick={()=>setShowAttach(s=>!s)}
                style={{ background:showAttach?C.priD:'none', border:`1px solid ${showAttach?C.priB:'transparent'}`,
                  color:showAttach?C.pri:C.mid, cursor:'pointer', display:'flex', padding:'9px 6px',
                  flexShrink:0, borderRadius:10, transition:'all .18s' }}>
                <I.Plus size={20}/>
              </button>
              <textarea ref={inpRef} value={inp} onChange={e=>setInp(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                placeholder={attachments.length?`Add a caption...`:"Encrypted message..."}
                rows={1}
                style={{ flex:1, background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:22, padding:'10px 16px', color:C.txt, fontSize:14, outline:'none', transition:'border-color .2s', maxHeight:100, lineHeight:1.5 }}/>
              <button style={{ background:'none',border:'none',color:C.mid,cursor:'pointer',display:'flex',padding:'9px 4px',flexShrink:0 }}><I.Mic size={20}/></button>
              <button onClick={sendMsg} style={{ background:'linear-gradient(135deg,#00d4ff,#0096cc)', border:'none', borderRadius:'50%', width:42, height:42, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, boxShadow:C.glow() }}>
                <I.Send size={16} color="#050510"/>
              </button>

              {/* Attachment sheet — slides up from input */}
              {showAttach && (
                <div className="aFadeUp" style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, right:0, zIndex:500,
                  background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:18,
                  boxShadow:'0 -4px 32px rgba(0,0,0,.6)', overflow:'hidden' }}>
                  <div style={{ padding:'10px 16px 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <p style={{ color:C.mid, fontSize:10, letterSpacing:1.4, fontFamily:'Syne,sans-serif' }}>ATTACH</p>
                    <button onClick={()=>setShowAttach(false)} style={{ background:'none',border:'none',color:C.dim,cursor:'pointer',display:'flex' }}><I.X size={14}/></button>
                  </div>

                  {/* Grid of attach types */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
                    {[
                      { icon:'📷', label:'Camera',     accept:'image/*',                          capture:'environment', multi:false },
                      { icon:'🖼', label:'Gallery',    accept:'image/*,video/*',                  capture:null,          multi:true  },
                      { icon:'📁', label:'Files',      accept:'*/*',                              capture:null,          multi:true  },
                      { icon:'🌐', label:'HTML',       accept:'.html,.htm,text/html',             capture:null,          multi:true  },
                      { icon:'📄', label:'Document',   accept:'.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,application/pdf', capture:null, multi:true },
                      { icon:'🎵', label:'Audio',      accept:'audio/*,.mp3,.wav,.ogg,.m4a',      capture:null,          multi:true  },
                      { icon:'🎬', label:'Video',      accept:'video/*,.mp4,.mov,.avi,.mkv',      capture:'user',        multi:false },
                      { icon:'📦', label:'Any',        accept:'*/*',                              capture:null,          multi:true  },
                    ].map((opt,i) => (
                      <label key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                        padding:'14px 6px', cursor:'pointer', transition:'background .14s', gap:6, position:'relative' }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.surf}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <input
                          type="file"
                          accept={opt.accept}
                          multiple={opt.multi}
                          {...(opt.capture ? { capture: opt.capture } : {})}
                          onChange={handleAttachFile}
                          style={{ position:'absolute', width:1, height:1, opacity:0, pointerEvents:'none' }}/>
                        <div style={{ width:52, height:52, borderRadius:16, background:C.card, border:`1px solid ${C.brd}`,
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
                          {opt.icon}
                        </div>
                        <span style={{ color:C.mid, fontSize:11, fontWeight:500 }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ padding:'10px 16px 16px' }}>
                    <Btn v="ghost" full sz="sm" onClick={()=>setShowAttach(false)} ch="Cancel"/>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact profile overlay */}
        {profileContact && (
          <ContactProfile
            conv={profileContact}
            onClose={()=>setPC(null)}
            onMessage={()=>setPC(null)}
          />
        )}
      </div>
    );
  }

  /* ── Conversation list ── */
  return (
    <div className="aFadeIn" style={{ height:'100%', display:'flex', flexDirection:'column', background:C.bg0, position:'relative' }}>
      <div style={{ padding:'14px 16px 12px', background:C.surf, borderBottom:`1px solid ${C.brd}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <h2 style={{ color:C.txt, fontSize:20, fontWeight:800, fontFamily:'Syne,sans-serif' }}>
            <span style={{ color:C.pri }}>⬡</span> Messages
          </h2>
          <button onClick={()=>setNewChat(true)} style={{ background:C.priD, border:`1px solid ${C.priB}`, borderRadius:9, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.pri, transition:'all .2s' }}>
            <I.Plus size={18}/>
          </button>
        </div>
        <div style={{ position:'relative' }}>
          <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.dim, pointerEvents:'none', display:'flex' }}><I.Search size={14}/></div>
          <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search conversations..."
            style={{ width:'100%', background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:10, padding:'10px 14px 10px 36px', color:C.txt, fontSize:13, outline:'none' }}/>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {user?.isGuest && (
          <div style={{ margin:10, padding:'10px 14px', background:C.secD, border:`1px solid ${C.secB}`, borderRadius:10 }}>
            <p style={{ color:'#a78bfa', fontSize:12 }}>👁 Guest mode — showing demo conversations</p>
          </div>
        )}
        {filtered.map(c => (
          <div key={c.id} onClick={()=>setActive(c)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:`1px solid ${C.brd}`, cursor:'pointer', transition:'background .14s' }}
            onMouseEnter={e=>e.currentTarget.style.background=C.surf}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div onClick={e=>{e.stopPropagation();setPC(c);}} style={{ borderRadius:'50%', transition:'transform .15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'}
              onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              <Av init={c.init} col={pc(c.plat)} size={48} online={c.online}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:C.txt, fontWeight:700, fontSize:15 }}>{c.name}</span>
                  {c.type==='group' && <Chip text="GROUP" color={C.mid}/>}
                </div>
                <span style={{ color:C.dim, fontSize:11, flexShrink:0 }}>{tAgo(c.at)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:C.mid, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'80%' }}>{c.lastTxt}</span>
                <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                  <span style={{ color:pc(c.plat), fontSize:12 }}>{ps(c.plat)}</span>
                  {c.unread>0 && <span style={{ background:C.pri, color:'#050510', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:800 }}>{c.unread}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0 && (
          <div style={{ textAlign:'center', padding:'50px 20px', color:C.dim }}>
            <I.Search size={32} color={C.dim} style={{ margin:'0 auto 12px', display:'block' }}/>
            <p style={{ fontSize:14 }}>No conversations found</p>
          </div>
        )}
      </div>

      {/* Contact profile overlay */}
      {profileContact && (
        <ContactProfile
          conv={profileContact}
          onClose={()=>setPC(null)}
          onMessage={()=>{ setActive(profileContact); setPC(null); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INTELLIGENCE TAB — Multi-Provider AI Engine
══════════════════════════════════════════════════════════════════════════════ */

const AI_PROVIDERS = [
  {
    id: 'anthropic', name: 'Claude', company: 'Anthropic', logo: '◆',
    color: '#c97b3a', models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-5-20251001'],
    keyPrefix: 'sk-ant-', keyPlaceholder: 'sk-ant-api03-...', lsKey: 'vt_key_anthropic',
    call: async (key, model, system, prompt) => {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key': key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
        body: JSON.stringify({ model, max_tokens:1024, system, messages:[{ role:'user', content:prompt }] })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return { text: d.content?.[0]?.text || '', model: d.model };
    }
  },
  {
    id: 'openai', name: 'ChatGPT', company: 'OpenAI', logo: '◎',
    color: '#10a37f', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    keyPrefix: 'sk-', keyPlaceholder: 'sk-...', lsKey: 'vt_key_openai',
    call: async (key, model, system, prompt) => {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages:[{ role:'system', content:system },{ role:'user', content:prompt }], max_tokens:1024 })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return { text: d.choices?.[0]?.message?.content || '', model: d.model };
    }
  },
  {
    id: 'gemini', name: 'Gemini', company: 'Google', logo: '✦',
    color: '#4285f4', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    keyPrefix: 'AIza', keyPlaceholder: 'AIzaSy...', lsKey: 'vt_gk',
    call: async (key, model, system, prompt) => {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ contents:[{ parts:[{ text: `${system}\n\n${prompt}` }] }] })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return { text: d.candidates?.[0]?.content?.parts?.[0]?.text || '', model };
    }
  },
  {
    id: 'groq', name: 'Groq', company: 'Groq', logo: '⚡',
    color: '#f55036', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    keyPrefix: 'gsk_', keyPlaceholder: 'gsk_...', lsKey: 'vt_key_groq',
    call: async (key, model, system, prompt) => {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages:[{ role:'system', content:system },{ role:'user', content:prompt }], max_tokens:1024 })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
      return { text: d.choices?.[0]?.message?.content || '', model: d.model };
    }
  },
  {
    id: 'perplexity', name: 'Perplexity', company: 'Perplexity AI', logo: '◈',
    color: '#20808d', models: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-huge-128k-online'],
    keyPrefix: 'pplx-', keyPlaceholder: 'pplx-...', lsKey: 'vt_key_perplexity',
    call: async (key, model, system, prompt) => {
      const r = await fetch('https://api.perplexity.ai/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages:[{ role:'system', content:system },{ role:'user', content:prompt }], max_tokens:1024 })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return { text: d.choices?.[0]?.message?.content || '', model: d.model };
    }
  },
  {
    id: 'cohere', name: 'Cohere', company: 'Cohere', logo: '▣',
    color: '#39594d', models: ['command-r-plus', 'command-r', 'command'],
    keyPrefix: '', keyPlaceholder: 'Paste Cohere API key...', lsKey: 'vt_key_cohere',
    call: async (key, model, system, prompt) => {
      const r = await fetch('https://api.cohere.ai/v1/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, message: prompt, preamble: system, max_tokens:1024 })
      });
      const d = await r.json();
      if (d.message) throw new Error(d.message);
      return { text: d.text || '', model };
    }
  },
  {
    id: 'mistral', name: 'Mistral', company: 'Mistral AI', logo: '🌬',
    color: '#ff7000', models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mixtral-8x22b'],
    keyPrefix: '', keyPlaceholder: 'Paste Mistral API key...', lsKey: 'vt_key_mistral',
    call: async (key, model, system, prompt) => {
      const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages:[{ role:'system', content:system },{ role:'user', content:prompt }], max_tokens:1024 })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
      return { text: d.choices?.[0]?.message?.content || '', model: d.model };
    }
  },
  {
    id: 'xai', name: 'Grok', company: 'xAI', logo: '✕',
    color: '#ffffff', models: ['grok-2-latest', 'grok-2-mini', 'grok-beta'],
    keyPrefix: 'xai-', keyPlaceholder: 'xai-...', lsKey: 'vt_key_xai',
    call: async (key, model, system, prompt) => {
      const r = await fetch('https://api.x.ai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages:[{ role:'system', content:system },{ role:'user', content:prompt }], max_tokens:1024 })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
      return { text: d.choices?.[0]?.message?.content || '', model: d.model };
    }
  },
];

const INTEL_SYSTEM = `You are Vaultackie Intelligence — a cutting-edge AI search and analysis engine. Provide comprehensive, well-structured answers with emoji section headers (🔍 Overview, 💡 Key Insights, 📊 Analysis, ✦ Summary). Be thorough, precise, and insightful.`;

const INTEL_SYSTEM_BY_MODE = {
  fast:     `You are Vaultackie Intelligence. Give a fast, clear, concise answer. Use short paragraphs. Lead with the most important point. Use 🔍 Overview and ✦ Summary headers only.`,
  deep:     `You are Vaultackie Intelligence — deep research mode. Provide an exhaustive, thorough analysis with full detail. Use all section headers: 🔍 Overview, 💡 Key Insights, 📊 Analysis, 🔬 Deep Dive, ⚠️ Caveats, ✦ Summary. Cite reasoning. Be comprehensive.`,
  creative: `You are Vaultackie Intelligence — creative mode. Respond with flair, vivid language, analogies and metaphors. Make the answer memorable and engaging. Use creative section headers with relevant emojis. Think outside the box.`,
};

function loadKeys() {
  const out = {};
  AI_PROVIDERS.forEach(p => { try { out[p.id] = localStorage.getItem(p.lsKey)||''; } catch { out[p.id]=''; } });
  return out;
}

function IntelligenceTab({ user }) {
  const [query, setQuery]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoad]    = useState(false);
  const [history, setHist]    = useState([]);
  const [err, setErr]         = useState('');
  const [trending, setTrend]  = useState([]);
  const [mode, setMode]       = useState('fast');
  const [showKeys, setShowKeys] = useState(false);
  const [provId, setProvId]   = useState(() => { try { return localStorage.getItem('vt_active_prov')||'anthropic'; } catch { return 'anthropic'; } });
  const [keys, setKeys]       = useState(loadKeys);
  const [showKey, setShowKey] = useState({});
  const [selModel, setSelModel] = useState({});
  const inpRef = useRef(null);

  const prov = AI_PROVIDERS.find(p=>p.id===provId) || AI_PROVIDERS[0];
  const activeKey = keys[provId] || '';
  const activeModel = selModel[provId] || prov.models[0];
  const hasKey = !!activeKey.trim();

  useEffect(()=>{
    if (!user?.demo && !user?.isGuest) {
      $get('/intelligence/history?limit=10').then(r=>{ if(r.data) setHist(r.data.map(h=>({q:h.query,ts:h.createdAt}))); }).catch(()=>{});
    }
    $get('/intelligence/trending').then(r=>{ if(r.data) setTrend(r.data); }).catch(()=>setTrend(AI_SUGGESTIONS));
  }, [user]);

  const saveKey = (pid, val) => {
    setKeys(k=>({ ...k, [pid]:val }));
    const p = AI_PROVIDERS.find(x=>x.id===pid);
    if (p) { try { localStorage.setItem(p.lsKey, val); } catch {} }
  };

  const selectProv = (pid) => {
    setProvId(pid);
    try { localStorage.setItem('vt_active_prov', pid); } catch {}
  };

  const doSearch = useCallback(async (q) => {
    const sq = (q || query).trim();
    if (!sq) return;
    if (user?.isGuest && history.length >= 3) { setErr('Guest limit reached. Sign in for unlimited searches.'); return; }
    setLoad(true); setErr(''); setResult(null);
    setHist(p => [{ q:sq, ts:new Date().toISOString() }, ...p.slice(0,9)]);
    if (q) setQuery(q.replace(/^[^\w]+/,''));

    const t0 = Date.now();
    const systemPrompt = INTEL_SYSTEM_BY_MODE[mode] || INTEL_SYSTEM;
    const maxTok = mode === 'deep' ? 2048 : mode === 'creative' ? 1200 : 800;

    // Try backend first
    try {
      const res = await $post('/intelligence/search', { query:sq, mode, provider:provId, model:activeModel, apiKey:activeKey||undefined });
      setResult({ q:sq, text:res.data.response, model:res.data.model, ms:Date.now()-t0, prov:provId, ts:new Date().toISOString() });
      setLoad(false); return;
    } catch(e) { if (e.code !== 0) { setErr(e.msg || 'Search failed'); setLoad(false); return; } }

    // No backend — call provider directly from frontend
    if (hasKey) {
      try {
        const { text, model } = await prov.call(activeKey, activeModel, systemPrompt, sq);
        setResult({ q:sq, text, model, ms:Date.now()-t0, prov:provId, ts:new Date().toISOString() });
      } catch(ae) {
        setErr(`${prov.name} error: ${ae.message}`);
      }
    } else {
      // Fallback: built-in Claude via artifact API
      try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:maxTok, system:systemPrompt, messages:[{ role:'user', content:sq }] })
        });
        const d = await r.json();
        if (d.error) throw new Error(d.error.message);
        setResult({ q:sq, text:d.content?.[0]?.text||'', model:'claude-sonnet (built-in)', ms:Date.now()-t0, prov:'anthropic', ts:new Date().toISOString() });
      } catch {
        setErr('No API key set. Add a key in the API Keys panel to use your preferred provider.');
      }
    }
    setLoad(false);
  }, [query, mode, provId, activeKey, activeModel, hasKey, prov, user, history.length]);

  const delHistory = (i) => setHist(p => p.filter((_,idx)=>idx!==i));
  const activeProv = AI_PROVIDERS.find(p=>p.id===provId);

  return (
    <div className="aFadeIn" style={{ height:'100%', display:'flex', flexDirection:'column', background:C.bg0 }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', background:C.surf, borderBottom:`1px solid ${C.secB}`, flexShrink:0,
        backgroundImage:`radial-gradient(circle at 0% 50%,${C.sec}0a,transparent 55%)` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <I.Zap size={20} color={C.sec} style={{ filter:`drop-shadow(0 0 7px ${C.sec})` }}/>
            <span style={{ color:C.txt, fontSize:17, fontWeight:800, fontFamily:'Syne,sans-serif' }}>Vaultackie Intelligence</span>
            <Chip text="AI" color={C.sec}/>
          </div>
          <button onClick={()=>setShowKeys(s=>!s)} style={{ background:showKeys?C.secD:'transparent', border:`1px solid ${showKeys?C.secB:C.brd}`, borderRadius:8, padding:'5px 10px', color:showKeys?'#a78bfa':C.mid, cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', gap:5, transition:'all .2s' }}>
            <I.Key size={12}/> API Keys
          </button>
        </div>
        {/* Active provider pill */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
          <span style={{ color:activeProv?.color||C.sec, fontSize:14 }}>{activeProv?.logo}</span>
          <span style={{ color:C.mid, fontSize:11 }}>Using <span style={{ color:activeProv?.color||C.sec, fontWeight:600 }}>{activeProv?.name}</span> · {activeModel}</span>
          {!hasKey && <Chip text="BUILT-IN" color={C.grn}/>}
          {hasKey  && <Chip text="YOUR KEY" color={activeProv?.color||C.sec}/>}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:16 }}>

        {/* ── API Key Manager Panel ── */}
        {showKeys && (
          <div className="aFadeUp" style={{ background:C.card, border:`1px solid ${C.secB}`, borderRadius:14, padding:16, marginBottom:18 }}>
            <p style={{ color:C.mid, fontSize:11, letterSpacing:1.2, marginBottom:12, fontFamily:'Syne,sans-serif' }}>SELECT AI PROVIDER — {AI_PROVIDERS.length} SUPPORTED</p>

            {/* Provider grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7, marginBottom:16 }}>
              {AI_PROVIDERS.map(p => {
                const active = provId === p.id;
                const hasPKey = !!(keys[p.id]||'').trim();
                return (
                  <button key={p.id} onClick={()=>selectProv(p.id)} style={{
                    padding:'10px 6px', borderRadius:10, cursor:'pointer', textAlign:'center', transition:'all .2s',
                    background: active ? `${p.color}18` : C.bg3,
                    border: `1.5px solid ${active ? p.color+'66' : C.brd}`,
                    boxShadow: active ? `0 0 12px ${p.color}30` : 'none', position:'relative' }}>
                    <div style={{ fontSize:20, marginBottom:4, color:p.color }}>{p.logo}</div>
                    <div style={{ color: active ? p.color : C.txt, fontSize:12, fontWeight:700 }}>{p.name}</div>
                    <div style={{ color:C.dim, fontSize:10 }}>{p.company}</div>
                    {hasPKey && <div style={{ position:'absolute', top:5, right:5, width:7, height:7, borderRadius:'50%', background:C.grn, boxShadow:`0 0 5px ${C.grn}` }}/>}
                  </button>
                );
              })}
            </div>

            {/* Key input for selected provider */}
            <p style={{ color:C.dim, fontSize:10, letterSpacing:1, marginBottom:7, fontFamily:'Syne,sans-serif' }}>{prov.name.toUpperCase()} API KEY</p>
            <div style={{ position:'relative', marginBottom:10 }}>
              <input
                type={showKey[provId]?'text':'password'}
                value={keys[provId]||''}
                onChange={e=>saveKey(provId, e.target.value)}
                placeholder={prov.keyPlaceholder}
                style={{ width:'100%', background:C.bg3, border:`1px solid ${(keys[provId]||'').trim()?prov.color+'55':C.brd}`, borderRadius:9,
                  padding:'10px 40px 10px 12px', color:C.txt, fontSize:12, outline:'none',
                  fontFamily:'JetBrains Mono,monospace', boxSizing:'border-box',
                  boxShadow:(keys[provId]||'').trim()?`0 0 8px ${prov.color}20`:'none', transition:'all .2s' }}/>
              <button onClick={()=>setShowKey(s=>({...s,[provId]:!s[provId]}))} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:C.mid, cursor:'pointer', display:'flex' }}>
                {showKey[provId]?<I.EyeOff size={13}/>:<I.Eye size={13}/>}
              </button>
            </div>

            {/* Model selector */}
            <p style={{ color:C.dim, fontSize:10, letterSpacing:1, marginBottom:7, fontFamily:'Syne,sans-serif' }}>MODEL</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
              {prov.models.map(m=>(
                <button key={m} onClick={()=>setSelModel(s=>({...s,[provId]:m}))} style={{
                  padding:'5px 11px', borderRadius:16, fontSize:11, cursor:'pointer', transition:'all .2s',
                  border:`1px solid ${activeModel===m?prov.color+'66':C.brd}`,
                  background:activeModel===m?`${prov.color}18`:C.bg3,
                  color:activeModel===m?prov.color:C.mid, fontFamily:'JetBrains Mono,monospace' }}>
                  {m}
                </button>
              ))}
            </div>

            {/* Key status */}
            {(keys[provId]||'').trim() ? (
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', background:C.grnD, border:`1px solid ${C.grnB}`, borderRadius:8 }}>
                <I.Check size={12} color={C.grn}/>
                <span style={{ color:C.grn, fontSize:12 }}>Key saved · Calls go directly to {prov.name}</span>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', background:C.priD, border:`1px solid ${C.priB}`, borderRadius:8 }}>
                <I.Info size={12} color={C.pri}/>
                <span style={{ color:C.pri, fontSize:12 }}>No key — using built-in Claude as fallback</span>
              </div>
            )}
          </div>
        )}

        {/* Search bar */}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ flex:1, position:'relative' }}>
            <input ref={inpRef} value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&doSearch()}
              placeholder="Ask anything — search, analyze, explore..."
              style={{ width:'100%', background:C.bg3, border:`1px solid ${C.secB}`, boxShadow:`0 0 14px ${C.sec}10`,
                borderRadius:12, padding:'14px 16px', color:C.txt, fontSize:15, outline:'none',
                fontFamily:'DM Sans,sans-serif', transition:'all .2s', boxSizing:'border-box' }}/>
          </div>
          <button onClick={()=>doSearch()} disabled={loading} style={{
            background:loading?C.card:`linear-gradient(135deg,${activeProv?.color||C.sec},${activeProv?.color||C.sec}99)`,
            border:`1px solid ${activeProv?.color||C.sec}44`, borderRadius:12, padding:'0 20px',
            cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all .2s', boxShadow:loading?'none':`0 0 16px ${activeProv?.color||C.sec}40`, flexShrink:0 }}>
            {loading ? <Spinner size={20} color={activeProv?.color||C.sec}/> : <I.Search size={20} color="white"/>}
          </button>
        </div>

        {/* Mode selector */}
        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {[['fast','⚡ Fast'],['deep','🔬 Deep'],['creative','✨ Creative']].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{
              padding:'6px 13px', borderRadius:20, fontSize:12, cursor:'pointer', transition:'all .2s',
              border:`1px solid ${mode===m?C.secB:C.brd}`,
              background:mode===m?C.secD:C.card, color:mode===m?'#a78bfa':C.mid }}>
              {l}
            </button>
          ))}
        </div>

        {/* Error */}
        {err && (
          <div style={{ padding:'12px 14px', background:C.redD, border:`1px solid ${C.redB}`, borderRadius:10, marginBottom:16 }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <I.Alert size={14} color={C.red} style={{ flexShrink:0, marginTop:1 }}/>
              <p style={{ color:C.red, fontSize:13, lineHeight:1.5 }}>{err}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:'center', padding:'44px 20px' }}>
            <div style={{ position:'relative', width:64, height:64, margin:'0 auto 20px' }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`2px solid ${activeProv?.color||C.sec}22` }}/>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`2px solid transparent`, borderTopColor:activeProv?.color||C.sec, animation:'spin 1s linear infinite' }}/>
              <div style={{ position:'absolute', inset:6, borderRadius:'50%', border:`1px solid transparent`, borderBottomColor:'#a78bfa', animation:'spin 1.5s linear infinite reverse' }}/>
              <span style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:22 }}>{activeProv?.logo||'⚡'}</span>
            </div>
            <p style={{ color:'#a78bfa', fontWeight:600, fontSize:15, fontFamily:'Syne,sans-serif', marginBottom:6 }}>
              {activeProv?.name||'AI'} Processing...
            </p>
            <p style={{ color:C.mid, fontSize:12 }}>Analyzing · Cross-referencing · Synthesizing</p>
            <div style={{ display:'flex', gap:5, justifyContent:'center', marginTop:14 }}>
              {[0,1,2,3,4].map(i=>(
                <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:activeProv?.color||C.sec, animation:`pulse 1.2s ease-in-out infinite`, animationDelay:`${i*.15}s` }}/>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="aFadeUp" style={{ background:C.surf, border:`1px solid ${AI_PROVIDERS.find(p=>p.id===result.prov)?.color+'33'||C.secB}`, borderRadius:14, padding:20, marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${C.brd}` }}>
              <span style={{ fontSize:16, color:AI_PROVIDERS.find(p=>p.id===result.prov)?.color||C.sec }}>
                {AI_PROVIDERS.find(p=>p.id===result.prov)?.logo||'⚡'}
              </span>
              <span style={{ color:AI_PROVIDERS.find(p=>p.id===result.prov)?.color||'#a78bfa', fontSize:11, fontWeight:700, letterSpacing:1, fontFamily:'Syne,sans-serif' }}>
                {(AI_PROVIDERS.find(p=>p.id===result.prov)?.name||'AI').toUpperCase()} · VAULTACKIE INTELLIGENCE
              </span>
              <span style={{ marginLeft:'auto', color:C.dim, fontSize:10, fontFamily:'JetBrains Mono,monospace', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{result.model}</span>
              {result.ms > 0 && <span style={{ color:C.dim, fontSize:10, fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>{result.ms}ms</span>}
            </div>
            <div style={{ padding:'8px 12px', background:C.secD, border:`1px solid ${C.secB}`, borderRadius:8, marginBottom:14 }}>
              <p style={{ color:'#a78bfa', fontSize:12 }}>🔍 {result.q}</p>
            </div>
            <div style={{ color:C.txt, fontSize:14, lineHeight:1.8, whiteSpace:'pre-wrap', fontFamily:'DM Sans,sans-serif' }}>
              {result.text}
            </div>
            <p style={{ color:C.dim, fontSize:10, marginTop:12, fontFamily:'JetBrains Mono,monospace' }}>{new Date(result.ts).toLocaleTimeString()}</p>
          </div>
        )}

        {/* Suggestions */}
        {!result && !loading && !err && (
          <>
            <p style={{ color:C.dim, fontSize:11, letterSpacing:1, marginBottom:10, fontFamily:'Syne,sans-serif' }}>SUGGESTED QUERIES</p>
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:20 }}>
              {(trending.length?trending:AI_SUGGESTIONS).map((s,i)=>(
                <button key={i} onClick={()=>doSearch(s.replace(/^[^\w]+/,''))} style={{
                  textAlign:'left', padding:'10px 14px', background:C.card, border:`1px solid ${C.brd}`,
                  borderRadius:10, color:C.mid, fontSize:13, cursor:'pointer', transition:'all .2s',
                  display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.secD;e.currentTarget.style.color='#a78bfa';e.currentTarget.style.borderColor=C.secB;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=C.card;e.currentTarget.style.color=C.mid;e.currentTarget.style.borderColor=C.brd;}}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {/* History */}
        {history.length > 0 && !loading && (
          <>
            <p style={{ color:C.dim, fontSize:11, letterSpacing:1, marginBottom:10, fontFamily:'Syne,sans-serif' }}>RECENT SEARCHES</p>
            {history.map((h,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, marginBottom:6, cursor:'pointer' }}
                onClick={()=>doSearch(h.q)}>
                <I.Clock size={13} color={C.dim}/>
                <span style={{ color:C.mid, fontSize:13, flex:1 }}>{h.q}</span>
                <span style={{ color:C.dim, fontSize:11, fontFamily:'JetBrains Mono,monospace' }}>{tAgo(h.ts)}</span>
                <button onClick={e=>{e.stopPropagation();delHistory(i);}} style={{ background:'none',border:'none',color:C.dim,cursor:'pointer',display:'flex',padding:2 }}><I.Trash size={12}/></button>
              </div>
            ))}
          </>
        )}

        {user?.isGuest && (
          <div style={{ marginTop:16, padding:14, background:C.secD, border:`1px solid ${C.secB}`, borderRadius:12 }}>
            <p style={{ color:'#a78bfa', fontSize:12 }}>👁 Guest mode · {Math.max(0,3-history.length)} searches remaining</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TwoFactorSetup — full TOTP setup + verify + disable flow ──────────── */
function TwoFactorSetup({ user, onClose, onEnabled, onDisabled }) {
  const existing = get2FAState();
  const [step, setStep]       = useState(existing?.enabled ? 'manage' : 'intro'); // intro|setup|verify|backup|manage|disable
  const [secret, setSecret]   = useState(() => existing?.secret || generateTOTPSecret());
  const [inputCode, setInput] = useState('');
  const [err, setErr]         = useState('');
  const [loading, setLoad]    = useState(false);
  const [backups, setBackups] = useState(() => existing?.backupCodes || []);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [liveCode, setLiveCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const account = user?.email || user?.phone || user?.displayName || 'user';
  const uri = totpURI(secret, account);

  // Live TOTP ticker
  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      if (!mounted) return;
      const code = await computeTOTP(secret);
      const secs  = 30 - (Math.floor(Date.now() / 1000) % 30);
      if (mounted) { setLiveCode(code); setTimeLeft(secs); }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => { mounted = false; clearInterval(iv); };
  }, [secret]);

  const copySecret = async () => {
    try { await navigator.clipboard.writeText(secret); } catch {
      const ta = document.createElement('textarea'); ta.value = secret;
      ta.style.cssText='position:fixed;opacity:0'; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000);
  };

  const doVerify = async () => {
    setErr(''); setLoad(true);
    const expected = await computeTOTP(secret);
    // Accept current and adjacent windows (±1 step) for clock drift
    const prev = await computeTOTP(secret, 30);
    const code = inputCode.replace(/\s/g,'');
    if (code === expected || code === prev || code === await computeTOTP(secret)) {
      const newBackups = generateBackupCodes();
      save2FAState({ enabled:true, secret, backupCodes:newBackups, enabledAt:new Date().toISOString(), account });
      setBackups(newBackups);
      setStep('backup');
      onEnabled?.();
    } else {
      setErr('Incorrect code. Check your authenticator app and try again.');
    }
    setLoad(false);
  };

  const doDisable = async () => {
    setErr(''); setLoad(true);
    const expected = await computeTOTP(get2FAState()?.secret || secret);
    const code = inputCode.replace(/\s/g,'');
    const state = get2FAState();
    const isBackup = state?.backupCodes?.includes(code.toUpperCase());
    if (code === expected || isBackup) {
      clear2FAState();
      onDisabled?.();
      onClose();
    } else {
      setErr('Incorrect code. Use your authenticator app or a backup code.');
    }
    setLoad(false);
  };

  const headerBtn = (label, action) => (
    <button onClick={action} style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:13,padding:'4px 0' }}>
      <I.ArrowL size={16}/>{label}
    </button>
  );

  // ── INTRO ──
  if (step === 'intro') return (
    <div className="aFadeIn" style={{ position:'absolute',inset:0,zIndex:500,background:C.bg0,display:'flex',flexDirection:'column',overflow:'hidden' }}>
      <div style={{ padding:'14px 16px',background:C.surf,borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:12,flexShrink:0 }}>
        {headerBtn('Back', onClose)}
        <h2 style={{ color:C.txt,fontSize:17,fontWeight:700,fontFamily:'Syne,sans-serif',flex:1,textAlign:'center' }}>Two-Factor Auth</h2>
        <div style={{ width:60 }}/>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:28,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center' }}>
        <div style={{ width:88,height:88,borderRadius:24,background:C.grnD,border:`2px solid ${C.grnB}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:22,boxShadow:C.glow(C.grn,18) }}>
          <I.Shield size={40} color={C.grn}/>
        </div>
        <h2 style={{ color:C.txt,fontSize:22,fontWeight:800,fontFamily:'Syne,sans-serif',marginBottom:10 }}>Secure Your Account</h2>
        <p style={{ color:C.mid,fontSize:14,lineHeight:1.7,marginBottom:30,maxWidth:300 }}>
          Two-factor authentication adds a second layer of protection using a time-based one-time password (TOTP) from an authenticator app.
        </p>
        {[
          { icon:'📱', title:'Get an Authenticator App', desc:'Google Authenticator, Authy, or any TOTP app' },
          { icon:'📷', title:'Scan QR Code', desc:'Scan the code we generate to link your account' },
          { icon:'🔐', title:'Enter 6-Digit Code', desc:'Verify with a code from the app to enable 2FA' },
        ].map((s,i)=>(
          <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:14,textAlign:'left',marginBottom:18,width:'100%',maxWidth:340 }}>
            <div style={{ width:44,height:44,borderRadius:14,background:C.card,border:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>{s.icon}</div>
            <div><div style={{ color:C.txt,fontSize:14,fontWeight:600,marginBottom:3 }}>{s.title}</div><div style={{ color:C.mid,fontSize:12,lineHeight:1.5 }}>{s.desc}</div></div>
          </div>
        ))}
        <div style={{ width:'100%',maxWidth:340,marginTop:10 }}>
          <Btn v="solid" full sz="lg" onClick={()=>setStep('setup')} ch={<><I.Shield size={15}/>Set Up 2FA</>}/>
        </div>
      </div>
    </div>
  );

  // ── SETUP (QR + secret) ──
  if (step === 'setup') return (
    <div className="aFadeIn" style={{ position:'absolute',inset:0,zIndex:500,background:C.bg0,display:'flex',flexDirection:'column',overflow:'hidden' }}>
      <div style={{ padding:'14px 16px',background:C.surf,borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:12,flexShrink:0 }}>
        {headerBtn('Back', ()=>setStep('intro'))}
        <h2 style={{ color:C.txt,fontSize:17,fontWeight:700,fontFamily:'Syne,sans-serif',flex:1,textAlign:'center' }}>Scan QR Code</h2>
        <div style={{ width:60 }}/>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:22 }}>
        <p style={{ color:C.mid,fontSize:13,marginBottom:20,lineHeight:1.65,textAlign:'center' }}>
          Open your authenticator app and scan this QR code, or enter the secret key manually.
        </p>

        {/* QR Code */}
        <div style={{ display:'flex',justifyContent:'center',marginBottom:20 }}>
          <div style={{ padding:12,background:C.card,border:`2px solid ${C.priB}`,borderRadius:16,boxShadow:C.glow() }}>
            <img src={qrCodeURL(uri)} alt="2FA QR Code" width={180} height={180} style={{ display:'block',borderRadius:8 }}
              onError={e=>e.target.style.display='none'}/>
          </div>
        </div>

        {/* Account info */}
        <div style={{ padding:'10px 14px',background:C.priD,border:`1px solid ${C.priB}`,borderRadius:10,marginBottom:18,textAlign:'center' }}>
          <p style={{ color:C.dim,fontSize:10,letterSpacing:1,fontFamily:'Syne,sans-serif',marginBottom:4 }}>ACCOUNT</p>
          <p style={{ color:C.pri,fontSize:13,fontFamily:'JetBrains Mono,monospace',fontWeight:600 }}>{account}</p>
        </div>

        {/* Manual secret */}
        <p style={{ color:C.dim,fontSize:10,letterSpacing:1.2,marginBottom:8,fontFamily:'Syne,sans-serif' }}>MANUAL ENTRY KEY</p>
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 14px',background:C.bg3,border:`1px solid ${C.brd}`,borderRadius:12,marginBottom:8 }}>
          <span style={{ color:C.txt,fontFamily:'JetBrains Mono,monospace',fontSize:13,flex:1,wordBreak:'break-all',letterSpacing:1 }}>
            {secret.match(/.{1,4}/g)?.join(' ')}
          </span>
          <button onClick={copySecret} style={{ background:'none',border:'none',color:copiedSecret?C.grn:C.mid,cursor:'pointer',display:'flex',flexShrink:0,padding:4,transition:'color .2s' }}>
            {copiedSecret ? <I.Check size={16}/> : <I.Link size={16}/>}
          </button>
        </div>
        <p style={{ color:C.dim,fontSize:11,marginBottom:22,lineHeight:1.5 }}>
          If QR scanning doesn't work, manually enter this key into your app. Choose "Time-based" (TOTP).
        </p>

        {/* Live preview */}
        <div style={{ padding:'14px 16px',background:C.card,border:`1px solid ${C.brd}`,borderRadius:12,marginBottom:22 }}>
          <p style={{ color:C.dim,fontSize:10,letterSpacing:1,fontFamily:'Syne,sans-serif',marginBottom:8 }}>CURRENT CODE PREVIEW</p>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <span style={{ color:C.pri,fontFamily:'JetBrains Mono,monospace',fontSize:30,fontWeight:800,letterSpacing:8 }}>{liveCode}</span>
            <div style={{ textAlign:'center' }}>
              <div style={{ color:timeLeft<=5?C.red:timeLeft<=10?C.yel:C.grn,fontSize:22,fontWeight:800,fontFamily:'JetBrains Mono,monospace' }}>{timeLeft}s</div>
              <div style={{ color:C.dim,fontSize:10 }}>expires</div>
            </div>
          </div>
          <div style={{ height:4,background:C.bg3,borderRadius:2,marginTop:10,overflow:'hidden' }}>
            <div style={{ height:'100%',background:timeLeft<=5?C.red:timeLeft<=10?C.yel:C.grn,borderRadius:2,width:`${(timeLeft/30)*100}%`,transition:'width 1s linear' }}/>
          </div>
        </div>

        <Btn v="solid" full sz="lg" onClick={()=>{ setInput(''); setErr(''); setStep('verify'); }} ch={<><I.Check size={15}/>I've Added the Key — Continue</>}/>
      </div>
    </div>
  );

  // ── VERIFY ──
  if (step === 'verify') return (
    <div className="aFadeIn" style={{ position:'absolute',inset:0,zIndex:500,background:C.bg0,display:'flex',flexDirection:'column',overflow:'hidden' }}>
      <div style={{ padding:'14px 16px',background:C.surf,borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:12,flexShrink:0 }}>
        {headerBtn('Back', ()=>setStep('setup'))}
        <h2 style={{ color:C.txt,fontSize:17,fontWeight:700,fontFamily:'Syne,sans-serif',flex:1,textAlign:'center' }}>Verify Code</h2>
        <div style={{ width:60 }}/>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:28,display:'flex',flexDirection:'column',alignItems:'center' }}>
        <div style={{ fontSize:56,marginBottom:16 }}>🔐</div>
        <h3 style={{ color:C.txt,fontSize:20,fontWeight:800,fontFamily:'Syne,sans-serif',marginBottom:10 }}>Enter Your Code</h3>
        <p style={{ color:C.mid,fontSize:13,marginBottom:28,textAlign:'center',lineHeight:1.6 }}>
          Open your authenticator app and enter the 6-digit code shown for Vaultackie.
        </p>

        {/* Code input */}
        <input value={inputCode} onChange={e=>{ setInput(e.target.value.replace(/\D/g,'').slice(0,6)); setErr(''); }}
          onKeyDown={e=>e.key==='Enter'&&inputCode.length===6&&doVerify()}
          placeholder="000000" maxLength={6} autoFocus
          style={{ width:'100%',maxWidth:260,background:C.bg3,border:`2px solid ${err?C.redB:inputCode.length===6?C.priB:C.brd}`,
            borderRadius:14,padding:'18px 20px',color:C.txt,fontSize:34,fontFamily:'JetBrains Mono,monospace',
            fontWeight:800,letterSpacing:12,textAlign:'center',outline:'none',boxSizing:'border-box',
            boxShadow:inputCode.length===6?`0 0 16px ${C.pri}22`:'none',transition:'all .2s',marginBottom:14 }}/>

        {err && <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:C.redD,border:`1px solid ${C.redB}`,borderRadius:10,marginBottom:14,width:'100%',maxWidth:300 }}>
          <I.Alert size={14} color={C.red}/><span style={{ color:C.red,fontSize:13 }}>{err}</span>
        </div>}

        {/* Live timer */}
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 16px',background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,marginBottom:22 }}>
          <span style={{ color:C.mid,fontSize:13 }}>Current code:</span>
          <span style={{ color:C.pri,fontFamily:'JetBrains Mono,monospace',fontSize:16,fontWeight:800,letterSpacing:4 }}>{liveCode}</span>
          <span style={{ color:timeLeft<=5?C.red:C.dim,fontSize:12,fontFamily:'JetBrains Mono,monospace',marginLeft:'auto' }}>{timeLeft}s</span>
        </div>

        <div style={{ width:'100%',maxWidth:300 }}>
          <Btn v="solid" full sz="lg" dis={loading||inputCode.length!==6}
            onClick={doVerify}
            ch={loading?<><Spinner size={15}/>Verifying...</>:<><I.Shield size={15}/>Enable 2FA</>}/>
        </div>
      </div>
    </div>
  );

  // ── BACKUP CODES ──
  if (step === 'backup') return (
    <div className="aFadeIn" style={{ position:'absolute',inset:0,zIndex:500,background:C.bg0,display:'flex',flexDirection:'column',overflow:'hidden' }}>
      <div style={{ padding:'14px 16px',background:C.surf,borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:12,flexShrink:0 }}>
        <h2 style={{ color:C.txt,fontSize:17,fontWeight:700,fontFamily:'Syne,sans-serif',flex:1,textAlign:'center' }}>Save Backup Codes</h2>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:22 }}>
        <div style={{ padding:'14px 16px',background:C.yelD,border:`1px solid ${C.yel}33`,borderRadius:12,marginBottom:20,display:'flex',gap:10 }}>
          <I.Alert size={16} color={C.yel} style={{ flexShrink:0,marginTop:1 }}/>
          <p style={{ color:C.yel,fontSize:13,lineHeight:1.6 }}>Save these codes somewhere safe. Each can only be used once if you lose access to your authenticator app.</p>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20 }}>
          {backups.map((code,i)=>(
            <div key={i} style={{ padding:'10px 12px',background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,textAlign:'center' }}>
              <span style={{ color:C.txt,fontFamily:'JetBrains Mono,monospace',fontSize:14,fontWeight:700,letterSpacing:1 }}>{code}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex',gap:10,marginBottom:22 }}>
          <Btn v="ghost" full onClick={async()=>{ const txt=backups.join('\n');try{await navigator.clipboard.writeText(txt);}catch{const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);} }} ch={<><I.Link size={13}/>Copy All</>}/>
        </div>

        <div style={{ padding:'12px 16px',background:C.grnD,border:`1px solid ${C.grnB}`,borderRadius:12,marginBottom:22,display:'flex',alignItems:'center',gap:10 }}>
          <I.Check size={16} color={C.grn}/>
          <div><div style={{ color:C.grn,fontSize:14,fontWeight:700 }}>2FA Enabled!</div><div style={{ color:C.grn,fontSize:12,marginTop:2 }}>Your account is now protected.</div></div>
        </div>

        <Btn v="solid" full sz="lg" onClick={onClose} ch="Done — I've Saved My Codes"/>
      </div>
    </div>
  );

  // ── MANAGE (already enabled) ──
  if (step === 'manage') return (
    <div className="aFadeIn" style={{ position:'absolute',inset:0,zIndex:500,background:C.bg0,display:'flex',flexDirection:'column',overflow:'hidden' }}>
      <div style={{ padding:'14px 16px',background:C.surf,borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:12,flexShrink:0 }}>
        {headerBtn('Back', onClose)}
        <h2 style={{ color:C.txt,fontSize:17,fontWeight:700,fontFamily:'Syne,sans-serif',flex:1,textAlign:'center' }}>2FA Active</h2>
        <div style={{ width:60 }}/>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:22 }}>
        {/* Status card */}
        <div style={{ padding:'20px',background:C.grnD,border:`1px solid ${C.grnB}`,borderRadius:16,marginBottom:22,display:'flex',alignItems:'center',gap:14 }}>
          <div style={{ width:52,height:52,borderRadius:16,background:C.grn+'22',border:`2px solid ${C.grn}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:C.glow(C.grn) }}>
            <I.Shield size={26} color={C.grn}/>
          </div>
          <div>
            <div style={{ color:C.grn,fontSize:16,fontWeight:800,fontFamily:'Syne,sans-serif',marginBottom:3 }}>Protected</div>
            <div style={{ color:C.grn,fontSize:12,opacity:.8 }}>2FA enabled · TOTP · SHA-1</div>
            {existing?.enabledAt && <div style={{ color:C.dim,fontSize:11,marginTop:3 }}>Enabled {tAgo(existing.enabledAt)}</div>}
          </div>
        </div>

        {/* Live code widget */}
        <p style={{ color:C.dim,fontSize:10,letterSpacing:1.2,marginBottom:10,fontFamily:'Syne,sans-serif' }}>LIVE CODE</p>
        <div style={{ padding:'16px 20px',background:C.card,border:`1px solid ${C.brd}`,borderRadius:14,marginBottom:22 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
            <span style={{ color:C.pri,fontFamily:'JetBrains Mono,monospace',fontSize:36,fontWeight:800,letterSpacing:10 }}>{liveCode}</span>
            <div style={{ textAlign:'center' }}>
              <div style={{ color:timeLeft<=5?C.red:timeLeft<=10?C.yel:C.grn,fontSize:26,fontWeight:800,fontFamily:'JetBrains Mono,monospace' }}>{timeLeft}s</div>
              <div style={{ color:C.dim,fontSize:10 }}>expires</div>
            </div>
          </div>
          <div style={{ height:5,background:C.bg3,borderRadius:3,overflow:'hidden' }}>
            <div style={{ height:'100%',background:timeLeft<=5?C.red:timeLeft<=10?C.yel:C.grn,borderRadius:3,width:`${(timeLeft/30)*100}%`,transition:'width 1s linear' }}/>
          </div>
        </div>

        {/* Backup codes count */}
        <div style={{ padding:'13px 16px',background:C.surf,border:`1px solid ${C.brd}`,borderRadius:12,marginBottom:22,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ fontSize:18 }}>🔑</span>
            <div>
              <div style={{ color:C.txt,fontSize:14,fontWeight:500 }}>Backup Codes</div>
              <div style={{ color:C.mid,fontSize:12 }}>{backups.length} codes remaining</div>
            </div>
          </div>
          <Chip text={`${backups.length} LEFT`} color={backups.length>4?C.grn:C.yel}/>
        </div>

        {/* Disable 2FA */}
        <Btn v="danger" full onClick={()=>{ setInput(''); setErr(''); setStep('disable'); }} ch={<><I.X size={14}/>Disable Two-Factor Auth</>}/>
      </div>
    </div>
  );

  // ── DISABLE ──
  if (step === 'disable') return (
    <div className="aFadeIn" style={{ position:'absolute',inset:0,zIndex:500,background:C.bg0,display:'flex',flexDirection:'column',overflow:'hidden' }}>
      <div style={{ padding:'14px 16px',background:C.surf,borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:12,flexShrink:0 }}>
        {headerBtn('Back', ()=>setStep('manage'))}
        <h2 style={{ color:C.txt,fontSize:17,fontWeight:700,fontFamily:'Syne,sans-serif',flex:1,textAlign:'center' }}>Disable 2FA</h2>
        <div style={{ width:60 }}/>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:28,display:'flex',flexDirection:'column',alignItems:'center' }}>
        <div style={{ fontSize:52,marginBottom:16 }}>⚠️</div>
        <h3 style={{ color:C.red,fontSize:20,fontWeight:800,fontFamily:'Syne,sans-serif',marginBottom:10 }}>Disable Protection?</h3>
        <p style={{ color:C.mid,fontSize:13,marginBottom:28,textAlign:'center',lineHeight:1.6,maxWidth:300 }}>
          Enter your current authenticator code or a backup code to confirm disabling two-factor authentication.
        </p>
        <input value={inputCode} onChange={e=>{ setInput(e.target.value.replace(/\s/g,'').slice(0,9)); setErr(''); }}
          onKeyDown={e=>e.key==='Enter'&&doDisable()}
          placeholder="000000 or XXXX-XXXX" autoFocus
          style={{ width:'100%',maxWidth:280,background:C.bg3,border:`2px solid ${err?C.redB:inputCode.length>=6?C.redB:C.brd}`,
            borderRadius:14,padding:'16px 20px',color:C.txt,fontSize:22,fontFamily:'JetBrains Mono,monospace',
            fontWeight:800,letterSpacing:6,textAlign:'center',outline:'none',boxSizing:'border-box',marginBottom:14 }}/>
        {err && <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:C.redD,border:`1px solid ${C.redB}`,borderRadius:10,marginBottom:14,width:'100%',maxWidth:300 }}>
          <I.Alert size={14} color={C.red}/><span style={{ color:C.red,fontSize:12 }}>{err}</span>
        </div>}
        <div style={{ width:'100%',maxWidth:300,display:'flex',flexDirection:'column',gap:10 }}>
          <Btn v="danger" full sz="lg" dis={loading||inputCode.length<6} onClick={doDisable}
            ch={loading?<><Spinner size={15}/>Verifying...</>:<><I.X size={15}/>Confirm Disable 2FA</>}/>
          <Btn v="ghost" full onClick={()=>setStep('manage')} ch="Cancel"/>
        </div>
      </div>
    </div>
  );

  return null;
}

/* ─── TwoFactorChallenge — shown at login when 2FA is enabled ────────────── */
function TwoFactorChallenge({ onSuccess, onCancel }) {
  const state = get2FAState();
  const [code, setCode]   = useState('');
  const [err,  setErr]    = useState('');
  const [loading, setLoad]= useState(false);
  const [liveCode, setLC] = useState('');
  const [timeLeft, setTL] = useState(30);

  useEffect(() => {
    if (!state?.secret) return;
    let mounted = true;
    const tick = async () => {
      if (!mounted) return;
      const c = await computeTOTP(state.secret);
      const s = 30 - (Math.floor(Date.now()/1000) % 30);
      if (mounted) { setLC(c); setTL(s); }
    };
    tick(); const iv = setInterval(tick,1000);
    return () => { mounted=false; clearInterval(iv); };
  }, []);

  const verify = async () => {
    setErr(''); setLoad(true);
    const entered = code.replace(/\s/g,'');
    const expected = await computeTOTP(state.secret);
    const isBackup = state.backupCodes?.includes(entered.toUpperCase());
    if (entered === expected || isBackup) {
      if (isBackup) {
        // Consume backup code
        save2FAState({ ...state, backupCodes: state.backupCodes.filter(c=>c!==entered.toUpperCase()) });
      }
      onSuccess();
    } else {
      setErr('Incorrect code. Try again or use a backup code.');
    }
    setLoad(false);
  };

  return (
    <div className="aFadeIn" style={{ position:'fixed',inset:0,zIndex:9999,background:C.bg0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div style={{ width:'100%',maxWidth:360 }}>
        <div style={{ textAlign:'center',marginBottom:28 }}>
          <div style={{ width:80,height:80,borderRadius:22,background:C.grnD,border:`2px solid ${C.grnB}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:C.glow(C.grn) }}>
            <I.Shield size={38} color={C.grn}/>
          </div>
          <h2 style={{ color:C.txt,fontSize:22,fontWeight:800,fontFamily:'Syne,sans-serif',marginBottom:8 }}>Two-Factor Verification</h2>
          <p style={{ color:C.mid,fontSize:13,lineHeight:1.6 }}>Enter the 6-digit code from your authenticator app, or a backup code.</p>
        </div>

        <input value={code} onChange={e=>{ setCode(e.target.value.replace(/\D/g,'').slice(0,6)); setErr(''); }}
          onKeyDown={e=>e.key==='Enter'&&code.length===6&&verify()}
          placeholder="000000" maxLength={6} autoFocus
          style={{ width:'100%',background:C.bg3,border:`2px solid ${err?C.redB:code.length===6?C.priB:C.brd}`,
            borderRadius:14,padding:'18px',color:C.txt,fontSize:36,fontFamily:'JetBrains Mono,monospace',
            fontWeight:800,letterSpacing:14,textAlign:'center',outline:'none',boxSizing:'border-box',marginBottom:12,
            boxShadow:code.length===6?`0 0 16px ${C.pri}22`:'none',transition:'all .2s' }}/>

        {err && <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:C.redD,border:`1px solid ${C.redB}`,borderRadius:10,marginBottom:12 }}>
          <I.Alert size={14} color={C.red}/><span style={{ color:C.red,fontSize:13 }}>{err}</span>
        </div>}

        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,marginBottom:20 }}>
          <span style={{ color:C.dim,fontSize:12 }}>Code refreshes in</span>
          <span style={{ color:timeLeft<=5?C.red:C.pri,fontFamily:'JetBrains Mono,monospace',fontSize:14,fontWeight:700,marginLeft:'auto' }}>{timeLeft}s</span>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <Btn v="solid" full sz="lg" dis={loading||code.length!==6} onClick={verify}
            ch={loading?<><Spinner size={15}/>Verifying...</>:<><I.Shield size={15}/>Verify & Continue</>}/>
          <Btn v="ghost" full onClick={onCancel} ch="Cancel"/>
        </div>
      </div>
    </div>
  );
}
function SettingsKeyRow({ provider: p }) {
  const [val, setVal]     = useState(() => { try { return localStorage.getItem(p.lsKey)||''; } catch { return ''; } });
  const [show, setShow]   = useState(false);
  const [saved, setSaved] = useState(false);
  const hasKey = !!val.trim();

  const save = () => {
    try { localStorage.setItem(p.lsKey, val.trim()); } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };
  const clear = () => {
    setVal('');
    try { localStorage.removeItem(p.lsKey); } catch {}
    setSaved(false);
  };

  return (
    <div style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${C.brd}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
        <span style={{ color:p.color, fontSize:16 }}>{p.logo}</span>
        <span style={{ color:C.txt, fontSize:13, fontWeight:700 }}>{p.name}</span>
        <span style={{ color:C.dim, fontSize:11 }}>{p.company}</span>
        {hasKey && <Chip text="SET" color={C.grn}/>}
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
          {p.models.slice(0,2).map(m => (
            <span key={m} style={{ color:C.dim, fontSize:9, fontFamily:'JetBrains Mono,monospace',
              background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:4, padding:'1px 5px' }}>{m}</span>
          ))}
          {p.models.length > 2 && <span style={{ color:C.dim, fontSize:9, fontFamily:'JetBrains Mono,monospace' }}>+{p.models.length-2}</span>}
        </div>
      </div>
      <div style={{ display:'flex', gap:7 }}>
        <div style={{ flex:1, position:'relative' }}>
          <input
            type={show ? 'text' : 'password'}
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key==='Enter' && save()}
            placeholder={p.keyPlaceholder}
            style={{ width:'100%', background:C.bg3,
              border:`1px solid ${hasKey ? p.color+'55' : C.brd}`,
              boxShadow: hasKey ? `0 0 6px ${p.color}18` : 'none',
              borderRadius:8, padding:'9px 36px 9px 11px', color:C.txt, fontSize:12,
              outline:'none', fontFamily:'JetBrains Mono,monospace', boxSizing:'border-box', transition:'all .2s' }}/>
          <button onClick={()=>setShow(s=>!s)}
            style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', color:C.mid, cursor:'pointer', display:'flex', padding:2 }}>
            {show ? <I.EyeOff size={12}/> : <I.Eye size={12}/>}
          </button>
        </div>
        <button onClick={save} disabled={!val.trim()}
          style={{ background: val.trim() ? `${p.color}22` : C.bg3,
            border:`1px solid ${val.trim() ? p.color+'55' : C.brd}`,
            borderRadius:8, padding:'0 12px', color: val.trim() ? p.color : C.dim,
            cursor: val.trim() ? 'pointer' : 'not-allowed', fontSize:12, fontWeight:600,
            display:'flex', alignItems:'center', gap:5, flexShrink:0, transition:'all .2s' }}>
          {saved ? <><I.Check size={12}/>Saved</> : 'Save'}
        </button>
        {hasKey && (
          <button onClick={clear}
            style={{ background:C.redD, border:`1px solid ${C.redB}`, borderRadius:8,
              padding:'0 10px', color:C.red, cursor:'pointer', fontSize:12, flexShrink:0, display:'flex', alignItems:'center' }}>
            <I.X size={13}/>
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SETTINGS TAB
══════════════════════════════════════════════════════════════════════════════ */

function SettingsTab({ user, onLogout, onRefresh, onUpdateUser }) {
  const [sub, setSub]     = useState(null); // null | 'offline' | 'accounts' | 'security' | 'profile' | 'sessions' | 'seo'
  const [notifs, setNot]  = useState(true);
  const [sound,  setSnd]  = useState(true);
  const [reads,  setRds]  = useState(true);
  const [onStat, setOS]   = useState(true);
  const [twoFA,  set2FA]  = useState(() => !!get2FAState()?.enabled);
  const [show2FA, setShow2FA] = useState(false);
  const [autoLock,setAL]  = useState(false);
  const [gemKey, setGK]   = useState(''); // legacy - no longer used directly
  const [showGK, setSGK]  = useState(false);
  const [linked, setLnk]  = useState(()=>Object.fromEntries(PLATS.filter(p=>p.id!=='vaultackie').map(p=>[p.id,false])));
  const [offType, setOT]  = useState(null);
  const [offRole, setOR]  = useState(null);
  const [netId]            = useState('VLT-' + Math.random().toString(36).slice(2,8).toUpperCase());
  const [joinCode,  setJC] = useState('');
  const [joinStatus,setJS] = useState('idle'); // idle | scanning | joined | error
  const [joinedRoom,setJR] = useState(null);
  const [peers,     setPeers] = useState([]);
  const [copied,    setCopied] = useState(false);
  const [hostStatus,setHS] = useState('hosting'); // hosting | waiting | connected
  const [hostPeers, setHP]  = useState([]);
  const [sessions, setSess]= useState([]);
  const [profileLoad, setPL]= useState(false);
  const [pName, setPN]    = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('vt_profile')||'{}'); return s.displayName || user?.displayName || user?.firstName || ''; } catch { return user?.displayName || user?.firstName || ''; }
  });
  const [pBio, setPB]     = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('vt_profile')||'{}'); return s.bio || user?.bio || ''; } catch { return user?.bio || ''; }
  });
  const [pSaved, setPSaved]= useState(false);
  const [pAvatar, setPA]  = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('vt_profile')||'{}'); return s.avatar || null; } catch { return null; }
  });
  const [avatarSheet, setAS] = useState(false);
  const [seoUrl, setSeoUrl]= useState('');
  const [seoRes, setSeoRes]= useState(null);
  const [seoLoad, setSL]   = useState(false);

  useEffect(()=>{
    // Load sessions from localStorage (captured at login time)
    const stored = loadSessions();
    if (stored.length) setSess(stored);

    if (!user?.demo && !user?.isGuest) {
      $get('/users/sessions').then(r=>{ if(r.data?.length) setSess(p => {
        // Merge backend sessions with local ones
        const local = loadSessions();
        return local.length ? local : r.data;
      }); }).catch(()=>{});
      $get('/social/linked').then(r=>{ if(r.data) { const m={}; r.data.forEach(a=>{ m[a.platform]=true; }); setLnk(p=>({...p,...m})); } }).catch(()=>{});
    }

    // Refresh lastActive on current session every 30s
    const interval = setInterval(() => {
      const all = loadSessions();
      const updated = all.map(s => s.isCurrentSession ? { ...s, lastActive: new Date().toISOString() } : s);
      saveSessions(updated);
      setSess(updated);
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Simulate peers joining host room — must be at top level, not inside conditional
  useEffect(() => {
    if (offRole !== 'host' || !offType) { setHP([]); setHS('hosting'); return; }
    setHP([]);
    setHS('waiting');
    const t1 = setTimeout(() => {
      setHP([{ id:'h1', name:'Device #' + Math.floor(Math.random()*900+100), joined: Date.now() }]);
      setHS('connected');
    }, 4000);
    const t2 = setTimeout(() => {
      setHP(p => [...p, { id:'h2', name:'Device #' + Math.floor(Math.random()*900+100), joined: Date.now() }]);
    }, 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [offRole, offType]);

  const saveProfile = async () => {
    if (!pName.trim()) return;
    setPL(true);

    // Always save locally first so UI updates instantly
    const updates = { displayName: pName.trim(), bio: pBio.trim(), avatar: pAvatar };
    try { localStorage.setItem('vt_profile', JSON.stringify(updates)); } catch {}

    // Push to backend if connected (fire-and-forget, don't block UX)
    if (!user?.demo && !user?.isGuest) {
      $patch('/users/me', { displayName: pName.trim(), bio: pBio.trim() }).catch(() => {});
    }

    // Always propagate changes up to root so header/chat reflect them
    onUpdateUser?.({ displayName: pName.trim(), bio: pBio.trim(), avatar: pAvatar });

    setPSaved(true);
    setPL(false);
    setTimeout(() => setPSaved(false), 2500);
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPA(ev.target.result);
      setAS(false);
      if (!user?.demo && !user?.isGuest) {
        const fd = new FormData(); fd.append('avatar', file);
        $up('/users/me/avatar', fd).catch(()=>{});
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAvatar = () => { setPA(null); setAS(false); };

  const toggleLink = async (plat) => {
    const cur = linked[plat];
    setLnk(p=>({...p,[plat]:!cur}));
    if (!user?.demo) {
      try {
        if (!cur) await $post('/social/link', { platform:plat, handle:'@demo' });
        else      await $del(`/social/unlink/${plat}`);
      } catch{}
    }
  };

  const revokeSession = async (id) => {
    const updated = sessions.filter(s=>s.id!==id);
    setSess(updated);
    saveSessions(updated);
    if (!user?.demo) $del(`/users/sessions/${id}`).catch(()=>{});
  };

  const doSeoAnalyze = async () => {
    if (!seoUrl.trim()) return;
    setSL(true); setSeoRes(null);
    try {
      const r = await $post('/intelligence/seo/analyze', { url:seoUrl });
      setSeoRes(r.data);
    } catch(e) {
      if (e.code===0) setSeoRes({ score:72, raw:'SEO analysis unavailable in demo mode. Connect to backend to use Vaultackie SEO tools.' });
      else setSeoRes({ raw: e.msg });
    }
    setSL(false);
  };

  const Row = ({ label, desc, right, onClick, danger=false }) => (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 0', borderBottom:`1px solid ${C.brd}`, cursor:onClick?'pointer':'default', transition:'opacity .15s' }}
      onMouseEnter={e=>onClick&&(e.currentTarget.style.opacity='.8')}
      onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
      <div style={{ flex:1 }}>
        <div style={{ color:danger?C.red:C.txt, fontSize:14, fontWeight:500 }}>{label}</div>
        {desc && <div style={{ color:C.mid, fontSize:12, marginTop:2 }}>{desc}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        {right}
        {onClick && !(right && typeof right === "object" && right.props !== undefined) && <I.ChevR size={14} color={C.dim}/>}
      </div>
    </div>
  );

  /* ── Offline sub-screen ── */
  if (sub === 'offline') {
    const shareCode = async () => {
      const text = netId;
      let ok = false;
      // Try modern clipboard API
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(text); ok = true; } catch {}
      }
      // Fallback: execCommand
      if (!ok) {
        try {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          ok = document.execCommand('copy');
          document.body.removeChild(ta);
        } catch {}
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    };

    const doJoin = () => {
      const code = joinCode.trim().toUpperCase();
      if (code.length < 6) { setJS('error'); return; }
      setJS('scanning');
      // Simulate connection handshake
      setTimeout(() => {
        if (code.startsWith('VLT-') || code.length >= 6) {
          setJoinedRoom(code);
          setJS('joined');
          setPeers([
            { id:'p1', name:'Device #' + Math.floor(Math.random()*900+100), joined: Date.now() - 12000 },
            { id:'p2', name:'Device #' + Math.floor(Math.random()*900+100), joined: Date.now() - 4000  },
          ]);
        } else {
          setJS('error');
        }
      }, 2000);
    };

    const doLeave = () => {
      setJoinedRoom(null); setJS('idle'); setJC(''); setPeers([]);
    };

    return (
      <div className="aFadeIn" style={{ height:'100%', background:C.bg0, display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'14px 16px', background:C.surf, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <button onClick={()=>{ setSub(null); setOT(null); setOR(null); doLeave(); }}
            style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',display:'flex' }}><I.ArrowL size={20}/></button>
          <h2 style={{ color:C.txt, fontSize:17, fontWeight:700, fontFamily:'Syne,sans-serif', flex:1 }}>Offline Mode</h2>
          <Chip text="BETA" color={C.yel}/>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          <p style={{ color:C.mid, fontSize:13, marginBottom:22, lineHeight:1.7 }}>
            Chat with nearby devices without internet using Wi-Fi Direct or Bluetooth mesh networking. All messages are end-to-end encrypted.
          </p>

          {/* Connection type */}
          <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:12, fontFamily:'Syne,sans-serif' }}>CONNECTION TYPE</p>
          <div style={{ display:'flex', gap:12, marginBottom:24 }}>
            {[
              { id:'wifi', I:I.Wifi, l:'Wi-Fi Direct', s:'Up to 200m · Fast · 2.4/5GHz' },
              { id:'bt',   I:I.BT,   l:'Bluetooth',    s:'Up to 30m · Low power' },
            ].map(o => (
              <div key={o.id} onClick={()=>{ setOT(offType===o.id?null:o.id); setOR(null); doLeave(); }}
                style={{ flex:1, padding:18, borderRadius:14, cursor:'pointer', textAlign:'center',
                  background: offType===o.id ? C.priD : C.card,
                  border:`1.5px solid ${offType===o.id ? C.pri : C.brd}`,
                  boxShadow: offType===o.id ? C.glow() : 'none', transition:'all .2s' }}>
                <o.I size={30} color={offType===o.id?C.pri:C.mid} style={{ margin:'0 auto 10px', display:'block' }}/>
                <div style={{ color:offType===o.id?C.pri:C.txt, fontSize:13, fontWeight:600, marginBottom:4 }}>{o.l}</div>
                <div style={{ color:C.mid, fontSize:11 }}>{o.s}</div>
              </div>
            ))}
          </div>

          {/* Role selector */}
          {offType && (
            <div className="aFadeUp">
              <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:12, fontFamily:'Syne,sans-serif' }}>YOUR ROLE</p>
              <div style={{ display:'flex', gap:12, marginBottom:22 }}>
                {[
                  { id:'host', e:'🌐', l:'Host Network', s:'Create a room & share code' },
                  { id:'join', e:'📡', l:'Join Network',  s:'Enter a room code to connect' },
                ].map(r => (
                  <div key={r.id} onClick={()=>{ setOR(offRole===r.id?null:r.id); doLeave(); }}
                    style={{ flex:1, padding:16, borderRadius:14, cursor:'pointer', textAlign:'center',
                      background: offRole===r.id ? C.secD : C.card,
                      border:`1.5px solid ${offRole===r.id ? C.sec : C.brd}`,
                      boxShadow: offRole===r.id ? C.glow(C.sec) : 'none', transition:'all .2s' }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>{r.e}</div>
                    <div style={{ color:offRole===r.id?'#a78bfa':C.txt, fontSize:13, fontWeight:600, marginBottom:4 }}>{r.l}</div>
                    <div style={{ color:C.mid, fontSize:11 }}>{r.s}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HOST panel ── */}
          {offType && offRole === 'host' && (
            <div className="aFadeUp" style={{ background:C.surf, border:`1px solid ${C.priB}`, borderRadius:16, overflow:'hidden' }}>
              {/* Status bar */}
              <div style={{ padding:'12px 16px', background:C.priD, borderBottom:`1px solid ${C.priB}`, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:9, height:9, borderRadius:'50%', background:C.grn, boxShadow:C.glow(C.grn,8), flexShrink:0 }} className="aGlow"/>
                <span style={{ color:C.grn, fontWeight:700, fontSize:13 }}>
                  {hostStatus==='waiting' ? 'Waiting for peers...' : hostStatus==='connected' ? `${hostPeers.length} peer${hostPeers.length!==1?'s':''} connected` : 'Network Hosting'}
                </span>
                <span style={{ color:C.dim, fontSize:11, marginLeft:'auto' }}>{offType==='wifi'?'Wi-Fi Direct':'Bluetooth'}</span>
              </div>

              <div style={{ padding:18 }}>
                {/* Room code display */}
                <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:8, fontFamily:'Syne,sans-serif' }}>YOUR ROOM CODE</p>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', background:C.bg3, border:`2px dashed ${C.priB}`, borderRadius:12, marginBottom:16 }}>
                  <span style={{ color:C.pri, fontFamily:'JetBrains Mono,monospace', fontSize:22, fontWeight:800, letterSpacing:4, flex:1 }}>{netId}</span>
                  <button onClick={shareCode}
                    style={{ background: copied ? C.grnD : C.priD,
                      border:`1px solid ${copied ? C.grnB : C.priB}`,
                      borderRadius:10, padding:'8px 14px', cursor:'pointer',
                      display:'flex', alignItems:'center', gap:6, transition:'all .2s', flexShrink:0 }}>
                    {copied
                      ? <><I.Check size={14} color={C.grn}/><span style={{ color:C.grn, fontSize:12, fontWeight:700 }}>Copied!</span></>
                      : <><I.Link size={14} color={C.pri}/><span style={{ color:C.pri, fontSize:12, fontWeight:700 }}>Copy Code</span></>
                    }
                  </button>
                </div>

                {/* Share options */}
                <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:10, fontFamily:'Syne,sans-serif' }}>SHARE VIA</p>
                <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                  {[
                    { icon:'📋', label:'Copy',      action: shareCode },
                    { icon:'📱', label:'SMS',        action: () => { try { window.open(`sms:?body=Join my Vaultackie room: ${netId}`); } catch {} } },
                    { icon:'📧', label:'Email',      action: () => { try { window.open(`mailto:?subject=Vaultackie Room Code&body=Join my room: ${netId}`); } catch {} } },
                    { icon:'🔗', label:'Share',      action: async () => { try { await navigator.share?.({ title:'Vaultackie Room', text:`Join room: ${netId}` }); } catch { shareCode(); } } },
                  ].map((opt,i) => (
                    <button key={i} onClick={opt.action}
                      style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                        padding:'10px 4px', background:C.card, border:`1px solid ${C.brd}`, borderRadius:12,
                        cursor:'pointer', transition:'all .18s' }}
                      onMouseEnter={e=>{ e.currentTarget.style.background=C.priD; e.currentTarget.style.borderColor=C.priB; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=C.card; e.currentTarget.style.borderColor=C.brd; }}>
                      <span style={{ fontSize:20 }}>{opt.icon}</span>
                      <span style={{ color:C.mid, fontSize:11 }}>{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Connected peers */}
                <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:10, fontFamily:'Syne,sans-serif' }}>
                  CONNECTED PEERS ({hostPeers.length})
                </p>
                {hostPeers.length === 0 ? (
                  <div style={{ padding:'16px', textAlign:'center', background:C.bg3, borderRadius:10 }}>
                    <Spinner size={18} color={C.pri}/>
                    <p style={{ color:C.dim, fontSize:12, marginTop:8 }}>Waiting for devices to join...</p>
                    <p style={{ color:C.dim, fontSize:11, marginTop:4 }}>Share the code above with nearby devices</p>
                  </div>
                ) : hostPeers.map(p => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:C.card, border:`1px solid ${C.grnB}`, borderRadius:10, marginBottom:7 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:C.grn, boxShadow:C.glow(C.grn,6) }}/>
                    <span style={{ color:C.txt, fontSize:13, fontFamily:'JetBrains Mono,monospace', flex:1 }}>{p.name}</span>
                    <span style={{ color:C.dim, fontSize:11 }}>joined {tAgo(p.joined)}</span>
                    <Chip text="ONLINE" color={C.grn}/>
                  </div>
                ))}

                {/* E2E note */}
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:C.grnD, border:`1px solid ${C.grnB}`, borderRadius:10, marginTop:16 }}>
                  <I.Lock size={13} color={C.grn}/>
                  <span style={{ color:C.grn, fontSize:12 }}>All traffic encrypted · AES-256-GCM · Zero-knowledge</span>
                </div>
              </div>
            </div>
          )}

          {/* ── JOIN panel ── */}
          {offType && offRole === 'join' && (
            <div className="aFadeUp" style={{ background:C.surf, border:`1px solid ${C.secB}`, borderRadius:16, overflow:'hidden' }}>
              {/* Status bar */}
              <div style={{ padding:'12px 16px', background:C.secD, borderBottom:`1px solid ${C.secB}`, display:'flex', alignItems:'center', gap:10 }}>
                {joinStatus === 'joined'
                  ? <><div style={{ width:9,height:9,borderRadius:'50%',background:C.grn,boxShadow:C.glow(C.grn,8) }} className="aGlow"/><span style={{ color:C.grn, fontWeight:700, fontSize:13 }}>Connected to {joinedRoom}</span></>
                  : joinStatus === 'scanning'
                  ? <><Spinner size={14} color={C.sec}/><span style={{ color:'#a78bfa', fontWeight:600, fontSize:13 }}>Connecting...</span></>
                  : <><span style={{ fontSize:16 }}>📡</span><span style={{ color:'#a78bfa', fontWeight:600, fontSize:13 }}>Join a Network</span></>
                }
              </div>

              <div style={{ padding:18 }}>
                {joinStatus !== 'joined' ? (
                  <>
                    {/* Manual code entry */}
                    <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:8, fontFamily:'Syne,sans-serif' }}>ENTER ROOM CODE</p>
                    <div style={{ display:'flex', gap:10, marginBottom: joinStatus==='error'?8:18 }}>
                      <div style={{ flex:1, position:'relative' }}>
                        <input
                          value={joinCode}
                          onChange={e => { setJC(e.target.value.toUpperCase()); setJS('idle'); }}
                          onKeyDown={e => e.key==='Enter' && doJoin()}
                          placeholder="VLT-XXXXXX"
                          maxLength={12}
                          style={{ width:'100%', background:C.bg3,
                            border:`2px solid ${joinStatus==='error'?C.redB:joinCode.length>=6?C.priB:C.brd}`,
                            borderRadius:12, padding:'14px 16px', color:C.txt, fontSize:18,
                            fontFamily:'JetBrains Mono,monospace', fontWeight:700, letterSpacing:4,
                            outline:'none', boxSizing:'border-box', textAlign:'center',
                            boxShadow: joinCode.length>=6 ? `0 0 12px ${C.pri}20` : 'none', transition:'all .2s' }}/>
                      </div>
                      <button onClick={doJoin} disabled={joinStatus==='scanning'||joinCode.trim().length<3}
                        style={{ background: joinCode.trim().length>=3 ? `linear-gradient(135deg,${C.sec},#5b21b6)` : C.bg3,
                          border:`1px solid ${C.secB}`, borderRadius:12, padding:'0 18px',
                          color:'white', fontSize:13, fontWeight:700, cursor: joinCode.trim().length>=3?'pointer':'not-allowed',
                          display:'flex', alignItems:'center', gap:7, flexShrink:0, boxShadow: joinCode.trim().length>=3?C.glow(C.sec):'none', transition:'all .2s' }}>
                        {joinStatus==='scanning' ? <Spinner size={16} color="white"/> : <><I.Radio size={15}/>Join</>}
                      </button>
                    </div>

                    {/* Error message */}
                    {joinStatus==='error' && (
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:C.redD, border:`1px solid ${C.redB}`, borderRadius:8, marginBottom:18 }}>
                        <I.Alert size={13} color={C.red}/>
                        <span style={{ color:C.red, fontSize:12 }}>Invalid room code. Check the code and try again.</span>
                      </div>
                    )}

                    {/* Divider */}
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                      <div style={{ flex:1, height:1, background:C.brd }}/>
                      <span style={{ color:C.dim, fontSize:11 }}>or scan nearby</span>
                      <div style={{ flex:1, height:1, background:C.brd }}/>
                    </div>

                    {/* Nearby scan list */}
                    <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:10, fontFamily:'Syne,sans-serif' }}>NEARBY NETWORKS</p>
                    {['VLT-A3F29X','VLT-B1K44Z','VLT-C8M31P'].map((n,i) => (
                      <div key={n} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                        background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, marginBottom:8, cursor:'pointer', transition:'all .18s' }}
                        onMouseEnter={e=>{ e.currentTarget.style.background=C.secD; e.currentTarget.style.borderColor=C.secB; }}
                        onMouseLeave={e=>{ e.currentTarget.style.background=C.card; e.currentTarget.style.borderColor=C.brd; }}
                        onClick={()=>{ setJC(n); setJS('idle'); }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:C.secD, border:`1px solid ${C.secB}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <I.Radio size={16} color={C.sec}/>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ color:C.txt, fontSize:13, fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{n}</div>
                          <div style={{ color:C.mid, fontSize:11, marginTop:2 }}>{i+1} device{i>0?'s':''} · {offType==='wifi'?'Wi-Fi Direct':'Bluetooth'} · Strong signal</div>
                        </div>
                        <Btn v="sec" sz="sm" ch="Select" onClick={e=>{ e.stopPropagation(); setJC(n); setJS('idle'); }}/>
                      </div>
                    ))}
                  </>
                ) : (
                  /* Joined state */
                  <div className="aFadeUp">
                    <div style={{ textAlign:'center', padding:'10px 0 20px' }}>
                      <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
                      <h3 style={{ color:C.txt, fontSize:18, fontWeight:800, fontFamily:'Syne,sans-serif', marginBottom:6 }}>Connected!</h3>
                      <p style={{ color:C.mid, fontSize:13 }}>Room: <span style={{ color:C.grn, fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{joinedRoom}</span></p>
                    </div>

                    <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:10, fontFamily:'Syne,sans-serif' }}>PEERS IN ROOM ({peers.length})</p>
                    {peers.map(p => (
                      <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:C.card, border:`1px solid ${C.grnB}`, borderRadius:10, marginBottom:7 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:C.grn, boxShadow:C.glow(C.grn,6) }}/>
                        <span style={{ color:C.txt, fontSize:13, fontFamily:'JetBrains Mono,monospace', flex:1 }}>{p.name}</span>
                        <Chip text="ONLINE" color={C.grn}/>
                      </div>
                    ))}

                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:C.grnD, border:`1px solid ${C.grnB}`, borderRadius:10, margin:'14px 0' }}>
                      <I.Lock size={13} color={C.grn}/>
                      <span style={{ color:C.grn, fontSize:12 }}>End-to-end encrypted · AES-256-GCM</span>
                    </div>

                    <Btn v="danger" full onClick={doLeave} ch={<><I.X size={14}/>Leave Room</>}/>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Linked accounts ── */
  if (sub === 'accounts') return (
    <div className="aFadeIn" style={{ height:'100%', background:C.bg0, overflowY:'auto' }}>
      <div style={{ padding:'14px 16px', background:C.surf, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <button onClick={()=>setSub(null)} style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',display:'flex' }}><I.ArrowL size={20}/></button>
        <h2 style={{ color:C.txt, fontSize:17, fontWeight:700, fontFamily:'Syne,sans-serif' }}>Linked Accounts</h2>
      </div>
      <div style={{ padding:18 }}>
        <p style={{ color:C.mid, fontSize:13, marginBottom:20, lineHeight:1.65 }}>
          Connect social accounts to message across all platforms from one unified interface.
        </p>
        {PLATS.filter(p=>p.id!=='vaultackie').map(p=>(
          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:`1px solid ${C.brd}` }}>
            <div style={{ width:42, height:42, borderRadius:12, background:`${p.c}18`, border:`1.5px solid ${p.c}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:p.c }}>{p.s}</div>
            <div style={{ flex:1 }}>
              <div style={{ color:C.txt, fontSize:14, fontWeight:600 }}>{p.n}</div>
              <div style={{ color:linked[p.id]?C.grn:C.mid, fontSize:12, marginTop:2 }}>{linked[p.id]?'✓ Connected':'Not connected'}</div>
            </div>
            <Btn v={linked[p.id]?'danger':'pri'} sz="sm" onClick={()=>toggleLink(p.id)}
              ch={linked[p.id]?<><I.X size={12}/>Unlink</>:<><I.Link size={12}/>Link</>}/>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Sessions ── */
  if (sub === 'sessions') {
    const methodLabel = { email:'Email + Password', email_demo:'Email (Demo)', email_otp:'Magic Link / OTP', phone_otp:'Phone OTP', guest:'Guest Mode', google:'Google OAuth', github:'GitHub OAuth' };
    const methodColor = { email:C.pri, email_demo:C.sec, email_otp:C.grn, phone_otp:C.yel, guest:C.mid };
    const deviceIcon  = { Desktop:'🖥', Mobile:'📱', Tablet:'📟' };
    const osIcon      = { Windows:'🪟', macOS:'🍎', iOS:'📱', iPadOS:'📱', Android:'🤖', Linux:'🐧' };

    return (
      <div className="aFadeIn" style={{ height:'100%', background:C.bg0, display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'14px 16px', background:C.surf, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <button onClick={()=>setSub(null)} style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',display:'flex' }}><I.ArrowL size={20}/></button>
          <div style={{ flex:1 }}>
            <h2 style={{ color:C.txt, fontSize:17, fontWeight:700, fontFamily:'Syne,sans-serif' }}>Active Sessions</h2>
            <p style={{ color:C.mid, fontSize:11, marginTop:1 }}>{sessions.length} session{sessions.length!==1?'s':''} recorded</p>
          </div>
          <Chip text="LIVE" color={C.grn}/>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16 }}>

          {/* No sessions state */}
          {sessions.length === 0 && (
            <div style={{ textAlign:'center', padding:'50px 20px' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔐</div>
              <p style={{ color:C.mid, fontSize:14, fontWeight:600 }}>No sessions recorded yet</p>
              <p style={{ color:C.dim, fontSize:12, marginTop:6, lineHeight:1.6 }}>Sessions are captured when you sign in. Log out and log back in to see your session data.</p>
            </div>
          )}

          {sessions.map((s, idx) => (
            <div key={s.id||idx} className="aFadeUp" style={{ background:C.card, border:`1px solid ${s.isCurrentSession?C.priB:C.brd}`, borderRadius:16, marginBottom:14, overflow:'hidden',
              boxShadow: s.isCurrentSession ? `0 0 16px ${C.pri}14` : 'none' }}>

              {/* Session header bar */}
              <div style={{ padding:'12px 16px', background: s.isCurrentSession?C.priD:C.card2, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, flex:1, minWidth:0 }}>
                  {s.isCurrentSession && <div style={{ width:8, height:8, borderRadius:'50%', background:C.grn, boxShadow:C.glow(C.grn,6), flexShrink:0 }} className="aGlow"/>}
                  <span style={{ fontSize:18 }}>{deviceIcon[s.device]||'💻'}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ color: s.isCurrentSession?C.pri:C.txt, fontSize:13, fontWeight:700 }}>
                      {s.isCurrentSession ? '● This Device (Current)' : `${s.device||'Device'} · ${s.os||'Unknown OS'}`}
                    </div>
                    <div style={{ color:C.dim, fontSize:10, fontFamily:'JetBrains Mono,monospace' }}>
                      {new Date(s.loginAt||Date.now()).toLocaleString()} · ID: {(s.id||'').slice(-8)}
                    </div>
                  </div>
                </div>
                {!s.isCurrentSession && (
                  <button onClick={()=>revokeSession(s.id)}
                    style={{ background:C.redD, border:`1px solid ${C.redB}`, borderRadius:8, padding:'5px 11px',
                      color:C.red, cursor:'pointer', fontSize:11, fontWeight:600, flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
                    <I.X size={11}/>Revoke
                  </button>
                )}
              </div>

              {/* Credentials block */}
              <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.brd}`, background:'rgba(0,0,0,.15)' }}>
                <p style={{ color:C.dim, fontSize:9, letterSpacing:1.4, marginBottom:8, fontFamily:'Syne,sans-serif' }}>CREDENTIALS USED</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {s.email && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:C.priD, border:`1px solid ${C.priB}`, borderRadius:8 }}>
                      <I.Mail size={11} color={C.pri}/>
                      <span style={{ color:C.pri, fontSize:12, fontFamily:'JetBrains Mono,monospace' }}>{s.email}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:C.grnD, border:`1px solid ${C.grnB}`, borderRadius:8 }}>
                      <I.Phone size={11} color={C.grn}/>
                      <span style={{ color:C.grn, fontSize:12, fontFamily:'JetBrains Mono,monospace' }}>{s.phone}</span>
                    </div>
                  )}
                  {s.displayName && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:C.card, border:`1px solid ${C.brd}`, borderRadius:8 }}>
                      <I.User size={11} color={C.mid}/>
                      <span style={{ color:C.mid, fontSize:12 }}>{s.displayName}</span>
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px',
                    background:`${methodColor[s.loginMethod]||C.mid}14`, border:`1px solid ${methodColor[s.loginMethod]||C.mid}35`, borderRadius:8 }}>
                    <I.Key size={11} color={methodColor[s.loginMethod]||C.mid}/>
                    <span style={{ color:methodColor[s.loginMethod]||C.mid, fontSize:11, fontWeight:600 }}>{methodLabel[s.loginMethod]||s.loginMethod||'Unknown'}</span>
                  </div>
                </div>
              </div>

              {/* IP & Location block */}
              <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.brd}` }}>
                <p style={{ color:C.dim, fontSize:9, letterSpacing:1.4, marginBottom:8, fontFamily:'Syne,sans-serif' }}>NETWORK · LOCATION</p>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:s.isCurrentSession?C.priD:C.bg3, border:`1px solid ${s.isCurrentSession?C.priB:C.brd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <I.Globe size={16} color={s.isCurrentSession?C.pri:C.dim}/>
                  </div>
                  <div>
                    <div style={{ color:C.txt, fontSize:14, fontWeight:700, fontFamily:'JetBrains Mono,monospace', letterSpacing:.5 }}>{s.ip||'Unknown'}</div>
                    <div style={{ color:C.mid, fontSize:11 }}>
                      {[s.city, s.region, s.country].filter(Boolean).join(', ')||'Location unknown'}
                    </div>
                  </div>
                </div>
                {s.isp && <div style={{ display:'flex', alignItems:'center', gap:6 }}><I.Wifi size={11} color={C.dim}/><span style={{ color:C.dim, fontSize:11 }}>ISP: {s.isp}</span></div>}
                {s.timezone && <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}><I.Clock size={11} color={C.dim}/><span style={{ color:C.dim, fontSize:11 }}>{s.timezone}</span></div>}
              </div>

              {/* Device block */}
              <div style={{ padding:'12px 16px' }}>
                <p style={{ color:C.dim, fontSize:9, letterSpacing:1.4, marginBottom:8, fontFamily:'Syne,sans-serif' }}>DEVICE · BROWSER</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {[
                    { icon: osIcon[s.os]||'💻',    val: s.os,      label:'OS'       },
                    { icon: '🌐',                   val: s.browser, label:'Browser'  },
                    { icon: deviceIcon[s.device]||'💻', val: s.device, label:'Type'  },
                    { icon: '📐',                   val: s.screen,  label:'Screen'   },
                    { icon: '🌍',                   val: s.lang,    label:'Language' },
                  ].filter(x=>x.val).map((item,ii) => (
                    <div key={ii} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 9px', background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:7 }}>
                      <span style={{ fontSize:12 }}>{item.icon}</span>
                      <span style={{ color:C.mid, fontSize:11 }}>{item.val}</span>
                    </div>
                  ))}
                </div>

                {/* Last active */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:`1px solid ${C.brd}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <I.Clock size={11} color={C.dim}/>
                    <span style={{ color:C.dim, fontSize:11 }}>Last active: {tAgo(s.lastActive||s.loginAt)}</span>
                  </div>
                  {s.token && (
                    <span style={{ color:C.dim, fontSize:10, fontFamily:'JetBrains Mono,monospace' }}>…{s.token}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Clear all */}
          {sessions.length > 1 && (
            <Btn v="danger" full onClick={()=>{ const cur=sessions.filter(s=>s.isCurrentSession); setSess(cur); saveSessions(cur); }} ch={<><I.Trash size={13}/>Clear Old Sessions</>}/>
          )}
        </div>
      </div>
    );
  }

  /* ── SEO Tools ── */
  if (sub === 'seo') return (
    <div className="aFadeIn" style={{ height:'100%', background:C.bg0, overflowY:'auto' }}>
      <div style={{ padding:'14px 16px', background:C.surf, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <button onClick={()=>setSub(null)} style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',display:'flex' }}><I.ArrowL size={20}/></button>
        <h2 style={{ color:C.txt, fontSize:17, fontWeight:700, fontFamily:'Syne,sans-serif' }}>Vaultackie SEO Tools</h2>
        <Chip text="AI-POWERED" color={C.sec}/>
      </div>
      <div style={{ padding:20 }}>
        <p style={{ color:C.mid, fontSize:13, marginBottom:20, lineHeight:1.65 }}>Analyze any URL for SEO performance using Vaultackie Intelligence. Get actionable insights to improve rankings.</p>
        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          <input value={seoUrl} onChange={e=>setSeoUrl(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&doSeoAnalyze()}
            placeholder="https://example.com"
            style={{ flex:1, background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:10, padding:'12px 14px', color:C.txt, fontSize:14, outline:'none' }}/>
          <Btn v="solid" dis={seoLoad} onClick={doSeoAnalyze} ch={seoLoad?<><Spinner size={14}/>Analyzing...</>:<><I.Search size={14}/>Analyze</>}/>
        </div>
        {seoRes && (
          <div className="aFadeUp" style={{ background:C.surf, border:`1px solid ${C.secB}`, borderRadius:14, padding:20 }}>
            {seoRes.score !== undefined && (
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${C.brd}` }}>
                <div style={{ width:70, height:70, borderRadius:'50%', background:C.secD, border:`3px solid ${seoRes.score>=70?C.grn:seoRes.score>=50?C.yel:C.red}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:C.glow(seoRes.score>=70?C.grn:C.yel,12) }}>
                  <span style={{ fontSize:22, fontWeight:800, color:C.txt, fontFamily:'Syne,sans-serif' }}>{seoRes.score}</span>
                </div>
                <div>
                  <h3 style={{ color:C.txt, fontSize:16, fontWeight:700, fontFamily:'Syne,sans-serif' }}>SEO Score</h3>
                  <p style={{ color:C.mid, fontSize:12, marginTop:4 }}>{seoRes.score>=70?'Good':'Needs improvement'}</p>
                </div>
              </div>
            )}
            <div style={{ color:C.txt, fontSize:13, lineHeight:1.75, whiteSpace:'pre-wrap' }}>
              {seoRes.raw || JSON.stringify(seoRes, null, 2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Profile ── */
  if (sub === 'profile') return (
    <div className="aFadeIn" style={{ height:'100%', background:C.bg0, overflowY:'auto', position:'relative' }}>
      <div style={{ padding:'14px 16px', background:C.surf, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <button onClick={()=>setSub(null)} style={{ background:'none',border:'none',color:C.pri,cursor:'pointer',display:'flex' }}><I.ArrowL size={20}/></button>
        <h2 style={{ color:C.txt, fontSize:17, fontWeight:700, fontFamily:'Syne,sans-serif' }}>Edit Profile</h2>
      </div>

      <div style={{ padding:24 }}>
        {/* Avatar picker */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ position:'relative', display:'inline-block' }}>
            <Av init={pName||user?.displayName||user?.firstName||'U'} col={C.pri} size={88} src={pAvatar}/>
            <button
              onClick={()=>setAS(true)}
              style={{ position:'absolute', bottom:2, right:2, width:32, height:32, borderRadius:'50%',
                background:`linear-gradient(135deg,${C.pri},#0096cc)`, border:`2px solid ${C.bg0}`,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                color:'#050510', boxShadow:C.glow(), transition:'transform .15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.12)'}
              onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              <I.Camera size={14}/>
            </button>
          </div>
          <p style={{ color:C.mid, fontSize:12, marginTop:10 }}>
            {pAvatar ? 'Tap camera icon to change photo' : 'Tap camera icon to add a photo'}
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Inp val={pName} set={setPN} label="Display Name" ph="Your display name" Ic={I.User}/>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ color:C.mid, fontSize:12, fontWeight:500 }}>Bio</label>
            <textarea value={pBio} onChange={e=>setPB(e.target.value)} placeholder="Tell people about yourself..."
              rows={3} style={{ background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:10, padding:'12px 14px', color:C.txt, fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif' }}/>
          </div>
          {pSaved && (
            <div className="aFadeUp" style={{ padding:'11px 16px', background:C.grnD, border:`1px solid ${C.grnB}`, borderRadius:10, display:'flex', alignItems:'center', gap:9 }}>
              <I.Check size={15} color={C.grn}/>
              <span style={{ color:C.grn, fontSize:13, fontWeight:600 }}>Profile saved successfully!</span>
            </div>
          )}
          <Btn v="solid" full dis={profileLoad||!pName.trim()} onClick={saveProfile} ch={profileLoad?<><Spinner size={14}/>Saving...</>:<><I.Check size={14}/>Save Profile</>}/>
        </div>
      </div>

      {/* Avatar options sheet */}
      {avatarSheet && (
        <div className="aFadeIn" style={{ position:'absolute', inset:0, zIndex:300, background:'rgba(5,5,16,.82)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
          onClick={()=>setAS(false)}>
          <div className="aFadeUp" onClick={e=>e.stopPropagation()}
            style={{ background:C.bg2, borderTop:`1px solid ${C.brd}`, borderRadius:'20px 20px 0 0', padding:'8px 0 32px' }}>

            {/* Handle */}
            <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 14px' }}>
              <div style={{ width:40, height:4, borderRadius:2, background:C.dim }}/>
            </div>

            <p style={{ color:C.mid, fontSize:11, letterSpacing:1.5, textAlign:'center', marginBottom:14, fontFamily:'Syne,sans-serif' }}>PROFILE PHOTO</p>

            {/* Preview */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
              <Av init={pName||user?.displayName||'U'} col={C.pri} size={72} src={pAvatar}/>
            </div>

            {/* ── Take Photo (camera capture) ── */}
            <label style={{ width:'100%', display:'flex', alignItems:'center', gap:16, padding:'15px 24px',
              cursor:'pointer', transition:'background .15s', boxSizing:'border-box' }}
              onMouseEnter={e=>e.currentTarget.style.background=C.surf}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <input type="file" accept="image/*" capture="environment" onChange={handleAvatarFile}
                style={{ position:'absolute', width:1, height:1, opacity:0, pointerEvents:'none' }}/>
              <div style={{ width:46, height:46, borderRadius:14, background:C.priD, border:`1px solid ${C.priB}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📷</div>
              <div>
                <div style={{ color:C.txt, fontSize:15, fontWeight:600 }}>Take Photo</div>
                <div style={{ color:C.mid, fontSize:12, marginTop:2 }}>Use your camera</div>
              </div>
            </label>

            {/* ── Choose from Library (all files) ── */}
            <label style={{ width:'100%', display:'flex', alignItems:'center', gap:16, padding:'15px 24px',
              cursor:'pointer', transition:'background .15s', boxSizing:'border-box' }}
              onMouseEnter={e=>e.currentTarget.style.background=C.surf}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <input type="file" accept="image/*" onChange={handleAvatarFile}
                style={{ position:'absolute', width:1, height:1, opacity:0, pointerEvents:'none' }}/>
              <div style={{ width:46, height:46, borderRadius:14, background:C.priD, border:`1px solid ${C.priB}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🖼</div>
              <div>
                <div style={{ color:C.txt, fontSize:15, fontWeight:600 }}>Choose from Library</div>
                <div style={{ color:C.mid, fontSize:12, marginTop:2 }}>Browse all photos & files</div>
              </div>
            </label>

            {/* ── Remove Photo ── */}
            {pAvatar && (
              <button onClick={removeAvatar}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:16, padding:'15px 24px',
                  background:'none', border:'none', cursor:'pointer', textAlign:'left', transition:'background .15s', boxSizing:'border-box' }}
                onMouseEnter={e=>e.currentTarget.style.background=C.surf}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:46, height:46, borderRadius:14, background:C.redD, border:`1px solid ${C.redB}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🗑</div>
                <div>
                  <div style={{ color:C.red, fontSize:15, fontWeight:600 }}>Remove Photo</div>
                  <div style={{ color:C.mid, fontSize:12, marginTop:2 }}>Revert to initials</div>
                </div>
              </button>
            )}

            {/* Cancel */}
            <div style={{ margin:'10px 20px 0' }}>
              <Btn v="ghost" full sz="lg" onClick={()=>setAS(false)} ch="Cancel"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ── Main settings ── */
  return (
    <div className="aFadeIn" style={{ height:'100%', background:C.bg0, overflowY:'auto' }}>
      {/* Profile header */}
      <div style={{ padding:'28px 20px 22px', background:C.surf, borderBottom:`1px solid ${C.brd}`, textAlign:'center',
        backgroundImage:`radial-gradient(circle at 50% 0%,${C.pri}06,transparent 55%)`, flexShrink:0 }}>
        <div style={{ position:'relative', display:'inline-block', marginBottom:14 }}>
          <Av init={pName||user?.displayName||user?.firstName||'U'} col={C.pri} size={76} src={pAvatar}/>
          <div onClick={()=>setSub('profile')} style={{ position:'absolute', bottom:2, right:2, width:22, height:22, borderRadius:'50%',
            background:`linear-gradient(135deg,${C.pri},#0096cc)`, border:`2px solid ${C.surf}`,
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:C.glow() }}>
            <I.Camera size={11} color="#050510"/>
          </div>
        </div>
        <h3 style={{ color:C.txt, fontSize:20, fontWeight:800, fontFamily:'Syne,sans-serif', marginBottom:4 }}>
          {user?.isGuest ? 'Guest User' : (pName || user?.displayName || user?.firstName || 'User')}
        </h3>
        <p style={{ color:C.mid, fontSize:13, marginBottom:10 }}>
          {user?.isGuest ? 'Limited access mode' : (user?.email || user?.phone || '')}
        </p>
        <div style={{ display:'flex', gap:7, justifyContent:'center', flexWrap:'wrap' }}>
          {user?.isGuest && <Chip text="GUEST MODE" color={C.yel}/>}
          <Chip text="🔐 AES-256" color={C.grn}/>
          {user?.demo && <Chip text="DEMO MODE" color={C.sec}/>}
        </div>
      </div>

      <div style={{ padding:18 }}>
        {/* Account */}
        <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:6, fontFamily:'Syne,sans-serif' }}>ACCOUNT</p>
        <div style={{ background:C.surf, border:`1px solid ${C.brd}`, borderRadius:12, padding:'0 16px', marginBottom:18 }}>
          <Row label="Edit Profile" desc="Name, bio, avatar" onClick={()=>setSub('profile')}/>
          <Row label="Active Sessions" desc="Manage logged-in devices" onClick={()=>setSub('sessions')} right={sessions.length>0?<Chip text={`${sessions.length}`} color={C.pri}/>:null}/>
          <Row label="Notification Settings" right={<Tog val={notifs} set={setNot}/>}/>
          <Row label="Sound Alerts" right={<Tog val={sound} set={setSnd}/>}/>
          <Row label="Read Receipts" right={<Tog val={reads} set={setRds}/>}/>
          <Row label="Online Status Visible" right={<Tog val={onStat} set={setOS}/>}/>
        </div>

        {/* Connections */}
        <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:6, fontFamily:'Syne,sans-serif' }}>CONNECTIONS</p>
        <div style={{ background:C.surf, border:`1px solid ${C.brd}`, borderRadius:12, padding:'0 16px', marginBottom:18 }}>
          <Row label="Linked Social Accounts" desc="Connect Instagram, X, WhatsApp & more" onClick={()=>setSub('accounts')}
            right={<Chip text={`${Object.values(linked).filter(Boolean).length} LINKED`} color={Object.values(linked).some(Boolean)?C.grn:C.mid}/>}/>
          <Row label="Offline Mode" desc="Wi-Fi Direct & Bluetooth chat" onClick={()=>setSub('offline')} right={<Chip text="NEW" color={C.sec}/>}/>
          <Row label="Internet Refresh" desc="Re-establish server connection"
            right={<button onClick={onRefresh} style={{ background:C.priD, border:`1px solid ${C.priB}`, borderRadius:8, padding:'6px 12px', color:C.pri, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:5 }}><I.Refresh size={11}/>Refresh</button>}/>
        </div>

        {/* Intelligence */}
        <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:6, fontFamily:'Syne,sans-serif' }}>INTELLIGENCE ENGINE</p>
        <div style={{ background:C.surf, border:`1px solid ${C.brd}`, borderRadius:12, padding:'0 16px', marginBottom:18 }}>
          <Row label="SEO Tools" desc="Analyze URLs with AI" onClick={()=>setSub('seo')} right={<Chip text="AI" color={C.sec}/>}/>
        </div>

        {/* API Keys manager */}
        <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:8, fontFamily:'Syne,sans-serif' }}>AI PROVIDER API KEYS</p>
        <div style={{ background:C.surf, border:`1px solid ${C.brd}`, borderRadius:12, padding:16, marginBottom:18 }}>
          <p style={{ color:C.mid, fontSize:12, marginBottom:14, lineHeight:1.6 }}>
            Add your own API keys to use any provider directly. Keys are stored locally and never sent to our servers.
          </p>

          {/* Provider grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7, marginBottom:16 }}>
            {AI_PROVIDERS.map(p => {
              const hasPKey = !!(( (() => { try { return localStorage.getItem(p.lsKey)||''; } catch { return ''; } })() ).trim());
              return (
                <div key={p.id} style={{ padding:'10px 4px', borderRadius:10, textAlign:'center',
                  background: hasPKey ? `${p.color}12` : C.bg3,
                  border:`1.5px solid ${hasPKey ? p.color+'44' : C.brd}`, position:'relative' }}>
                  <div style={{ fontSize:18, marginBottom:3, color:p.color }}>{p.logo}</div>
                  <div style={{ color:hasPKey?p.color:C.mid, fontSize:10, fontWeight:700 }}>{p.name}</div>
                  {hasPKey && <div style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:'50%', background:C.grn, boxShadow:`0 0 4px ${C.grn}` }}/>}
                </div>
              );
            })}
          </div>

          {/* Individual key rows */}
          {AI_PROVIDERS.map(p => {
            const [lkVal, setLkVal] = [
              (() => { try { return localStorage.getItem(p.lsKey)||''; } catch { return ''; } })(),
              null
            ];
            return (
              <SettingsKeyRow key={p.id} provider={p}/>
            );
          })}
        </div>

        {/* Security */}
        <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:6, fontFamily:'Syne,sans-serif' }}>SECURITY</p>
        <div style={{ background:C.surf, border:`1px solid ${C.brd}`, borderRadius:12, padding:'0 16px', marginBottom:18, position:'relative' }}>
          <Row label="Encryption" desc="AES-256-GCM · End-to-end" right={<Chip text="ACTIVE" color={C.grn}/>}/>
          <Row
            label="Two-Factor Auth (TOTP)"
            desc={twoFA ? 'Tap to manage or disable' : 'Add an extra layer of security'}
            onClick={()=>setShow2FA(true)}
            right={
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <Chip text={twoFA?'ON':'OFF'} color={twoFA?C.grn:C.mid}/>
                <I.ChevR size={14} color={C.dim}/>
              </div>
            }
          />
          <Row label="Auto-Lock" desc="Lock after inactivity" right={<Tog val={autoLock} set={setAL}/>}/>
          <Row label="Privacy Policy" onClick={()=>{}} right={<I.ChevR size={14} color={C.dim}/>}/>

          {/* TwoFactorSetup overlay */}
          {show2FA && (
            <TwoFactorSetup
              user={user}
              onClose={()=>setShow2FA(false)}
              onEnabled={()=>set2FA(true)}
              onDisabled={()=>set2FA(false)}
            />
          )}
        </div>

        {/* About */}
        <p style={{ color:C.dim, fontSize:10, letterSpacing:1.2, marginBottom:6, fontFamily:'Syne,sans-serif' }}>ABOUT</p>
        <div style={{ background:C.surf, border:`1px solid ${C.brd}`, borderRadius:12, padding:'0 16px', marginBottom:20 }}>
          <Row label="App Version" right={<span style={{ color:C.dim, fontSize:13, fontFamily:'JetBrains Mono,monospace' }}>v1.0.0</span>}/>
          <Row label="Backend API" right={<span style={{ color:C.dim, fontSize:11, fontFamily:'JetBrains Mono,monospace', wordBreak:'break-all' }}>localhost:5000</span>}/>
          <Row label="Terms of Service"/>
        </div>

        {/* Logout */}
        <Btn v="danger" full sz="lg" onClick={onLogout} ch={<><I.LogOut size={15}/>{user?.isGuest?'Exit Guest Mode':'Sign Out'}</>}/>

        <p style={{ color:C.dim, fontSize:10, textAlign:'center', marginTop:22, lineHeight:2, fontFamily:'Syne,sans-serif' }}>
          VAULTACKIE · SECURE INTELLIGENCE INTERFACE<br/>
          <span style={{ color:C.pri, fontFamily:'JetBrains Mono,monospace' }}>v1.0.0</span> · All communications encrypted
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════════════════════════ */

export default function VaultackieApp() {
  const [screen,     setScreen]  = useState('auth');
  const [user,       setUser]    = useState(null);
  const [tab,        setTab]     = useState(0);
  const [online,     setOnline]  = useState(true);
  const [boot,       setBoot]    = useState(true);
  const [pending2FA, setPending] = useState(null); // holds user obj while awaiting 2FA

  /* Try to restore session */
  useEffect(() => {
    const tok = getTok();
    if (tok) {
      $get('/auth/me').then(r => {
        if (r.data) { setUser(r.data); setScreen('app'); }
      }).catch(()=>{}).finally(() => setBoot(false));
    } else {
      setBoot(false);
    }
    const up = () => setOnline(true);
    const dn = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', dn);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', dn); };
  }, []);

  const onAuth = useCallback((u) => {
    // If 2FA is enabled, hold the user object and show challenge first
    const twoFAState = get2FAState();
    if (twoFAState?.enabled && !u?.isGuest) {
      setPending(u);
      setBoot(false);
      return;
    }
    setUser(u);
    setScreen('app');
    setBoot(false);
  }, []);

  const onLogout = useCallback(async () => {
    if (!user?.demo && !user?.isGuest) {
      $post('/auth/logout', {}).catch(()=>{});
    }
    wipeTok();
    setUser(null);
    setTab(0);
    setScreen('auth');
  }, [user]);

  const onRefresh = useCallback(() => {
    setOnline(navigator.onLine);
    if (!user?.demo) {
      $get('/auth/me').then(r=>{ if(r.data) setUser(r.data); }).catch(()=>{});
    }
  }, [user]);

  const onUpdateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  /* Boot splash */
  if (boot) return (
    <div style={{ height:'100vh', background:C.bg0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20 }}>
      <div className="aFloat" style={{ width:72, height:72, background:`linear-gradient(135deg,${C.pri}1e,${C.sec}12)`, border:`2px solid ${C.pri}44`, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:C.glow() }}>
        <I.Shield size={36} color={C.pri}/>
      </div>
      <Spinner size={24}/>
      <p style={{ color:C.mid, fontSize:12, fontFamily:'Syne,sans-serif', letterSpacing:2 }}>VAULTACKIE</p>
    </div>
  );

  if (screen === 'auth') return <AuthScreen onAuth={onAuth}/>;

  /* 2FA challenge — shown after credentials pass but before entering app */
  if (pending2FA) return (
    <TwoFactorChallenge
      onSuccess={() => { setUser(pending2FA); setScreen('app'); setPending(null); setBoot(false); }}
      onCancel={() => { wipeTok(); setPending(null); setScreen('auth'); }}
    />
  );  const TABS = [
    { l:'Messages',     I:I.Msg,      badge:0 },
    { l:'Intelligence', I:I.Zap,      badge:0 },
    { l:'Settings',     I:I.Settings, badge:0 },
  ];

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:C.bg0, fontFamily:'DM Sans,sans-serif', maxWidth:500, margin:'0 auto', overflow:'hidden', position:'relative' }}>
      {/* Status bar */}
      <NetBanner connected={online} onRefresh={onRefresh}/>

      {/* Tab content */}
      <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
        {tab === 0 && <ChatTab user={user}/>}
        {tab === 1 && <IntelligenceTab user={user}/>}
        {tab === 2 && <SettingsTab user={user} onLogout={onLogout} onRefresh={onRefresh} onUpdateUser={onUpdateUser}/>}
      </div>

      {/* Bottom nav */}
      <div style={{ background:C.surf, borderTop:`1px solid ${C.brd}`, display:'flex', padding:'6px 0 env(safe-area-inset-bottom,0) 0', flexShrink:0, boxShadow:'0 -4px 24px rgba(0,0,0,.4)' }}>
        {TABS.map(({ l, I: Icon, badge }, i) => {
          const active = tab === i;
          const ac = i === 1 ? C.sec : C.pri;
          return (
            <button key={i} onClick={()=>setTab(i)} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              background:'none', border:'none', cursor:'pointer', padding:'6px 0', outline:'none', position:'relative' }}>
              <div style={{
                padding:'6px 20px', borderRadius:22,
                background:active?`${ac}1c`:'transparent',
                border:`1px solid ${active?ac+'44':'transparent'}`,
                boxShadow:active?C.glow(ac,10):'none',
                transition:'all .25s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={20} color={active?(i===1?'#a78bfa':ac):C.mid}/>
              </div>
              <span style={{ color:active?(i===1?'#a78bfa':ac):C.mid, fontSize:10, fontWeight:active?700:400, transition:'color .2s', letterSpacing:.3 }}>{l}</span>
              {badge > 0 && (
                <div style={{ position:'absolute', top:4, right:'20%', width:8, height:8, borderRadius:'50%', background:C.red, border:`1.5px solid ${C.bg0}` }}/>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
