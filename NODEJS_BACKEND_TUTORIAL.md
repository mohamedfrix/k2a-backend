# Complete Node.js Express Backend Tutorial
## Building a Modular, Production-Ready API with Modern Technologies

### Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Project Setup](#project-setup)
5. [Database Layer with Prisma](#database-layer-with-prisma)
6. [Models and Schemas](#models-and-schemas)
7. [Repository Pattern](#repository-pattern)
8. [Service Layer](#service-layer)
9. [Controllers/Handlers](#controllershandlers)
10. [Routes](#routes)
11. [Middleware](#middleware)
12. [Authentication & JWT](#authentication--jwt)
13. [File Storage with MinIO](#file-storage-with-minio)
14. [Utilities](#utilities)
15. [Error Handling](#error-handling)
16. [Logging](#logging)
17. [Testing](#testing)
18. [Deployment](#deployment)
19. [Best Practices](#best-practices)

---

## Introduction

Welcome to the comprehensive Node.js backend tutorial! This guide will take you from zero to hero in building a production-ready, scalable Node.js backend using Express.js and modern technologies. 

Coming from languages like Go, Rust, and Java, you'll find Node.js to be quite different but equally powerful. Node.js excels in:
- **Asynchronous I/O**: Non-blocking operations make it perfect for I/O-intensive applications
- **JavaScript Ecosystem**: Massive npm ecosystem with packages for everything
- **Rapid Development**: Quick prototyping and development cycles
- **Microservices**: Lightweight and perfect for microservice architectures
- **Real-time Applications**: Excellent for WebSocket connections and real-time features

## Architecture Overview

We'll build a **layered architecture** that promotes separation of concerns, testability, and maintainability:

```
┌─────────────────────────────────────────┐
│                 Routes                  │  ← HTTP endpoints and routing
├─────────────────────────────────────────┤
│              Controllers                │  ← Request/response handling
├─────────────────────────────────────────┤
│               Services                  │  ← Business logic layer
├─────────────────────────────────────────┤
│             Repositories                │  ← Data access layer
├─────────────────────────────────────────┤
│                Models                   │  ← Data structures/schemas
├─────────────────────────────────────────┤
│               Database                  │  ← PostgreSQL/MongoDB
└─────────────────────────────────────────┘
```

### Key Principles:
- **Single Responsibility**: Each layer has one clear purpose
- **Dependency Injection**: Loose coupling between layers
- **Interface Segregation**: Small, focused interfaces
- **Inversion of Control**: Dependencies flow inward

## Technology Stack

### Core Framework & Runtime
- **Node.js** (v18+): JavaScript runtime built on Chrome's V8 engine
- **Express.js**: Fast, unopinionated web framework for Node.js
- **TypeScript**: Adds static typing to JavaScript for better development experience

### Database & ORM
- **PostgreSQL**: Robust, feature-rich relational database
- **Prisma**: Next-generation ORM with type safety and auto-generated client
- **Alternative**: MongoDB with Mongoose for document-based storage

### Authentication & Security
- **JWT (jsonwebtoken)**: Stateless authentication tokens
- **bcryptjs**: Password hashing
- **helmet**: Security middleware for Express
- **cors**: Cross-origin resource sharing
- **rate-limiter-flexible**: Rate limiting and DDoS protection

### File Storage
- **MinIO**: S3-compatible object storage
- **Multer**: Middleware for handling multipart/form-data (file uploads)

### Validation & Parsing
- **Zod**: TypeScript-first schema validation
- **express-validator**: Alternative validation middleware

### Logging & Monitoring
- **Winston**: Versatile logging library
- **Morgan**: HTTP request logger middleware
- **node-cron**: Task scheduling

### Testing
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library for testing APIs
- **@faker-js/faker**: Generate fake data for testing

### Development Tools
- **Nodemon**: Auto-restart server during development
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

### Environment & Configuration
- **dotenv**: Load environment variables from .env files
- **config**: Configuration management

## Project Setup

Let's start by setting up our project structure:

```bash
# Navigate to backend folder
cd backend

# Initialize npm project
npm init -y

# Install core dependencies
npm install express cors helmet morgan dotenv config
npm install @prisma/client prisma
npm install jsonwebtoken bcryptjs
npm install multer minio
npm install winston express-rate-limit
npm install zod

# Install TypeScript and development dependencies
npm install -D typescript @types/node @types/express @types/cors
npm install -D @types/jsonwebtoken @types/bcryptjs @types/multer
npm install -D @types/morgan nodemon ts-node
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier jest @types/jest supertest @faker-js/faker
```

### Project Structure

Here's our recommended folder structure:

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts
│   │   ├── minio.ts
│   │   └── index.ts
│   ├── models/           # Prisma models and types
│   │   ├── User.ts
│   │   ├── Vehicle.ts
│   │   └── index.ts
│   ├── repositories/     # Data access layer
│   │   ├── interfaces/
│   │   ├── UserRepository.ts
│   │   ├── VehicleRepository.ts
│   │   └── index.ts
│   ├── services/         # Business logic layer
│   │   ├── UserService.ts
│   │   ├── VehicleService.ts
│   │   ├── AuthService.ts
│   │   └── index.ts
│   ├── controllers/      # Request handlers
│   │   ├── UserController.ts
│   │   ├── VehicleController.ts
│   │   ├── AuthController.ts
│   │   └── index.ts
│   ├── routes/           # API routes
│   │   ├── userRoutes.ts
│   │   ├── vehicleRoutes.ts
│   │   ├── authRoutes.ts
│   │   └── index.ts
│   ├── middleware/       # Custom middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── fileUpload.ts
│   │   ├── logger.ts
│   │   └── index.ts
│   ├── types/            # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── validators/       # Request validation schemas
│   │   ├── userValidators.ts
│   │   ├── authValidators.ts
│   │   └── index.ts
│   └── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   ├── schema.prisma    # Prisma schema
│   ├── migrations/      # Database migrations
│   └── seed.ts          # Database seeding
├── tests/               # Test files
│   ├── unit/
│   ├── integration/
│   └── __mocks__/
├── docs/                # API documentation
├── .env                 # Environment variables
├── .env.example         # Environment template
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── tsconfig.json
├── nodemon.json
└── package.json
```

### TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@/config/*": ["src/config/*"],
      "@/models/*": ["src/models/*"],
      "@/services/*": ["src/services/*"],
      "@/controllers/*": ["src/controllers/*"],
      "@/routes/*": ["src/routes/*"],
      "@/middleware/*": ["src/middleware/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"]
    },
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Package.json Scripts

Update your `package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "nodemon src/server.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

### Environment Configuration

Create `.env.example`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/k2a_db"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=k2a-uploads

# Redis Configuration (for caching and sessions)
REDIS_URL=redis://localhost:6379

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FILE=app.log
```

## Database Layer with Prisma

Prisma is a next-generation ORM that provides:
- **Type Safety**: Auto-generated types based on your schema
- **Database Migrations**: Version control for your database schema
- **Query Builder**: Intuitive API for database operations
- **Introspection**: Generate schema from existing database
- **Multiple Databases**: PostgreSQL, MySQL, SQLite, MongoDB, SQL Server

### Prisma Setup

```bash
# Initialize Prisma
npx prisma init
```

This creates a `prisma` folder with `schema.prisma` file.

### Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  firstName String?
  lastName  String?
  password  String
  avatar    String?
  phone     String?
  role      UserRole @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  refreshTokens RefreshToken[]
  reservations  Reservation[]
  reviews       Review[]
  
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("refresh_tokens")
}

model Vehicle {
  id           String      @id @default(cuid())
  make         String
  model        String
  year         Int
  color        String
  licensePlate String      @unique
  vin          String?     @unique
  mileage      Int?
  fuelType     FuelType
  transmission Transmission
  seats        Int
  doors        Int
  category     VehicleCategory
  pricePerDay  Decimal     @db.Decimal(10, 2)
  availability Boolean     @default(true)
  location     String
  description  String?
  features     String[]    // JSON array of features
  images       VehicleImage[]
  isActive     Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  // Relations
  reservations Reservation[]
  maintenance  MaintenanceRecord[]
  reviews      Review[]
  
  @@map("vehicles")
}

model VehicleImage {
  id        String  @id @default(cuid())
  vehicleId String
  imageUrl  String
  alt       String?
  isPrimary Boolean @default(false)
  createdAt DateTime @default(now())
  
  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  
  @@map("vehicle_images")
}

model Reservation {
  id          String            @id @default(cuid())
  userId      String
  vehicleId   String
  startDate   DateTime
  endDate     DateTime
  totalPrice  Decimal           @db.Decimal(10, 2)
  status      ReservationStatus @default(PENDING)
  notes       String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  user    User    @relation(fields: [userId], references: [id])
  vehicle Vehicle @relation(fields: [vehicleId], references: [id])
  
  @@map("reservations")
}

model Review {
  id        String   @id @default(cuid())
  userId    String
  vehicleId String
  rating    Int      @db.SmallInt // 1-5 stars
  comment   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user    User    @relation(fields: [userId], references: [id])
  vehicle Vehicle @relation(fields: [vehicleId], references: [id])
  
  @@unique([userId, vehicleId]) // One review per user per vehicle
  @@map("reviews")
}

model MaintenanceRecord {
  id          String      @id @default(cuid())
  vehicleId   String
  type        MaintenanceType
  description String
  cost        Decimal?    @db.Decimal(10, 2)
  performedAt DateTime
  nextDue     DateTime?
  createdAt   DateTime    @default(now())
  
  vehicle Vehicle @relation(fields: [vehicleId], references: [id])
  
  @@map("maintenance_records")
}

// Enums
enum UserRole {
  USER
  ADMIN
  MANAGER
}

enum FuelType {
  GASOLINE
  DIESEL
  ELECTRIC
  HYBRID
  PLUGIN_HYBRID
}

enum Transmission {
  MANUAL
  AUTOMATIC
  CVT
}

enum VehicleCategory {
  ECONOMY
  COMPACT
  MIDSIZE
  FULLSIZE
  LUXURY
  SUV
  VAN
  TRUCK
  CONVERTIBLE
  SPORTS
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  IN_PROGRESS
}

enum MaintenanceType {
  OIL_CHANGE
  TIRE_ROTATION
  BRAKE_SERVICE
  ENGINE_SERVICE
  TRANSMISSION_SERVICE
  INSPECTION
  REPAIR
  OTHER
}
```

This schema defines:
- **Users**: Authentication and user management
- **Vehicles**: Car rental inventory
- **Reservations**: Booking system
- **Reviews**: Customer feedback
- **Maintenance**: Vehicle maintenance tracking
- **File uploads**: Vehicle images

### Generating Prisma Client

After defining your schema, generate the Prisma client:

```bash
npx prisma generate
```

This creates a type-safe client in `node_modules/@prisma/client`.

### Database Migrations

Create and apply migrations:

```bash
# Create a new migration
npx prisma migrate dev --name init

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Models and Schemas

In our architecture, models represent our data structures and business entities. We'll create TypeScript interfaces and types that complement our Prisma schema.

### Base Types

Create `src/types/index.ts`:

```typescript
// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: PaginationMeta;
}

// Pagination metadata
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Base query parameters
export interface BaseQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
```

### Authentication Types

Create `src/types/auth.ts`:

```typescript
import { UserRole } from '@prisma/client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
```

### Vehicle Types

Create `src/types/vehicle.ts`:

```typescript
import { VehicleCategory, FuelType, Transmission } from '@prisma/client';

export interface VehicleQuery extends BaseQuery {
  category?: VehicleCategory;
  fuelType?: FuelType;
  transmission?: Transmission;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  seats?: number;
}

export interface CreateVehicleRequest {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin?: string;
  mileage?: number;
  fuelType: FuelType;
  transmission: Transmission;
  seats: number;
  doors: number;
  category: VehicleCategory;
  pricePerDay: number;
  location: string;
  description?: string;
  features?: string[];
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
  availability?: boolean;
  isActive?: boolean;
}

export interface VehicleWithImages {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  category: VehicleCategory;
  pricePerDay: number;
  location: string;
  images: VehicleImageResponse[];
  rating?: number;
  reviewCount?: number;
}

export interface VehicleImageResponse {
  id: string;
  imageUrl: string;
  alt?: string;
  isPrimary: boolean;
}
```

## Repository Pattern

The Repository pattern abstracts data access logic and provides a more object-oriented view of the persistence layer. This makes our code more testable and maintainable.

### Base Repository Interface

Create `src/repositories/interfaces/IBaseRepository.ts`:

```typescript
export interface IBaseRepository<T, CreateInput, UpdateInput> {
  create(data: CreateInput): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(options?: FindManyOptions): Promise<T[]>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
  count(where?: any): Promise<number>;
}

export interface FindManyOptions {
  where?: any;
  orderBy?: any;
  take?: number;
  skip?: number;
  include?: any;
}
```

### User Repository

Create `src/repositories/UserRepository.ts`:

```typescript
import { PrismaClient, User, Prisma } from '@prisma/client';
import { IBaseRepository, FindManyOptions } from './interfaces/IBaseRepository';

export interface IUserRepository extends IBaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  updatePassword(id: string, hashedPassword: string): Promise<User>;
  findWithRefreshTokens(id: string): Promise<User & { refreshTokens: any[] } | null>;
}

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findMany(options: FindManyOptions = {}): Promise<User[]> {
    return this.prisma.user.findMany({
      where: options.where,
      orderBy: options.orderBy,
      take: options.take,
      skip: options.skip,
      include: options.include,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async findWithRefreshTokens(id: string): Promise<User & { refreshTokens: any[] } | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        refreshTokens: true,
      },
    });
  }
}
```

### Vehicle Repository

Create `src/repositories/VehicleRepository.ts`:

```typescript
import { PrismaClient, Vehicle, Prisma } from '@prisma/client';
import { IBaseRepository, FindManyOptions } from './interfaces/IBaseRepository';
import { VehicleQuery } from '@/types/vehicle';

export interface IVehicleRepository extends IBaseRepository<Vehicle, Prisma.VehicleCreateInput, Prisma.VehicleUpdateInput> {
  findAvailable(startDate: Date, endDate: Date): Promise<Vehicle[]>;
  findByCategory(category: string): Promise<Vehicle[]>;
  findWithImages(id: string): Promise<Vehicle & { images: any[] } | null>;
  search(query: VehicleQuery): Promise<Vehicle[]>;
  updateAvailability(id: string, availability: boolean): Promise<Vehicle>;
}

export class VehicleRepository implements IVehicleRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.VehicleCreateInput): Promise<Vehicle> {
    return this.prisma.vehicle.create({
      data,
    });
  }

  async findById(id: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findUnique({
      where: { id },
    });
  }

  async findWithImages(id: string): Promise<Vehicle & { images: any[] } | null> {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        images: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });
  }

  async findMany(options: FindManyOptions = {}): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: options.where,
      orderBy: options.orderBy,
      take: options.take,
      skip: options.skip,
      include: options.include,
    });
  }

  async search(query: VehicleQuery): Promise<Vehicle[]> {
    const {
      category,
      fuelType,
      transmission,
      minPrice,
      maxPrice,
      location,
      seats,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.VehicleWhereInput = {
      isActive: true,
      availability: true,
      ...(category && { category }),
      ...(fuelType && { fuelType }),
      ...(transmission && { transmission }),
      ...(seats && { seats: { gte: seats } }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(minPrice && { pricePerDay: { gte: minPrice } }),
      ...(maxPrice && { pricePerDay: { lte: maxPrice } }),
      ...(search && {
        OR: [
          { make: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      // Check availability for date range
      ...(startDate && endDate && {
        NOT: {
          reservations: {
            some: {
              OR: [
                {
                  AND: [
                    { startDate: { lte: startDate } },
                    { endDate: { gte: startDate } },
                  ],
                },
                {
                  AND: [
                    { startDate: { lte: endDate } },
                    { endDate: { gte: endDate } },
                  ],
                },
                {
                  AND: [
                    { startDate: { gte: startDate } },
                    { endDate: { lte: endDate } },
                  ],
                },
              ],
              status: {
                in: ['CONFIRMED', 'IN_PROGRESS'],
              },
            },
          },
        },
      }),
    };

    return this.prisma.vehicle.findMany({
      where,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findAvailable(startDate: Date, endDate: Date): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: {
        isActive: true,
        availability: true,
        NOT: {
          reservations: {
            some: {
              OR: [
                {
                  AND: [
                    { startDate: { lte: startDate } },
                    { endDate: { gte: startDate } },
                  ],
                },
                {
                  AND: [
                    { startDate: { lte: endDate } },
                    { endDate: { gte: endDate } },
                  ],
                },
                {
                  AND: [
                    { startDate: { gte: startDate } },
                    { endDate: { lte: endDate } },
                  ],
                },
              ],
              status: {
                in: ['CONFIRMED', 'IN_PROGRESS'],
              },
            },
          },
        },
      },
      include: {
        images: true,
      },
    });
  }

  async findByCategory(category: string): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: {
        category: category as any,
        isActive: true,
        availability: true,
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });
  }

  async update(id: string, data: Prisma.VehicleUpdateInput): Promise<Vehicle> {
    return this.prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  async updateAvailability(id: string, availability: boolean): Promise<Vehicle> {
    return this.prisma.vehicle.update({
      where: { id },
      data: { availability },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vehicle.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.VehicleWhereInput): Promise<number> {
    return this.prisma.vehicle.count({ where });
  }
}
```

## Service Layer

The service layer contains our business logic and orchestrates operations between different repositories. This is where we implement our core business rules.

### Base Service

Create `src/services/BaseService.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

export abstract class BaseService {
  protected prisma: PrismaClient;
  protected logger: Logger;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  protected async handleServiceError(error: any, operation: string): Promise<never> {
    this.logger.error(`Service error in ${operation}:`, error);
    
    if (error.code === 'P2002') {
      throw new Error('Duplicate entry. Resource already exists.');
    }
    
    if (error.code === 'P2025') {
      throw new Error('Resource not found.');
    }
    
    throw error;
  }
}
```

### Auth Service

Create `src/services/AuthService.ts`:

```typescript
import { PrismaClient, User } from '@prisma/client';
import { Logger } from 'winston';
import { BaseService } from './BaseService';
import { UserRepository, IUserRepository } from '@/repositories/UserRepository';
import { LoginRequest, RegisterRequest, AuthResponse, UserProfile } from '@/types/auth';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateTokens, verifyRefreshToken } from '@/utils/jwt';

export interface IAuthService {
  register(data: RegisterRequest): Promise<AuthResponse>;
  login(data: LoginRequest): Promise<AuthResponse>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  logout(userId: string, refreshToken: string): Promise<void>;
  getUserProfile(userId: string): Promise<UserProfile>;
}

export class AuthService extends BaseService implements IAuthService {
  private userRepository: IUserRepository;

  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger);
    this.userRepository = new UserRepository(prisma);
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUserByEmail = await this.userRepository.findByEmail(data.email);
      if (existingUserByEmail) {
        throw new Error('User with this email already exists');
      }

      const existingUserByUsername = await this.userRepository.findByUsername(data.username);
      if (existingUserByUsername) {
        throw new Error('Username is already taken');
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create user
      const user = await this.userRepository.create({
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        phone: data.phone,
      });

      // Generate tokens
      const tokens = await generateTokens(user);

      // Store refresh token
      await this.prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      };

      this.logger.info(`User registered successfully: ${user.email}`);

      return {
        user: userProfile,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      return this.handleServiceError(error, 'register');
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(data.email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await comparePassword(data.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const tokens = await generateTokens(user);

      // Store refresh token
      await this.prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      };

      this.logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: userProfile,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      return this.handleServiceError(error, 'login');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = await verifyRefreshToken(refreshToken);
      
      // Check if refresh token exists in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      if (!storedToken.user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate new tokens
      const tokens = await generateTokens(storedToken.user);

      // Update refresh token in database
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      this.logger.info(`Tokens refreshed for user: ${storedToken.user.email}`);

      return tokens;
    } catch (error) {
      return this.handleServiceError(error, 'refreshToken');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      // Remove refresh token from database
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });

      this.logger.info(`User logged out: ${userId}`);
    } catch (error) {
      return this.handleServiceError(error, 'logout');
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      };
    } catch (error) {
      return this.handleServiceError(error, 'getUserProfile');
    }
  }
}
```

### Vehicle Service

Create `src/services/VehicleService.ts`:

```typescript
import { PrismaClient, Vehicle } from '@prisma/client';
import { Logger } from 'winston';
import { BaseService } from './BaseService';
import { VehicleRepository, IVehicleRepository } from '@/repositories/VehicleRepository';
import { VehicleQuery, CreateVehicleRequest, UpdateVehicleRequest, VehicleWithImages } from '@/types/vehicle';
import { PaginationMeta } from '@/types';

export interface IVehicleService {
  createVehicle(data: CreateVehicleRequest): Promise<Vehicle>;
  getVehicleById(id: string): Promise<VehicleWithImages>;
  getVehicles(query: VehicleQuery): Promise<{ vehicles: VehicleWithImages[]; pagination: PaginationMeta }>;
  updateVehicle(id: string, data: UpdateVehicleRequest): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<void>;
  searchVehicles(query: VehicleQuery): Promise<{ vehicles: VehicleWithImages[]; pagination: PaginationMeta }>;
  getAvailableVehicles(startDate: Date, endDate: Date): Promise<VehicleWithImages[]>;
  updateVehicleAvailability(id: string, availability: boolean): Promise<Vehicle>;
}

export class VehicleService extends BaseService implements IVehicleService {
  private vehicleRepository: IVehicleRepository;

  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger);
    this.vehicleRepository = new VehicleRepository(prisma);
  }

  async createVehicle(data: CreateVehicleRequest): Promise<Vehicle> {
    try {
      // Check if license plate already exists
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { licensePlate: data.licensePlate },
      });

      if (existingVehicle) {
        throw new Error('Vehicle with this license plate already exists');
      }

      // Check VIN if provided
      if (data.vin) {
        const existingVin = await this.prisma.vehicle.findUnique({
          where: { vin: data.vin },
        });

        if (existingVin) {
          throw new Error('Vehicle with this VIN already exists');
        }
      }

      const vehicle = await this.vehicleRepository.create({
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color,
        licensePlate: data.licensePlate,
        vin: data.vin,
        mileage: data.mileage,
        fuelType: data.fuelType,
        transmission: data.transmission,
        seats: data.seats,
        doors: data.doors,
        category: data.category,
        pricePerDay: data.pricePerDay,
        location: data.location,
        description: data.description,
        features: data.features || [],
      });

      this.logger.info(`Vehicle created successfully: ${vehicle.id}`);
      return vehicle;
    } catch (error) {
      return this.handleServiceError(error, 'createVehicle');
    }
  }

  async getVehicleById(id: string): Promise<VehicleWithImages> {
    try {
      const vehicle = await this.vehicleRepository.findWithImages(id);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Calculate average rating
      const avgRating = vehicle.reviews.length > 0
        ? vehicle.reviews.reduce((sum, review) => sum + review.rating, 0) / vehicle.reviews.length
        : 0;

      return {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        licensePlate: vehicle.licensePlate,
        category: vehicle.category,
        pricePerDay: vehicle.pricePerDay,
        location: vehicle.location,
        images: vehicle.images.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          alt: img.alt,
          isPrimary: img.isPrimary,
        })),
        rating: Number(avgRating.toFixed(1)),
        reviewCount: vehicle.reviews.length,
      };
    } catch (error) {
      return this.handleServiceError(error, 'getVehicleById');
    }
  }

  async getVehicles(query: VehicleQuery): Promise<{ vehicles: VehicleWithImages[]; pagination: PaginationMeta }> {
    try {
      const { page = 1, limit = 10 } = query;
      
      const vehicles = await this.vehicleRepository.search(query);
      const total = await this.vehicleRepository.count({
        isActive: true,
        availability: true,
      });

      const vehiclesWithImages: VehicleWithImages[] = vehicles.map(vehicle => {
        const avgRating = vehicle.reviews.length > 0
          ? vehicle.reviews.reduce((sum, review) => sum + review.rating, 0) / vehicle.reviews.length
          : 0;

        return {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          licensePlate: vehicle.licensePlate,
          category: vehicle.category,
          pricePerDay: vehicle.pricePerDay,
          location: vehicle.location,
          images: vehicle.images.map(img => ({
            id: img.id,
            imageUrl: img.imageUrl,
            alt: img.alt,
            isPrimary: img.isPrimary,
          })),
          rating: Number(avgRating.toFixed(1)),
          reviewCount: vehicle.reviews.length,
        };
      });

      const totalPages = Math.ceil(total / limit);
      const pagination: PaginationMeta = {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      return { vehicles: vehiclesWithImages, pagination };
    } catch (error) {
      return this.handleServiceError(error, 'getVehicles');
    }
  }

  async searchVehicles(query: VehicleQuery): Promise<{ vehicles: VehicleWithImages[]; pagination: PaginationMeta }> {
    return this.getVehicles(query);
  }

  async getAvailableVehicles(startDate: Date, endDate: Date): Promise<VehicleWithImages[]> {
    try {
      const vehicles = await this.vehicleRepository.findAvailable(startDate, endDate);
      
      return vehicles.map(vehicle => ({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        licensePlate: vehicle.licensePlate,
        category: vehicle.category,
        pricePerDay: vehicle.pricePerDay,
        location: vehicle.location,
        images: vehicle.images.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          alt: img.alt,
          isPrimary: img.isPrimary,
        })),
        rating: 0, // Would need to calculate from reviews
        reviewCount: 0,
      }));
    } catch (error) {
      return this.handleServiceError(error, 'getAvailableVehicles');
    }
  }

  async updateVehicle(id: string, data: UpdateVehicleRequest): Promise<Vehicle> {
    try {
      const existingVehicle = await this.vehicleRepository.findById(id);
      if (!existingVehicle) {
        throw new Error('Vehicle not found');
      }

      // Check license plate uniqueness if being updated
      if (data.licensePlate && data.licensePlate !== existingVehicle.licensePlate) {
        const existingPlate = await this.prisma.vehicle.findUnique({
          where: { licensePlate: data.licensePlate },
        });

        if (existingPlate) {
          throw new Error('Vehicle with this license plate already exists');
        }
      }

      // Check VIN uniqueness if being updated
      if (data.vin && data.vin !== existingVehicle.vin) {
        const existingVin = await this.prisma.vehicle.findUnique({
          where: { vin: data.vin },
        });

        if (existingVin) {
          throw new Error('Vehicle with this VIN already exists');
        }
      }

      const updatedVehicle = await this.vehicleRepository.update(id, data);
      
      this.logger.info(`Vehicle updated successfully: ${id}`);
      return updatedVehicle;
    } catch (error) {
      return this.handleServiceError(error, 'updateVehicle');
    }
  }

  async updateVehicleAvailability(id: string, availability: boolean): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleRepository.findById(id);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      const updatedVehicle = await this.vehicleRepository.updateAvailability(id, availability);
      
      this.logger.info(`Vehicle availability updated: ${id} - ${availability}`);
      return updatedVehicle;
    } catch (error) {
      return this.handleServiceError(error, 'updateVehicleAvailability');
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    try {
      const vehicle = await this.vehicleRepository.findById(id);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Check if vehicle has active reservations
      const activeReservations = await this.prisma.reservation.findFirst({
        where: {
          vehicleId: id,
          status: {
            in: ['CONFIRMED', 'IN_PROGRESS'],
          },
        },
      });

      if (activeReservations) {
        throw new Error('Cannot delete vehicle with active reservations');
      }

      await this.vehicleRepository.delete(id);
      
      this.logger.info(`Vehicle deleted successfully: ${id}`);
    } catch (error) {
      return this.handleServiceError(error, 'deleteVehicle');
    }
  }
}
```

## Controllers/Handlers

Controllers handle HTTP requests and responses. They validate input, call appropriate services, and format responses.

### Base Controller

Create `src/controllers/BaseController.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { ApiResponse, PaginationMeta } from '@/types';

