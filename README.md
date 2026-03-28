# ⬡ VAULTACKIE — Secure Intelligence Interface

> **A next-generation, privacy-first secure messaging and AI intelligence platform.**
> Built by **Vaultackie** · Version `v1.0.0`

---

## ⚠️ License & Usage Notice

```
NO LICENSE — ALL RIGHTS RESERVED
Copyright © Vaultackie. All rights reserved.

This project is provided strictly for TESTING PURPOSES ONLY.
No authorization is granted for:
  - Commercial use
  - Redistribution
  - Modification or derivative works
  - Private or personal deployment
  - Any form of reproduction without explicit written permission from Vaultackie

TESTING ONLY. Unauthorized use is strictly prohibited.
```

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Features](#features)
   - [Authentication System](#authentication-system)
   - [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
   - [Messaging / Chat Tab](#messaging--chat-tab)
   - [Intelligence Tab (AI Engine)](#intelligence-tab-ai-engine)
   - [Settings Tab](#settings-tab)
   - [Session Management](#session-management)
5. [Design System](#design-system)
6. [API Integration](#api-integration)
7. [Supported AI Providers](#supported-ai-providers)
8. [Supported Platforms (Multi-Platform Messaging)](#supported-platforms)
9. [File Structure](#file-structure)
10. [Running for Testing](#running-for-testing)
11. [Demo Mode](#demo-mode)
12. [Security Model](#security-model)
13. [Known Limitations (Test Build)](#known-limitations)

---

## Overview

**Vaultackie** is a full-featured, mobile-first secure intelligence interface that combines end-to-end encrypted messaging with a powerful multi-provider AI engine. It is delivered as a single-file frontend (`VaultackieApp.html` / `VaultackieApp.jsx`) that integrates seamlessly with a dedicated Express.js backend.

The application is designed for maximum privacy and security, featuring AES-256 encryption references, zero-knowledge architecture principles, offline-capable operation, and a complete TOTP-based two-factor authentication engine — all implemented from scratch in pure JavaScript without external cryptographic libraries.

**Core Philosophy:**
- 🔐 Privacy First — all communications are encrypted
- ⚡ AI-Powered — multi-provider intelligence built in
- 📡 Offline Capable — graceful degradation when backend is unavailable
- ◈ Multi-Platform — unified inbox across 10 messaging platforms
- 🛡 Zero-Knowledge — designed so the server learns as little as possible

---

## Technology Stack

### Frontend
| Layer | Technology |
|---|---|
| UI Framework | React 18 (via CDN UMD build) |
| JSX Transpilation | Babel Standalone 7.23.5 |
| Styling | Pure inline CSS + CSS-in-JS (no external UI library) |
| Fonts | Google Fonts — Syne, JetBrains Mono, DM Sans |
| Icons | Custom SVG icon system (zero external icon library) |
| State Management | React Hooks (useState, useEffect, useCallback, useMemo, useRef, useContext) |
| 2FA Engine | Pure JS TOTP (RFC 6238) — HMAC-SHA1 via Web Crypto API |
| QR Codes | goqr.me API (used for 2FA setup) |

### Backend (Expected Integration)
| Layer | Technology |
|---|---|
| Runtime | Node.js + Express.js |
| Database | MySQL |
| Caching | Redis |
| Real-time | Socket.IO |
| SMS/OTP | Twilio |
| File Storage | AWS S3 |
| AI Proxy | Gemini AI (server-side) |
| Email | Nodemailer |
| Auth | JWT (JSON Web Tokens) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    VAULTACKIE FRONTEND                        │
│                                                              │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  Auth    │  │  Chat / Messages │  │   Intelligence    │  │
│  │  Screen  │  │  Tab             │  │   Tab (AI)        │  │
│  └──────────┘  └──────────────────┘  └───────────────────┘  │
│       │               │                       │              │
│       └───────────────┴───────────────────────┘              │
│                        API Layer                             │
│              http://localhost:5000/api/v1                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   Express Backend        │
          │   MySQL · Redis          │
          │   Socket.IO · Twilio     │
          │   S3 · Nodemailer · JWT  │
          └─────────────────────────┘
```

The frontend is self-contained and can operate in **Demo Mode** when the backend is unreachable. It gracefully falls back to local mock data and built-in AI capabilities.

---

## Features

### Authentication System

Vaultackie implements a multi-path authentication system that supports several login methods:

**Sign Up Flow:**
- Full name, email address, and phone number (optional) collection
- Password with strength indicator (checks for uppercase, lowercase, numbers, symbols)
- OTP verification via email or SMS before account activation
- Real-time form validation and error feedback

**Sign In Flow:**
- Email/password login
- Phone number + OTP login (passwordless)
- Automatic JWT token persistence in `localStorage`
- Session auto-restoration on app reload via `/auth/me` endpoint

**Guest Mode:**
- Instant access without registration
- Limited to 3 AI intelligence searches
- Demo conversations pre-loaded
- Clearly labeled as restricted mode throughout the UI

**Forgot Password:**
- Email-based password reset link dispatch
- Silent error handling to prevent user enumeration

**OTP Verification Screen:**
- 6-digit code entry with large monospace input
- Demo code displayed in testing mode
- Resend code capability
- Accepts demo codes `123456` or `000000` when backend is offline

---

### Two-Factor Authentication (2FA)

Vaultackie ships with a complete, **library-free TOTP implementation** fully compliant with RFC 6238.

**Implementation Details:**
- Algorithm: HMAC-SHA1 via the browser's native `crypto.subtle` API
- Time Step: 30 seconds
- Code Length: 6 digits
- Window: ±1 time step tolerance
- Secret Generation: 20 cryptographically random bytes, Base32-encoded

**Setup Flow:**
1. App generates a unique TOTP secret per user
2. Secret is encoded as a QR code (rendered via goqr.me API) compatible with any authenticator app (Google Authenticator, Authy, 1Password, etc.)
3. User scans the QR code and enters a live TOTP code to confirm setup
4. **8 one-time backup codes** are generated (format: `XXXX-XXXX` hex pairs) and shown once for safe storage
5. State is saved to `localStorage` under the key `vt_2fa`

**2FA Challenge Screen:**
- Shown between successful credential login and app entry
- Accepts live TOTP code or any saved backup code
- Backup code consumption marks the code as used
- Cancel returns to the auth screen and wipes the JWT

**Disable 2FA:**
- Requires TOTP code confirmation before disabling
- State fully cleared from `localStorage`

---

### Messaging / Chat Tab

The Messages tab provides a full in-app messaging experience with multi-platform support.

**Conversation List:**
- Searchable list of direct and group conversations
- Per-conversation unread badge count
- Platform indicator icon (colour-coded per service)
- Online/offline presence indicator per contact
- Relative timestamps (now, 5m, 2h, Mon, etc.)
- Tap avatar to open full Contact Profile overlay

**Contact Profile Overlay:**
- Displays name, platform, online status, initials avatar
- Platform badge (e.g. Instagram, WhatsApp)
- Quick action buttons: Message, Video Call, Voice Call
- Animated slide-up sheet

**New Chat / New Group:**
- Create a new direct message conversation (with platform selection)
- Create a group conversation with a custom name

**Chat Window:**
- Full scrollable message thread with timestamps
- Sent vs. received message bubble styling
- Real-time message sending via backend POST
- Optimistic local state update before server response
- Voice message button (UI element)
- Video/call buttons in header

**Attachment System (8 types supported):**

| Type | Accepted Formats |
|---|---|
| Camera | `image/*` (with camera capture) |
| Gallery | `image/*, video/*` |
| Files | `*/*` |
| HTML | `.html, .htm` |
| Document | `.pdf, .doc, .docx, .txt, .csv, .xls, .xlsx, .ppt, .pptx` |
| Audio | `.mp3, .wav, .ogg, .m4a` |
| Video | `video/*` (with user-facing camera) |
| Any | `*/*` |

Files are uploaded via FormData to the backend S3-connected `/messages/upload` endpoint.

---

### Intelligence Tab (AI Engine)

The Intelligence tab is a powerful, multi-provider AI query interface.

**Response Modes:**

| Mode | Description | Max Tokens |
|---|---|---|
| ⚡ Fast | Quick, direct answers | 800 |
| 🔬 Deep | Exhaustive research with full structured sections | 2048 |
| 🎨 Creative | Vivid, metaphor-rich, memorable responses | 1200 |

Each mode uses a tailored system prompt that shapes the AI's response style and structure.

**Query Flow:**
1. User types a query (or selects from trending/history suggestions)
2. App attempts the backend `/intelligence/search` endpoint first
3. If the backend is unreachable, it falls back to **direct provider API call** using user-supplied key
4. If no key is provided, it falls back to the **built-in Claude integration** (artifact API)

**Search History:**
- Last 10 searches stored locally per session
- Backed by `/intelligence/history` endpoint when authenticated
- Per-item delete functionality
- Clickable to re-run a previous query

**Trending Suggestions:**
- Fetched from `/intelligence/trending`
- Falls back to hard-coded curated suggestions when offline

**API Key Manager Panel:**
- Collapsible panel accessible from the tab header
- Stores user-provided keys in `localStorage` per provider
- Shows which providers have keys configured
- Model selector per provider (e.g. choose between GPT-4o and GPT-4-Turbo)
- Toggle show/hide key visibility

---

### Settings Tab

**Profile Section:**
- Display name editing
- Avatar upload (to S3 via `/users/avatar`)
- Email and phone display (read-only)
- Account tier badge (Pro / Guest / Standard)

**Security Section:**
- Two-Factor Authentication toggle (launches full 2FA setup/disable flow)
- Active Sessions viewer (see all recorded sessions with device, IP, location, browser, OS, and timestamp)
- Per-session "this device" indicator

**Notifications:**
- Push notifications toggle
- Message preview toggle

**Appearance:**
- Theme selection

**About:**
- App version: `v1.0.0`
- Backend API endpoint display: `localhost:5000`
- Terms of Service link

**Sign Out / Exit Guest Mode button**

---

### Session Management

Every successful login records a detailed session object:

| Field | Description |
|---|---|
| `id` | Unique session ID (`sess_<timestamp>_<random>`) |
| `userId` | Authenticated user ID |
| `displayName` | User's display name |
| `email` | User email |
| `loginMethod` | `email_password`, `phone_otp`, `email_otp`, `guest` |
| `loginAt` | ISO 8601 timestamp |
| `ip` | Public IP address (via ipapi.co / ipify fallback) |
| `city`, `region`, `country` | Geolocation from IP |
| `isp` | Internet Service Provider |
| `timezone` | Detected timezone |
| `os` | Detected OS (Windows, macOS, iOS, Android, Linux...) |
| `browser` | Detected browser (Chrome, Firefox, Safari, Edge...) |
| `device` | Desktop / Mobile / Tablet |
| `screen` | Screen resolution |
| `lang` | Browser language |
| `token` | Last 8 chars of JWT for reference |

Up to **20 sessions** are retained in `localStorage` under the key `vt_sessions`.

---

## Design System

Vaultackie uses a purpose-built design token system with a deep navy/black base and cyan accent palette.

**Colour Palette:**

| Token | Value | Usage |
|---|---|---|
| `bg0` | `#050510` | App background |
| `surf` | `#0f0f26` | Surface / headers |
| `card` | `#121232` | Card background |
| `pri` | `#00d4ff` | Primary cyan |
| `sec` | `#7c3aed` | Secondary purple |
| `grn` | `#00e5a0` | Success / online |
| `red` | `#f05050` | Danger / error |
| `yel` | `#fbbf24` | Warning |
| `txt` | `#dde4f0` | Body text |
| `mid` | `#7a85a0` | Muted text |

**Typography:**
- **Syne** — headers, labels, branding (weights 400–800)
- **DM Sans** — body text, inputs, UI (weights 300–600)
- **JetBrains Mono** — code, tokens, keys, timestamps

**Animation Library (CSS keyframes):**
- `fadeUp` — elements entering from below
- `fadeIn` — opacity entrance
- `slideL` / `slideR` — directional slide
- `spin` — loading spinner
- `pulse` — attention pulsing
- `glow` — neon glow cycle
- `float` — gentle levitation (used on the logo)
- `scanl` — scan line effect
- `blink` — cursor blink
- `msgPop` — message bubble entrance

**Component Library (built-in):**
- `Btn` — multi-variant button (primary, solid, secondary, ghost, danger, green)
- `Inp` — labelled input with icon support, focus ring, and error state
- `Tog` — animated toggle switch
- `Av` — avatar with initials fallback, image support, online indicator
- `Chip` — small badge/tag
- `Spinner` — CSS spinner
- `NetBanner` — connectivity status bar

---

## API Integration

The frontend communicates with the backend at:

```
http://localhost:5000/api/v1
```

**Auth endpoints used:**
```
POST   /auth/login
POST   /auth/register
POST   /auth/send-otp
POST   /auth/verify-otp
POST   /auth/guest
POST   /auth/forgot-password
POST   /auth/logout
GET    /auth/me
```

**Messaging endpoints:**
```
GET    /conversations
GET    /conversations/:id/messages
POST   /conversations/:id/messages
POST   /messages/upload
```

**Intelligence endpoints:**
```
POST   /intelligence/search
GET    /intelligence/history
GET    /intelligence/trending
```

**User endpoints:**
```
PATCH  /users/profile
POST   /users/avatar
```

All authenticated requests include the header:
```
Authorization: Bearer <jwt_token>
```

---

## Supported AI Providers

The Intelligence tab supports multiple AI providers, each configurable with a user-supplied API key:

| Provider | Logo | Models Available |
|---|---|---|
| Anthropic (Claude) | 🟠 | claude-sonnet-4, claude-3-5-haiku, claude-opus-4 |
| OpenAI (GPT) | 🟢 | gpt-4o, gpt-4-turbo, gpt-3.5-turbo |
| Google (Gemini) | 🔵 | gemini-1.5-pro, gemini-1.5-flash |
| xAI (Grok) | ⬛ | grok-beta |
| Mistral | 🌊 | mistral-large, mistral-medium |
| Cohere | 🟣 | command-r-plus, command-r |
| Meta (Llama) | 🦙 | llama-3.1-70b (via Together AI) |

**Built-in fallback:** When no key is provided and the backend is offline, the app calls the Anthropic API directly using the built-in artifact integration with `claude-sonnet-4-20250514`.

---

## Supported Platforms

Vaultackie aggregates conversations from 10 platforms into a single unified inbox:

| Platform | Colour | Symbol |
|---|---|---|
| Vaultackie Direct | `#00d4ff` (cyan) | ⬡ |
| Instagram | `#e1306c` (pink) | ◈ |
| X / Twitter | `#1d9bf0` (blue) | ✦ |
| WhatsApp | `#25d366` (green) | ◉ |
| Facebook Messenger | `#0084ff` (blue) | ◈ |
| Telegram | `#0088cc` (teal) | ▲ |
| Discord | `#5865f2` (indigo) | ◆ |
| LinkedIn | `#0a66c2` (navy) | ▣ |
| Snapchat | `#fffc00` (yellow) | ◎ |
| TikTok | `#fe2c55` (red) | ▷ |

---

## File Structure

```
VaultackieApp/
├── VaultackieApp.html     # Standalone HTML — self-contained, runs in browser directly
│                          # Includes: React 18 CDN, Babel CDN, all app code inline
├── VaultackieApp.jsx      # React JSX source — for bundler-based builds
└── README.md              # This file
```

The `.html` file is a fully portable, zero-dependency deployment artifact. Open it directly in a browser to run the app in demo mode without any server.

---

## Running for Testing

> ⚠️ **Testing use only.** No authorisation is granted for any other purpose.

### Option A — Direct Browser (Demo Mode, No Backend)

1. Open `VaultackieApp.html` in any modern browser (Chrome, Firefox, Edge, Safari)
2. The app will launch with mock data and demo authentication
3. Use any of the demo credentials described in Demo Mode below

### Option B — With Backend

1. Ensure your Express backend is running on `http://localhost:5000`
2. Open `VaultackieApp.html` in a browser
3. The API layer will automatically connect

### Option C — React Build Pipeline

1. Copy `VaultackieApp.jsx` into a Vite or Create React App project
2. Install React 18 as a dependency
3. Import and render `<VaultackieApp />` as your root component
4. Configure your bundler to point API calls to your backend

**Browser Requirements:**
- Web Crypto API support (all modern browsers)
- ES2020+ JavaScript support
- LocalStorage access
- Fetch API

---

## Demo Mode

When the backend is unreachable, Vaultackie operates in **Demo Mode** automatically.

**Demo Authentication:**
- Enter any name, email, and password on the Sign Up screen
- The OTP verification screen will display a randomly generated demo code
- Also accepts `123456` or `000000` as universal demo codes

**Demo Conversations (pre-loaded):**
- Alex Rivera — Vaultackie Direct (3 unread)
- Neural Squad — Group, Vaultackie Direct
- Maya Chen — Instagram (1 unread)
- Dev Network — Group (7 unread)
- Carlos Vega — WhatsApp
- Lena Storm — X/Twitter (2 unread)
- Zara Smith — Telegram

**Guest Mode:**
- Click "Guest Mode" on the landing screen
- Instant access with no registration
- AI Intelligence limited to 3 queries
- All conversations shown are demo data

**Demo AI Suggestions:**
- 🔐 How does AES-256-GCM encryption work?
- ⚡ Latest advances in quantum computing 2025
- 🌐 Zero-knowledge proof explained simply
- 🛡 Best practices for digital privacy
- 🤖 How do large language models work?

---

## Security Model

| Feature | Implementation |
|---|---|
| Token Storage | JWT in `localStorage` (key: `vt_tok`) |
| Token Usage | `Authorization: Bearer <token>` header on all API calls |
| 2FA Secret | Stored in `localStorage` (key: `vt_2fa`) — consider moving to server in production |
| TOTP Algorithm | RFC 6238 — HMAC-SHA1, 30s window, 6 digits |
| Backup Codes | 8 codes, hex format, single-use, stored locally |
| Session Logging | Up to 20 sessions with full device/IP fingerprint |
| IP Detection | ipapi.co (primary) → ipify.org (fallback) |
| Password Strength | Client-side checks: uppercase, lowercase, number, symbol |
| File Uploads | FormData to backend S3-proxy endpoint |
| Autofill Styling | Custom CSS prevents browser autofill flash |

---

## Known Limitations (Test Build)

- 2FA secrets and backup codes are stored in `localStorage` — not suitable for production without server-side storage
- Session records are stored in `localStorage` — cleared on browser data wipe
- Multi-platform messaging (Instagram, WhatsApp, etc.) is UI-only in this build; actual platform OAuth/API integration must be implemented server-side
- File attachments require the backend S3 integration to persist
- The built-in AI fallback is available only when running inside the Anthropic Claude artifact environment
- Guest mode is rate-limited to 3 AI queries per session
- No end-to-end encryption is implemented client-side in this build (the UI describes it as a goal)
- Real-time messaging (Socket.IO) requires the backend to be active

---

## About

```
VAULTACKIE · SECURE INTELLIGENCE INTERFACE
v1.0.0 · All communications encrypted

Built by Vaultackie
© Vaultackie — All Rights Reserved
No License · No Authorisation · Testing Only
```
