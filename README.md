# Secure Voting System

A secure voting application with backend authentication and database storage.

## Project Structure

- **Frontend**: React application with Vite
- **Backend**: Express server for authentication and data storage
- **Database**: PostgreSQL for user management and vote storage


## Features

- User registration with PostgreSQL database
- User login with secure authentication
- Dynamic voting system with real-time updates
- Backend API for data persistence

## Database Schema

The application uses two main tables:

1. **users** - Stores user credentials
   - id (SERIAL PRIMARY KEY)
   - username (VARCHAR, UNIQUE)
   - password (VARCHAR)
   - created_at (TIMESTAMP)

2. **votes** - Stores voting topics and results
   - id (SERIAL PRIMARY KEY)
   - title (VARCHAR)
   - options (JSONB)
   - votes (JSONB)
   - created_at (TIMESTAMP)

## API Endpoints

- **POST /api/register** - Register a new user
- **POST /api/login** - Authenticate a user
- **GET /api/votes** - Get all available votes
- **POST /api/vote** - Submit a vote

## Security Notes

This is a simplified demo. In a production environment, you should:
- Hash passwords
- Use HTTPS
- Implement proper session management with JWT
- Add rate limiting
- Add input validation and sanitization

## Demo User

The application automatically creates a demo user on first signup:
- Username: admin
- Password: password

## How It Works

1. **User Registration**: New user data is stored in the PostgreSQL database
2. **Authentication**: Login credentials are verified against the PostgreSQL database
3. **Session Management**: Current user is stored in the PostgreSQL database

## Backend Structure

```
/backend
  /controllers     # Request handlers
  /models         # Database models
  /routes         # API routes
  /config         # Configuration files
/src
  /components     # React components
  /utils          # Utility functions
```

## Security Features

- SSL/TLS encryption
- Database connection pooling
- Error handling
- Local storage fallback

## Future Improvements

- Password hashing
- JWT authentication
- Rate limiting
- Input validation
- HTTPS enforcement

---
*Note: This is a development project and not intended for production use without additional security measures.*