export abstract class BaseController {
  protected logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  protected sendSuccess<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    pagination?: PaginationMeta
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      ...(pagination && { pagination }),
    };

    res.status(statusCode).json(response);
  }

  protected sendError(
    res: Response,
    message: string,
    statusCode = 400,
    errors?: string[]
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      ...(errors && { errors }),
    };

    res.status(statusCode).json(response);
  }

  protected handleError(error: any, res: Response, operation: string): void {
    this.logger.error(`Controller error in ${operation}:`, error);

    let statusCode = 500;
    let message = 'Internal server error';

    if (error.message === 'Resource not found' || error.message.includes('not found')) {
      statusCode = 404;
      message = error.message;
    } else if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
      statusCode = 409;
      message = error.message;
    } else if (error.message.includes('Invalid') || error.message.includes('validation')) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('Unauthorized') || error.message.includes('credentials')) {
      statusCode = 401;
      message = error.message;
    } else if (error.message.includes('Forbidden') || error.message.includes('permission')) {
      statusCode = 403;
      message = error.message;
    }

    this.sendError(res, message, statusCode);
  }

  protected asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### Auth Controller

Create `src/controllers/AuthController.ts`:

```typescript
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { BaseController } from './BaseController';
import { AuthService, IAuthService } from '@/services/AuthService';
import { LoginRequest, RegisterRequest, RefreshTokenRequest } from '@/types/auth';
import { PrismaClient } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export class AuthController extends BaseController {
  private authService: IAuthService;

  constructor(prisma: PrismaClient, logger: Logger) {
    super(logger);
    this.authService = new AuthService(prisma, logger);
  }

  register = this.asyncHandler(async (req: Request, res: Response) => {
    const registerData: RegisterRequest = req.body;

    const result = await this.authService.register(registerData);

    this.sendSuccess(
      res,
      result,
      'User registered successfully',
      201
    );
  });

  login = this.asyncHandler(async (req: Request, res: Response) => {
    const loginData: LoginRequest = req.body;

    const result = await this.authService.login(loginData);

    this.sendSuccess(
      res,
      result,
      'Login successful'
    );
  });

  refreshToken = this.asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken }: RefreshTokenRequest = req.body;

    if (!refreshToken) {
      return this.sendError(res, 'Refresh token is required', 400);
    }

    const result = await this.authService.refreshToken(refreshToken);

    this.sendSuccess(
      res,
      result,
      'Token refreshed successfully'
    );
  });

  logout = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return this.sendError(res, 'User not authenticated', 401);
    }

    if (!refreshToken) {
      return this.sendError(res, 'Refresh token is required', 400);
    }

    await this.authService.logout(userId, refreshToken);

    this.sendSuccess(
      res,
      null,
      'Logout successful'
    );
  });

  getProfile = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return this.sendError(res, 'User not authenticated', 401);
    }

    const userProfile = await this.authService.getUserProfile(userId);

    this.sendSuccess(
      res,
      userProfile,
      'Profile retrieved successfully'
    );
  });
}
```

