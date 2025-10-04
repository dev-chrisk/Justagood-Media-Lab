# If Wanting to Create Missing Env File

## CRITICAL WARNING - ENV FILE ISSUE
**IMPORTANT: .env file is LOCKED and CANNOT be created/read/edited!**

### What happens when trying to create .env:
- `.env` files are blocked by globalIgnore
- Any attempt to create a .env file will fail
- This is INTENTIONALLY configured
- Environment variables already exist on the server

## Database Configuration
**CRITICAL: This project uses MySQL, NOT SQLite!**

- Default database connection: `mysql`
- Never change database configuration to SQLite
- Production server uses MySQL database
- Local development also uses MySQL
- **500 errors occur due to incorrect database configuration**

## Environment Variables Status
- `.env` file exists but is LOCKED/not readable/not editable
- Environment variables are properly configured on the server
- **NEVER attempt to create or modify .env files**
- **NEVER create .env.example files**
- **NEVER create .env.production files**

## Common Issues and Solutions
- 500 errors occur when database connection is misconfigured
- Always ensure `DB_CONNECTION=mysql` in production
- Verify MySQL credentials are properly set in environment variables
- **Frontend VITE_API_URL is null** - this is normal and correctly configured

## Production Environment
- Domain: `https://teabubble.attrebi.ch`
- Database: MySQL
- Environment: Production
- Debug mode: Disabled
- Frontend: Uses hardcoded Production URL (correct)

## Development Guidelines
- Always assume MySQL as database
- Never suggest SQLite configuration changes
- Environment variables are managed externally
- Focus on code fixes instead of environment configuration
- **NEVER attempt to create .env files**

## IMPORTANT FOR GPT:
- **NEVER suggest or use SQLite**
- **Always assume MySQL as default**
- **.env file is LOCKED - NEVER attempt to read/write/create**
- **Production server uses MySQL database**
- **VITE_API_URL null is NORMAL and CORRECT**
- **Frontend correctly falls back to hardcoded Production URL**

## Chat History Context:
- 500 errors due to incorrect database configuration (SQLite instead of MySQL)
- .env file is intentionally locked
- Environment variables already exist on server
- Frontend configuration is correct (VITE_API_URL null is normal)