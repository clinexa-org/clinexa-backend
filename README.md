# Clinexa Backend

Backend API for Clinexa — Clinic Management SaaS  
Built with Node.js, Express, MongoDB + Mongoose  

## Setup

1. Clone the repo  
2. Copy `.env.example` → `.env`, add your values  
3. Run `npm install`  
4. Run `npm run dev`  

## Auth Endpoints (Sprint 1)

- POST /api/auth/register  
- POST /api/auth/login  
- GET  /api/auth/me  (requires Bearer token)  

### Response Format

All responses follow this structure:
```json
{
  "status": "success" | "error",
  "message": String | null,
  "data": Object | null
}