### Vehicle Controller

Create `src/controllers/VehicleController.ts`:

```typescript
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { BaseController } from './BaseController';
import { VehicleService, IVehicleService } from '@/services/VehicleService';
import { VehicleQuery, CreateVehicleRequest, UpdateVehicleRequest } from '@/types/vehicle';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './AuthController';

export class VehicleController extends BaseController {
  private vehicleService: IVehicleService;

  constructor(prisma: PrismaClient, logger: Logger) {
    super(logger);
    this.vehicleService = new VehicleService(prisma, logger);
  }

  createVehicle = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vehicleData: CreateVehicleRequest = req.body;

    const vehicle = await this.vehicleService.createVehicle(vehicleData);

    this.sendSuccess(
      res,
      vehicle,
      'Vehicle created successfully',
      201
    );
  });

  getVehicles = this.asyncHandler(async (req: Request, res: Response) => {
    const query: VehicleQuery = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      category: req.query.category as any,
      fuelType: req.query.fuelType as any,
      transmission: req.query.transmission as any,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      location: req.query.location as string,
      seats: req.query.seats ? parseInt(req.query.seats as string) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await this.vehicleService.getVehicles(query);

    this.sendSuccess(
      res,
      result.vehicles,
      'Vehicles retrieved successfully',
      200,
      result.pagination
    );
  });

  getVehicleById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const vehicle = await this.vehicleService.getVehicleById(id);

    this.sendSuccess(
      res,
      vehicle,
      'Vehicle retrieved successfully'
    );
  });

  updateVehicle = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateVehicleRequest = req.body;

    const vehicle = await this.vehicleService.updateVehicle(id, updateData);

    this.sendSuccess(
      res,
      vehicle,
      'Vehicle updated successfully'
    );
  });

  deleteVehicle = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await this.vehicleService.deleteVehicle(id);

    this.sendSuccess(
      res,
      null,
      'Vehicle deleted successfully'
    );
  });

  searchVehicles = this.asyncHandler(async (req: Request, res: Response) => {
    const query: VehicleQuery = {
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    } as VehicleQuery;

    const result = await this.vehicleService.searchVehicles(query);

    this.sendSuccess(
      res,
      result.vehicles,
      'Search results retrieved successfully',
      200,
      result.pagination
    );
  });

  getAvailableVehicles = this.asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return this.sendError(res, 'Start date and end date are required', 400);
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (start >= end) {
      return this.sendError(res, 'Start date must be before end date', 400);
    }

    const vehicles = await this.vehicleService.getAvailableVehicles(start, end);

    this.sendSuccess(
      res,
      vehicles,
      'Available vehicles retrieved successfully'
    );
  });

  updateVehicleAvailability = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { availability } = req.body;

    if (typeof availability !== 'boolean') {
      return this.sendError(res, 'Availability must be a boolean value', 400);
    }

    const vehicle = await this.vehicleService.updateVehicleAvailability(id, availability);

    this.sendSuccess(
      res,
      vehicle,
      'Vehicle availability updated successfully'
    );
  });
}
```

