/**
* this file is used to initialize the database with the necessary tables for the project.
*/

/**
* ----- better-auth schema generation start -----
* i got these by running the following command:
* pnpm run auth-db-generate
* 
* it runs better-auth cli and generate the SQL tables required for auth, but it's so stupid
* that it didn't add "if not exists" to the create table statements so i added it manually here.
*/

create table if not exists "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" integer not null, "image" text, "chesscomId" text, "lichessId" text, "createdAt" date not null, "updatedAt" date not null);

create table if not exists "session" ("id" text not null primary key, "expiresAt" date not null, "token" text not null unique, "createdAt" date not null, "updatedAt" date not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);

create table if not exists "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" date, "refreshTokenExpiresAt" date, "scope" text, "password" text, "createdAt" date not null, "updatedAt" date not null);

create table if not exists "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" date not null, "createdAt" date not null, "updatedAt" date not null);

create index if not exists "session_userId_idx" on "session" ("userId");

create index if not exists "account_userId_idx" on "account" ("userId");

create index if not exists "verification_identifier_idx" on "verification" ("identifier");

/**
* ----- better-auth schema generation end -----
*/