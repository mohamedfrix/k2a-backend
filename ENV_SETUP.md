# Environment Configuration

This document explains how to set up the environment variables for the K2A Backend API.

## Quick Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file with your values:**
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Validate your environment configuration:**
   ```bash
   npm run validate-env
   ```

## Required Environment Variables

### Server Configuration
- `NODE_ENV`: Environment mode (`development`, `production`, `test`)
- `PORT`: Port number for the server (default: 5000)
- `API_VERSION`: API version (default: v1)

### Database Configuration
- `DATABASE_URL`: PostgreSQL connection string for Prisma
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name
- `POSTGRES_PORT`: PostgreSQL port (default: 5432)

### JWT Authentication
- `JWT_SECRET`: Secret key for JWT tokens (minimum 32 characters)
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens (minimum 32 characters)
- `JWT_ACCESS_TOKEN_EXPIRES_IN`: Access token expiration time (default: 15m)
- `JWT_REFRESH_TOKEN_EXPIRES_IN`: Refresh token expiration time (default: 7d)

### CORS Configuration
- `FRONTEND_URL`: Frontend URL for CORS policy (default: http://localhost:3000)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: 900000 = 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 100)
- `AUTH_RATE_LIMIT_MAX_REQUESTS`: Maximum auth requests per window (default: 5)

### Logging
- `LOG_LEVEL`: Logging level (`error`, `warn`, `info`, `debug`)

## Optional Environment Variables

### pgAdmin (Database Management)
- `PGADMIN_DEFAULT_EMAIL`: Default email for pgAdmin
- `PGADMIN_DEFAULT_PASSWORD`: Default password for pgAdmin
- `PGADMIN_PORT`: Port for pgAdmin interface

## Security Best Practices

### JWT Secrets Generation
For production, generate secure random strings:
```bash
# Generate JWT secret
openssl rand -base64 64

# Generate refresh secret  
openssl rand -base64 64
```

### Database Security
- Use strong passwords for database users
- Restrict database access to necessary hosts only
- Enable SSL connections in production

### Production Configuration
When deploying to production:

1. Set `NODE_ENV=production`
2. Use secure, randomly generated JWT secrets
3. Use a strong database password
4. Set `FRONTEND_URL` to your production domain
5. Consider stricter rate limiting values
6. Set `LOG_LEVEL=warn` or `LOG_LEVEL=error`

## Docker Setup

The included `docker-compose.yml` file uses environment variables from your `.env` file:

```bash
# Start PostgreSQL with Docker
docker compose up -d

# Check container status
docker compose ps

# Connect to database
docker exec -it k2a-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
```

## Validation

Use the validation script to ensure all environment variables are properly configured:

```bash
npm run validate-env
```

This script will:
- ✅ Check all required variables are set
- ✅ Validate JWT secret lengths for security
- ✅ Verify DATABASE_URL format
- ✅ Report any configuration issues

## Troubleshooting

### Common Issues

1. **Database connection fails:**
   - Ensure PostgreSQL is running: `docker compose ps`
   - Check DATABASE_URL format
   - Verify credentials match Docker Compose settings

2. **JWT validation errors:**
   - Ensure JWT secrets are at least 32 characters long
   - Regenerate secrets if needed

3. **CORS errors:**
   - Verify FRONTEND_URL matches your frontend application URL
   - Check that your frontend is running on the specified port

### Environment Validation Errors
If `npm run validate-env` reports errors:
1. Check that `.env` file exists in the backend directory
2. Ensure all required variables are set
3. Verify JWT secrets meet minimum length requirements
4. Check DATABASE_URL format is correct

## File Structure
```
backend/
├── .env                    # Your environment variables (do not commit)
├── .env.example           # Example environment file (safe to commit)
├── scripts/
│   └── validate-env.js    # Environment validation script
└── docker-compose.yml     # Docker configuration
```