## Routes

Routes define our API endpoints and connect URLs to controller methods. We'll organize routes by feature/domain.

### Base Route Setup

Create `src/routes/index.ts`:

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import authRoutes from './authRoutes';
import vehicleRoutes from './vehicleRoutes';
import userRoutes from './userRoutes';

export default function createRoutes(prisma: PrismaClient, logger: Logger): Router {
  const router = Router();

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Feature routes
  router.use('/auth', authRoutes(prisma, logger));
  router.use('/vehicles', vehicleRoutes(prisma, logger));
  router.use('/users', userRoutes(prisma, logger));

  return router;
}
```

### Auth Routes

Create `src/routes/authRoutes.ts`:

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { AuthController } from '@/controllers/AuthController';
import { validateRequest } from '@/middleware/validation';
import { authenticateToken } from '@/middleware/auth';
import { loginSchema, registerSchema, refreshTokenSchema } from '@/validators/authValidators';

export default function authRoutes(prisma: PrismaClient, logger: Logger): Router {
  const router = Router();
  const authController = new AuthController(prisma, logger);

  /**
   * @route   POST /api/v1/auth/register
   * @desc    Register a new user
   * @access  Public
   */
  router.post(
    '/register',
    validateRequest(registerSchema),
    authController.register
  );

  /**
   * @route   POST /api/v1/auth/login
   * @desc    Login user
   * @access  Public
   */
  router.post(
    '/login',
    validateRequest(loginSchema),
    authController.login
  );

  /**
   * @route   POST /api/v1/auth/refresh
   * @desc    Refresh access token
   * @access  Public
   */
  router.post(
    '/refresh',
    validateRequest(refreshTokenSchema),
    authController.refreshToken
  );

  /**
   * @route   POST /api/v1/auth/logout
   * @desc    Logout user
   * @access  Private
   */
  router.post(
    '/logout',
    authenticateToken,
    authController.logout
  );

  /**
   * @route   GET /api/v1/auth/profile
   * @desc    Get user profile
   * @access  Private
   */
  router.get(
    '/profile',
    authenticateToken,
    authController.getProfile
  );

  return router;
}
```

