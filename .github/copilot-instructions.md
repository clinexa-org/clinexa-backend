# Clinexa Backend - AI Coding Agent Instructions

## Architecture Overview

**Clinexa Backend** is an Express.js REST API using ES6 modules (`"type": "module"` in `package.json`) with MongoDB/Mongoose for data persistence. This is a healthcare platform backend with role-based access control.

### Core Components
- **Entry Point**: `src/server.js` → imports `app.js` and initiates MongoDB connection via `config/db.js`
- **Express App**: `src/app.js` → configures middleware (cors, express.json) and registers routes
- **Database**: MongoDB connection managed in `src/config/db.js` using `MONGO_URI` from `.env`
- **Authentication**: JWT-based auth with 7-day token expiration (see `controllers/auth.controller.js`)

### User Roles & Access Control
Three user roles defined in `models/User.js`: `admin`, `doctor`, `patient` (default)
- JWT tokens include both user `id` and `role` in payload
- `middleware/auth.js`: Validates JWT Bearer tokens, attaches `req.user` with `{id, role}`
- `middleware/role.js`: Higher-order function for role-based route protection (usage: `role('admin', 'doctor')`)

## Project-Specific Conventions

### ES6 Module Imports
**Always use `.js` extensions** in import statements (required for ES modules):
```javascript
import User from "../models/User.js";  // ✓ Correct
import User from "../models/User";    // ✗ Will fail
```

### Authentication Pattern
Protected routes follow this structure:
```javascript
router.get("/protected", auth, role("admin"), controllerFunction);
```
- `auth` middleware validates token and populates `req.user`
- `role()` middleware checks authorization (optional, chain after `auth`)

### Password Handling
- Passwords hashed with bcryptjs (10 salt rounds)
- Stored as `passwordHash` field in User model
- Compare using `bcrypt.compare(plaintext, user.passwordHash)`

### Response Format
Controllers return JSON directly with appropriate status codes:
```javascript
res.status(201).json({ user, token });        // Success with data
res.status(400).json({ message: "Error" });   // Client error
res.status(500).json({ message: err.message }); // Server error
```

## Development Workflow

### Running the Server
```bash
npm run dev  # Starts nodemon on src/server.js
```

### Environment Setup
Required `.env` variables:
- `MONGO_URI`: MongoDB connection string (default expects `mongodb://127.0.0.1:27017/clinexa`)
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (defaults to 5000)

### MongoDB Connection Issue (Common)
If you see `ECONNREFUSED ::1:27017` or `127.0.0.1:27017`:
1. Ensure MongoDB is running locally OR
2. Update `MONGO_URI` in `.env` to use MongoDB Atlas or alternative host

## Key Integration Points

### Adding New Routes
1. Create controller in `src/controllers/` with async functions
2. Create route file in `src/routes/` following pattern: `<resource>.routes.js`
3. Register route in `src/app.js`: `app.use("/api/<resource>", <resource>Routes)`

### Adding Protected Routes
Import both auth middlewares in route file:
```javascript
import { auth } from "../middleware/auth.js";
import { role } from "../middleware/role.js";

router.post("/admin-only", auth, role("admin"), controller);
```

### Database Models
- Use Mongoose schemas in `src/models/`
- Enable timestamps: `{ timestamps: true }` for automatic `createdAt`/`updatedAt`
- Export as default: `export default mongoose.model("ModelName", schema)`

## Files to Reference

- **Route patterns**: `src/routes/auth.routes.js`
- **Controller structure**: `src/controllers/auth.controller.js`
- **Middleware examples**: `src/middleware/auth.js`, `src/middleware/role.js`
- **Model schema**: `src/models/User.js`
- **App configuration**: `src/app.js`
