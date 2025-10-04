# If Wanting to Create Missing Env File

## CRITICAL WARNINGS
- **.env file is LOCKED - NEVER create/edit/read it**
- **Use MySQL, NOT SQLite** (500 errors occur with SQLite)
- **VITE_API_URL null is NORMAL** (frontend uses hardcoded production URL)

## Key Points
- Environment variables exist on server
- Database: MySQL only (IMPORTANT)
- Production: `https://teabubble.attrebi.ch`
- Focus on code fixes, not environment config