### Vehicle Routes

Create `src/routes/vehicleRoutes.ts`:

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { VehicleController } from '@/controllers/VehicleController';
import { validateRequest } from '@/middleware/validation';
import { authenticateToken, requireRole } from '@/middleware/auth';
import { createVehicleSchema, updateVehicleSchema, vehicleQuerySchema } from '@/validators/vehicleValidators';
import { UserRole } from '@prisma/client';

export default function vehicleRoutes(prisma: PrismaClient, logger: Logger): Router {
  const router = Router();
  const vehicleController = new VehicleController(prisma, logger);

  /**
   * @route   GET /api/v1/vehicles
   * @desc    Get all vehicles with filters
   * @access  Public
   */
  router.get(
    '/',
    validateRequest(vehicleQuerySchema, 'query'),
    vehicleController.getVehicles
  );

  /**
   * @route   GET /api/v1/vehicles/search
   * @desc    Search vehicles
   * @access  Public
   */
  router.get(
    '/search',
    validateRequest(vehicleQuerySchema, 'query'),
    vehicleController.searchVehicles
  );

  /**
   * @route   GET /api/v1/vehicles/available
   * @desc    Get available vehicles for date range
   * @access  Public
   */
  router.get(
    '/available',
    vehicleController.getAvailableVehicles
  );

  /**
   * @route   GET /api/v1/vehicles/:id
   * @desc    Get vehicle by ID
   * @access  Public
   */
  router.get(
    '/:id',
    vehicleController.getVehicleById
  );

  /**
   * @route   POST /api/v1/vehicles
   * @desc    Create new vehicle
   * @access  Private (Admin/Manager only)
   */
  router.post(
    '/',
    authenticateToken,
    requireRole([UserRole.ADMIN, UserRole.MANAGER]),
    validateRequest(createVehicleSchema),
    vehicleController.createVehicle
  );

  /**
   * @route   PUT /api/v1/vehicles/:id
   * @desc    Update vehicle
   * @access  Private (Admin/Manager only)
   */
  router.put(
    '/:id',
    authenticateToken,
    requireRole([UserRole.ADMIN, UserRole.MANAGER]),
    validateRequest(updateVehicleSchema),
    vehicleController.updateVehicle
  );

  /**
   * @route   PATCH /api/v1/vehicles/:id/availability
   * @desc    Update vehicle availability
   * @access  Private (Admin/Manager only)
   */
  router.patch(
    '/:id/availability',
    authenticateToken,
    requireRole([UserRole.ADMIN, UserRole.MANAGER]),
    vehicleController.updateVehicleAvailability
  );

  /**
   * @route   DELETE /api/v1/vehicles/:id
   * @desc    Delete vehicle
   * @access  Private (Admin only)
   */
  router.delete(
    '/:id',
    authenticateToken,
    requireRole([UserRole.ADMIN]),
    vehicleController.deleteVehicle
  );

  return router;
}
```

## Middleware

Middleware functions are executed during the request-response cycle. They can modify request/response objects, end the cycle, or call the next middleware.

### Authentication Middleware

Create `src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '@/utils/jwt';
import { AuthenticatedRequest } from '@/controllers/AuthController';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    const decoded = await verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = await verifyAccessToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};
```

### Validation Middleware

Create `src/middleware/validation.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateRequest = (
  schema: ZodSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req[property]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};
