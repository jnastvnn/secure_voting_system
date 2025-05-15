# Secure Voting System

A secure electronic voting application with cryptographic verification features, secure authentication, and database storage.

## Features

- **Secure Authentication**: Password hashing, HTTP-only cookies, and JWT tokens
- **Individual Verifiability**: Voters can verify their votes were counted correctly
- **Ballot Secrecy**: Voter identities are separated from their choices
- **Homomorphic-like Vote Counting**: Votes are tallied without decrypting individual ballots
- **Rate Limiting**: Protection against brute force and DOS attacks
- **Database Storage**: PostgreSQL for secure, reliable data persistence

## Technologies

- **Frontend**: React, Redux Toolkit, CryptoJS
- **Backend**: Express.js, PostgreSQL
- **Security**: JWT, bcrypt, rate limiting

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn
- PostgreSQL database

### Environment Setup
1. Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=postgres://username:password@localhost:5432/voting_db
PORT=3000
SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
VOTE_ENCRYPTION_KEY=your_vote_encryption_key
NODE_ENV=development
VITE_API_URL=http://localhost:3000
```

### Database Setup
1. Create a PostgreSQL database:
```sql
CREATE DATABASE voting_db;
```
2. The application will automatically create the required tables on first run.

### Installation Steps
1. Clone the repository:
```bash
git clone https://github.com/yourusername/secure_voting_system.git
cd secure_voting_system
```
2. Install dependencies for both frontend and backend:
```bash
npm install
cd backend
npm install
cd ..
```

3. Start the development servers:
```bash
npm run dev
```
This will start both the frontend server (on port 5173) and the backend server (on port 3000).

4. Access the application at `http://localhost:5173`

### Production Deployment
To build and run in production:

```bash
npm run build
npm start
```

## Project Structure

```
secure_voting_system/
├── backend/                # Backend server code
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Authentication & rate limiting
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Cryptographic utilities
│   └── server.js           # Express server entry point
├── src/                    # Frontend React code
│   ├── components/         # React components
│   ├── store/              # Redux state management
│   └── utils/              # Frontend utilities
├── .env                    # Environment variables (create this file)
└── package.json            # Project dependencies
```
## Security Features

- **Authentication**: JWT tokens in HTTP-only cookies
- **Password Storage**: bcrypt hashing
- **Cryptographic Vote Security**: 
  - Encrypted vote storage
  - Verification tokens for voters
  - Separation of identity from vote choices
- **Transport Security**: TLS/SSL for database and API connections
- **Rate Limiting**: Protection against brute force attacks

## API Endpoints

- **Authentication**:
  - `POST /api/auth/register` - Register a new user
  - `POST /api/auth/login` - Authenticate a user
  - `POST /api/auth/logout` - Log out a user

- **Standard Polls**:
  - `GET /api/polls` - Get all polls
  - `POST /api/polls/create` - Create a new poll
  - `POST /api/polls/vote` - Submit a vote

- **Secure Polls**:
  - `GET /api/secure-polls` - Get all secure polls
  - `POST /api/secure-polls/create` - Create a new secure poll
  - `POST /api/secure-polls/vote` - Submit a secure vote
  - `POST /api/secure-polls/verify` - Verify a vote was counted

## AI-Assisted Development

This project was built with the assistance of AI tools to enhance development efficiency and security:

- **Code Generation**: AI assisted in generating boilerplate code and complex cryptographic functions.
- **Code Refactoring**: AI helped in simplifying components and extracting helper functions to improve readability and maintainability.
- **Documentation**: AI helped generate comprehensive documentation, including installation instructions and security feature explanations.

AI assistance was particularly valuable for implementing cryptographic voting features and ensuring secure authentication practices. The code was human-reviewed after generation to ensure quality and security.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Note: This application implements cryptographic security features for educational purposes. For production voting systems, additional security measures and expert review are recommended.*


