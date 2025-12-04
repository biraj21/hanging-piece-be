# Hanging Piece backend

## Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Server Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Better Auth
- **Validation**: Zod

## Setup

This project uses [pnpm](https://pnpm.io/) as the package manager.

1. Install pnpm if you haven't already:

   ```bash
   npm install -g pnpm
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Initialize db for auth:
   ```bash
   pnpm run auth-db-generate
   ```

## Scripts

Available pnpm scripts for development and deployment:

- `pnpm run build` - Compiles TypeScript source files to JavaScript in the `dist` directory
- `pnpm run start` - Runs the compiled application from `dist/index.js`
- `pnpm run build-n-start` - Builds the project and then starts the application
- `pnpm run dev` - Runs the application in development mode with file watching using `tsx`

## Path Aliases

This project uses the `#src` alias for clean import paths throughout the codebase.

### Configuration

**Development (TypeScript compilation):**

- `tsconfig.json` maps `"#src/*": ["./src/*.js"]` in `compilerOptions.paths`
- Enables TypeScript to resolve imports like `import { env } from "#src/config/env"`

**Runtime (Node.js):**

- `package.json` maps `"#src/*": "./dist/*.js"` in the `imports` field
- Allows the compiled JavaScript to resolve paths to the built `dist` directory

### Usage Example

```typescript
// Instead of: import { env } from "../../config/env"
// Use: import { env } from "#src/config/env"
import { env } from "#src/config/env";
```

This setup provides clean, consistent imports while supporting both development and production environments.