```

### Error Handling Middleware

Create `src/middleware/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { ApiResponse } from '@/types';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (logger: Logger) => {
  return (error: AppError, req: Request, res: Response, next: NextFunction): void => {
    logger.error('Error caught by error handler:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';

    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
    }

    const response: ApiResponse = {
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };

    res.status(statusCode).json(response);
  };
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
  };

  res.status(404).json(response);
};
```

### Rate Limiting Middleware

Create `src/middleware/rateLimiter.ts`:

```typescript
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later',
      });
    },
  });
};

// Common rate limiters
export const generalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 auth requests per 15 minutes
export const strictLimiter = createRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes
```

## Utilities

### JWT Utilities

Create `src/utils/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { JwtPayload } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export const generateTokens = async (user: User): Promise<{ accessToken: string; refreshToken: string }> => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = async (token: string): Promise<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = async (token: string): Promise<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export const generateAccessToken = async (user: User): Promise<string> => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};
```

### Password Utilities

Create `src/utils/password.ts`:

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Error comparing password');
  }
};

export const generateRandomPassword = (length = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

### Logger Utility

Create `src/utils/logger.ts`:

```typescript
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

export const createLogger = (): winston.Logger => {
  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
  ];

  // File transports for production
  if (process.env.NODE_ENV === 'production') {
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
  });
};

