# Rowing Goals

A web application that allows users to set and track rowing goals using their Concept2 account data.

## Features

- OAuth2 authentication with Concept2 logbook
- User goal setting and tracking
- Integration with Concept2 workout data

## Setup

### Prerequisites

1. Node.js and npm installed
2. Supabase account
3. Concept2 API access (register at log.concept2.com/developers)

### Development Setup

1. Backend setup:
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

2. Frontend setup:
```bash
cd frontend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

3. Configure Supabase:
   - Create a new project in Supabase
   - Enable Keycloak authentication provider
   - Set the Realm URL to your backend URL

4. Configure Concept2:
   - Register for API access at log.concept2.com/developers
   - Configure OAuth2 redirect URI to point to your backend callback URL

## Architecture

This application uses:
- Frontend: React with TypeScript
- Backend: Node.js/Express
- Authentication: Concept2 OAuth2 via Supabase (using Keycloak provider)
- Database: Supabase PostgreSQL

The backend serves as a translation layer between Supabase's Keycloak provider and Concept2's OAuth2 implementation.
