# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gmail Viewer - A web application to view emails from a Gmail account via IMAP. Displays inbox emails with date filtering, attachment download support, and mobile-responsive design.

## Development Commands

```bash
# Start both server and client concurrently (from root)
npm start

# Or use the helper script
./start.sh

# Client only (from client/)
npm run dev      # Development server with hot-reload
npm run build    # Production build
npm run lint     # ESLint

# Server only (from server/)
nodemon index.js # Development with hot-reload
```

## Architecture

### Monorepo Structure
- `/server` - Express.js backend (CommonJS)
- `/client` - React frontend with Vite (ES modules)
- Root `package.json` uses `concurrently` to run both

### Backend (server/index.js)
Single-file Express 5 server that:
- Connects to Gmail via IMAP (`imap-simple`)
- Parses emails with `mailparser`
- Serves React build from `public/` in production
- API endpoints:
  - `GET /api/emails?date=YYYY-MM-DD` - Fetch emails (date filter optional, defaults to last 20)
  - `GET /api/emails/:uid/attachments/:filename` - Download attachment
  - `GET /api/health` - Health check

### Frontend (client/src/App.jsx)
Single-component React app with:
- Date picker for filtering emails
- Split-pane layout (sidebar list + main content)
- Mobile-responsive with show/hide navigation
- Uses `DOMPurify` for safe HTML rendering
- Vite proxy forwards `/api` to backend in dev

### Production Build
Docker multi-stage build (see `Dockerfile`):
1. Builds React client
2. Installs server dependencies
3. Copies client build to `server/public/`
4. Server serves static files and handles SPA routing

## Environment Variables

Required in `server/.env`:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=gmail-app-password
```

Note: `EMAIL_PASS` must be a Gmail App Password, not account password.

## Deployment

- GitHub Actions builds and pushes to `ghcr.io` on push to `main`
- Deployed via Docker Swarm with Traefik reverse proxy
- Domain: `gmailinterno.pfoita.com.br`
- See `DEPLOY.md` for full deployment guide