export const logger = createLogger();
```

### File Upload with MinIO

Create `src/utils/fileUpload.ts`:

```typescript
import { Client } from 'minio';
import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// MinIO client configuration
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const bucketName = process.env.MINIO_BUCKET_NAME || 'uploads';

// Initialize bucket
export const initializeBucket = async (): Promise<void> => {
  try {
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket ${bucketName} created successfully`);
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
    throw error;
  }
};

// Multer configuration for memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export interface UploadResult {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

export const uploadToMinio = async (
  file: Express.Multer.File,
  folder = 'general'
): Promise<UploadResult> => {
  try {
    const fileExtension = path.extname(file.originalname);
    const filename = `${folder}/${uuidv4()}${fileExtension}`;
    
    // Upload file to MinIO
    await minioClient.putObject(
      bucketName,
      filename,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
        'X-Original-Name': file.originalname,
      }
    );

    // Generate URL
    const url = await minioClient.presignedGetObject(bucketName, filename, 7 * 24 * 60 * 60); // 7 days

    return {
      filename,
      url,
      size: file.size,
      mimetype: file.mimetype,
    };
  } catch (error) {
    throw new Error(`Failed to upload file: ${error}`);
  }
};

export const uploadMultipleToMinio = async (
  files: Express.Multer.File[],
  folder = 'general'
): Promise<UploadResult[]> => {
  const uploadPromises = files.map(file => uploadToMinio(file, folder));
  return Promise.all(uploadPromises);
};

export const deleteFromMinio = async (filename: string): Promise<void> => {
  try {
    await minioClient.removeObject(bucketName, filename);
  } catch (error) {
    throw new Error(`Failed to delete file: ${error}`);
  }
};

export const getFileUrl = async (filename: string, expiryInSeconds = 7 * 24 * 60 * 60): Promise<string> => {
  try {
    return await minioClient.presignedGetObject(bucketName, filename, expiryInSeconds);
  } catch (error) {
    throw new Error(`Failed to get file URL: ${error}`);
  }
};

// Helper function to extract filename from URL
export const extractFilenameFromUrl = (url: string): string => {
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1].split('?')[0];
};
```

### Validation Schemas

Create `src/validators/authValidators.ts`:

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  password: z.string()
    .min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});

export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});
```

Create `src/validators/vehicleValidators.ts`:

```typescript
import { z } from 'zod';
import { VehicleCategory, FuelType, Transmission } from '@prisma/client';

export const createVehicleSchema = z.object({
  make: z.string()
    .min(1, 'Make is required')
    .max(50, 'Make must not exceed 50 characters'),
  model: z.string()
    .min(1, 'Model is required')
    .max(50, 'Model must not exceed 50 characters'),
  year: z.number()
    .int('Year must be an integer')
    .min(1900, 'Year must be at least 1900')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  color: z.string()
    .min(1, 'Color is required')
    .max(30, 'Color must not exceed 30 characters'),
  licensePlate: z.string()
    .min(1, 'License plate is required')
    .max(20, 'License plate must not exceed 20 characters'),
  vin: z.string()
    .length(17, 'VIN must be exactly 17 characters')
    .optional(),
  mileage: z.number()
    .int('Mileage must be an integer')
    .min(0, 'Mileage cannot be negative')
    .optional(),
  fuelType: z.nativeEnum(FuelType, {
    errorMap: () => ({ message: 'Invalid fuel type' }),
  }),
  transmission: z.nativeEnum(Transmission, {
    errorMap: () => ({ message: 'Invalid transmission type' }),
  }),
  seats: z.number()
    .int('Seats must be an integer')
    .min(1, 'Must have at least 1 seat')
    .max(50, 'Cannot have more than 50 seats'),
  doors: z.number()
    .int('Doors must be an integer')
    .min(2, 'Must have at least 2 doors')
    .max(6, 'Cannot have more than 6 doors'),
  category: z.nativeEnum(VehicleCategory, {
    errorMap: () => ({ message: 'Invalid vehicle category' }),
  }),
  pricePerDay: z.number()
    .positive('Price per day must be positive')
    .max(10000, 'Price per day cannot exceed $10,000'),
  location: z.string()
    .min(1, 'Location is required')
    .max(100, 'Location must not exceed 100 characters'),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  features: z.array(z.string())
    .max(20, 'Cannot have more than 20 features')
    .optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  availability: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const vehicleQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .refine(val => val > 0, 'Page must be greater than 0')
    .optional(),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional(),
  category: z.nativeEnum(VehicleCategory).optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  minPrice: z.string()
    .regex(/^\d+(\.\d{2})?$/, 'Invalid price format')
    .transform(Number)
    .optional(),
  maxPrice: z.string()
    .regex(/^\d+(\.\d{2})?$/, 'Invalid price format')
    .transform(Number)
    .optional(),
  location: z.string().max(100).optional(),
  seats: z.string()
    .regex(/^\d+$/, 'Seats must be a number')
    .transform(Number)
    .optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'pricePerDay', 'make', 'model', 'year']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
}).refine(
  data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);
```

## Configuration

### Database Configuration

Create `src/config/database.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' },
      ],
    });
  }
  prisma = global.__prisma;
}

// Log database events
prisma.$on('error', (e) => {
  logger.error('Database error:', e);
});

prisma.$on('warn', (e) => {
  logger.warn('Database warning:', e);
});

if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    logger.debug('Database query:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });

  prisma.$on('info', (e) => {
    logger.info('Database info:', e);
  });
}

export { prisma };

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Failed to disconnect from database:', error);
  }
};
```

### MinIO Configuration

Create `src/config/minio.ts`:

```typescript
import { Client } from 'minio';
import { logger } from '@/utils/logger';

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const initializeMinIO = async (): Promise<void> => {
  try {
    const bucketName = process.env.MINIO_BUCKET_NAME || 'uploads';
    
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    
    if (!bucketExists) {
      // Create bucket
      await minioClient.makeBucket(bucketName, 'us-east-1');
      logger.info(`MinIO bucket '${bucketName}' created successfully`);
      
      // Set bucket policy for public read access (optional)
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      logger.info(`MinIO bucket policy set for '${bucketName}'`);
    }
    
    logger.info('MinIO initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize MinIO:', error);
    throw error;
  }
};
```

### Main Configuration

Create `src/config/index.ts`:

```typescript
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // MinIO configuration
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'uploads',
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Email configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'app.log',
  },
};

// Validate required environment variables
export const validateConfig = (): void => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
```

## Express Application Setup

### Main App File

Create `src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import createRoutes from '@/routes';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { generalLimiter } from '@/middleware/rateLimiter';
import { config } from '@/config';

export const createApp = (prisma: PrismaClient, logger: Logger): express.Application => {
  const app = express();

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));

  // Rate limiting
  app.use(generalLimiter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.nodeEnv,
      version: config.server.apiVersion,
    });
  });

  // API routes
  app.use(`/api/${config.server.apiVersion}`, createRoutes(prisma, logger));

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler(logger));

  return app;
};
```

### Server Entry Point

Create `src/server.ts`:

```typescript
import { createApp } from './app';
import { prisma, connectDatabase, disconnectDatabase } from '@/config/database';
import { initializeMinIO } from '@/config/minio';
import { logger } from '@/utils/logger';
import { config, validateConfig } from '@/config';

const startServer = async (): Promise<void> => {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated');

    // Connect to database
    await connectDatabase();

    // Initialize MinIO
    await initializeMinIO();

    // Create Express app
    const app = createApp(prisma, logger);

    // Start server
    const server = app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port} in ${config.server.nodeEnv} mode`);
      logger.info(`API available at: http://localhost:${config.server.port}/api/${config.server.apiVersion}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await disconnectDatabase();
          logger.info('Database disconnected');
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
```

## Testing

### Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
```

### Test Setup

Create `tests/setup.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Set test database URL
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  
  // Run migrations
  execSync('npx prisma migrate reset --force', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tableNames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`DELETE FROM "${tablename}"`);
    }
  }
});
```

### Unit Tests Example

Create `tests/unit/services/AuthService.test.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { AuthService } from '@/services/AuthService';
import { logger } from '@/utils/logger';
import { hashPassword } from '@/utils/password';

const prisma = new PrismaClient();
const authService = new AuthService(prisma, logger);

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'TestPassword123!',
        phone: '+1234567890',
      };

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        username: 'user1',
        password: 'TestPassword123!',
      };

      await authService.register(userData);

      const duplicateData = {
        email: 'duplicate@example.com',
        username: 'user2',
        password: 'TestPassword123!',
      };

      await expect(authService.register(duplicateData))
        .rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await hashPassword('TestPassword123!');
      await prisma.user.create({
        data: {
          email: 'login@example.com',
          username: 'loginuser',
          password: hashedPassword,
        },
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'TestPassword123!',
      };

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginData.email);
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword123!',
      };

      await expect(authService.login(loginData))
        .rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Integration Tests Example

Create `tests/integration/auth.test.ts`:

```typescript
import request from 'supertest';
import { createApp } from '@/app';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const app = createApp(prisma, logger);

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'integration@example.com',
        username: 'integrationuser',
        firstName: 'Integration',
        lastName: 'Test',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register a user first
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logintest@example.com',
          username: 'logintest',
          password: 'TestPassword123!',
        });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });
  });
});
```

## Deployment

### Docker Configuration

Create `Dockerfile`:

```dockerfile
# Use Node.js LTS version
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Backend API
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/k2a_db
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
    depends_on:
      - postgres
      - redis
      - minio
    restart: unless-stopped
    networks:
      - k2a-network

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=k2a_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - k2a-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - k2a-network

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped
    networks:
      - k2a-network

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  k2a-network:
    driver: bridge
```

### Production Environment Setup

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - api
    restart: unless-stopped
```

### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api_backend {
        least_conn;
        server api:5000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    server {
        listen 80;
        server_name your-domain.com;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        # Proxy to API
        location /api/ {
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            proxy_pass http://api_backend/health;
        }
    }
}
```

## Best Practices

### Code Organization
1. **Separation of Concerns**: Keep each layer focused on its specific responsibility
2. **Single Responsibility**: Each function/class should have one clear purpose
3. **Dependency Injection**: Use dependency injection for better testability
4. **Interface Segregation**: Keep interfaces small and focused

### Security Best Practices
1. **Input Validation**: Always validate and sanitize user input
2. **Authentication**: Use JWT tokens with proper expiration
3. **Authorization**: Implement role-based access control
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **SQL Injection Prevention**: Use parameterized queries (Prisma handles this)

### Performance Optimization
1. **Database Indexing**: Add indexes for frequently queried fields
2. **Connection Pooling**: Use database connection pooling
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Pagination**: Always paginate large datasets
5. **Compression**: Use gzip compression
6. **CDN**: Use CDN for static assets

### Error Handling
1. **Centralized Error Handling**: Use middleware for error handling
2. **Logging**: Log all errors with context
3. **Graceful Degradation**: Handle failures gracefully
4. **Monitoring**: Implement health checks and monitoring

### Testing Strategy
1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test API endpoints and database interactions
3. **E2E Tests**: Test complete user workflows
4. **Test Coverage**: Aim for 80%+ test coverage
5. **Mock External Services**: Use mocks for external dependencies

### Deployment Best Practices
1. **Environment Variables**: Use environment variables for configuration
2. **Docker**: Containerize your application
3. **CI/CD**: Implement automated testing and deployment
4. **Load Balancing**: Use load balancers for high availability
5. **Monitoring**: Implement application monitoring and alerting
6. **Backup**: Regular database backups
7. **Zero-Downtime Deployment**: Use blue-green or rolling deployments

### Code Quality
1. **Linting**: Use ESLint for code quality
2. **Formatting**: Use Prettier for consistent formatting
3. **Type Safety**: Use TypeScript for better developer experience
4. **Code Reviews**: Implement mandatory code reviews
5. **Documentation**: Document your APIs and complex logic

This comprehensive tutorial covers all aspects of building a modern Node.js backend with Express, from basic setup to production deployment. Each section provides practical examples and follows industry best practices for building scalable, maintainable applications.
