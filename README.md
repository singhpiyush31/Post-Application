# Scrrible

A blogging REST API built with **Node.js**, **Express 5**, and **MongoDB (Mongoose)**.

Users can register and log in, write posts as drafts and publish them, and comment on any published post. Authentication is JWT-based and the token is carried in an HTTP cookie, so authenticated requests just need the cookie sent along.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Data Models](#data-models)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Posts](#posts)
  - [Comments](#comments)
- [Query Parameters](#query-parameters)
- [Error Responses](#error-responses)
- [Notes & Known Limitations](#notes--known-limitations)

---

## Features

- **User accounts** — registration with email validation and `bcrypt` password hashing, login, logout.
- **JWT auth via cookies** — a 7-day token issued on login, verified by a route middleware that attaches the user to `req.user`.
- **Posts** — create, read, update, delete. Only the author can update or delete their own posts.
- **Draft / Published workflow** — posts default to `Draft` and are invisible to the public feed until set to `Published`.
- **Comments** — add, list, edit, and delete comments on published posts. Only the comment's author can edit or delete it.
- **Cascade delete** — deleting a post also deletes every comment attached to it.
- **Pagination, filtering, search and sorting** on both the post feeds and the comment list.

---

## Tech Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js (CommonJS) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | `jsonwebtoken` + `cookie-parser` |
| Password hashing | `bcrypt` (10 salt rounds) |
| Config | `dotenv` |

---

## Project Structure

```
Scrrible/
├── app.js                       # Entry point: middleware, route mounting, DB connect, listen
├── config/
│   └── database.js              # Mongoose connection helper
├── middlewares/
│   └── authentication.js        # userAuth — verifies the JWT cookie, loads req.user
├── models/
│   ├── user.js                  # User schema
│   ├── post.js                  # Post schema
│   └── comment.js               # Comment schema
├── controllers/
│   ├── auth.js                  # register, login, logout
│   ├── post.js                  # post CRUD + create/list comments for a post
│   └── comment.js               # update, delete a comment
└── routes/
    ├── auth.js                  # mounted at /auth
    ├── post.js                  # mounted at /post
    └── comment.js               # mounted at /comment
```

The server boots only after the database connection succeeds — if Mongo is unreachable, the process logs the error and exits with code `1`.

---

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A MongoDB instance (local `mongod` or a MongoDB Atlas cluster)

### Installation

```bash
git clone https://github.com/singhpiyush31/Post-Application.git
cd Post-Application
npm install
```

### Configuration

Create a `.env` file in the project root (see [Environment Variables](#environment-variables)):

```bash
PORT=7777
MONGO_URL=mongodb://127.0.0.1:27017/scrrible
JWT_SECRET=replace-with-a-long-random-string
```

### Running

There is no `start` script defined yet, so run the entry point directly:

```bash
node app.js
```

For auto-reload during development:

```bash
npx nodemon app.js
```

You should see:

```
Database connected successfully!
Server is listening at port 7777
```

> **Tip:** add these to `package.json` to shorten the commands —
> `"start": "node app.js"` and `"dev": "nodemon app.js"`.

---

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Port the HTTP server listens on. Defaults to `7777`. |
| `MONGO_URL` | **Yes** | MongoDB connection string. |
| `JWT_SECRET` | **Yes** | Secret used to sign and verify JWTs. Use a long random value. |

`.env` is git-ignored — never commit real credentials.

---

## Data Models

### User

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | required, 2–40 characters |
| `email` | String | required, unique, lowercased, trimmed |
| `password` | String | required, stored as a bcrypt hash |

Timestamps (`createdAt`, `updatedAt`) are enabled. The password is never returned by the auth middleware (`.select("-password")`).

### Post

| Field | Type | Rules |
| --- | --- | --- |
| `title` | String | required, 3–100 characters, trimmed |
| `content` | String | required, minimum 20 characters, trimmed |
| `category` | String | required, one of `Technology`, `Travel`, `Food`, `Lifestyle`, `Education`, `Health`, `Sports`, `Other` |
| `tags` | [String] | optional, maximum 5 tags |
| `author` | ObjectId → User | required, set from the logged-in user |
| `status` | String | `Draft` (default) or `Published` |

### Comment

| Field | Type | Rules |
| --- | --- | --- |
| `comment` | String | required, 2–250 characters |
| `user` | ObjectId → User | required, set from the logged-in user |
| `post` | ObjectId → Post | required |

---

## Authentication

1. `POST /auth/login` verifies the credentials and signs a JWT containing the user id, valid for **7 days**.
2. The token is returned as a `token` cookie with a matching 7-day `maxAge`.
3. Protected routes run the `userAuth` middleware, which reads the cookie, verifies the signature, loads the user, and attaches it to `req.user`.
4. `POST /auth/logout` clears the cookie by overwriting it with an empty value and `maxAge: 0`.

Any protected request without a valid cookie gets `401`.

With **curl**, persist cookies across calls:

```bash
# login and save the cookie
curl -c cookies.txt -X POST http://localhost:7777/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"secret123"}'

# reuse it on a protected route
curl -b cookies.txt http://localhost:7777/post/my
```

In **Postman** or **Thunder Client** the cookie is stored and resent automatically after login.

---

## API Reference

Base URL: `http://localhost:7777`

**Public** — no authentication needed. **Protected** — requires the `token` cookie set at login.

### Auth

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Create a new account |
| `POST` | `/auth/login` | Public | Log in and receive the token cookie |
| `POST` | `/auth/logout` | Public | Clear the token cookie |

#### POST /auth/register

**Body**

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "secret123"
}
```

**201 Created**

```json
{ "message": "User Added Successfully! " }
```

**Errors** — `400` missing fields, invalid email format, or email already registered.

#### POST /auth/login

**Body**

```json
{ "email": "ada@example.com", "password": "secret123" }
```

**200 OK** — sets the `token` cookie.

```json
{ "message": "LoggedIn Successfully!" }
```

**Errors** — `400` missing fields, invalid email format, or wrong credentials (`"Invalid Credentials"` is returned for both an unknown email and a bad password).

#### POST /auth/logout

**200 OK**

```json
{ "message": "Logout Successfully!" }
```

---

### Posts

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/post` | Protected | Create a post |
| `GET` | `/post` | Public | List **published** posts (paginated) |
| `GET` | `/post/my` | Protected | List the logged-in user's posts, drafts included (paginated) |
| `GET` | `/post/:id` | Public | Get a single **published** post |
| `PATCH` | `/post/:id` | Protected | Update your own post |
| `DELETE` | `/post/:id` | Protected | Delete your own post and its comments |

#### POST /post

**Body**

```json
{
  "title": "Getting started with Express 5",
  "content": "Express 5 finally ships native async error handling...",
  "category": "Technology",
  "tags": ["node", "express"],
  "status": "Published"
}
```

`title`, `content` and `category` are required. `tags` defaults to `[]`, `status` defaults to `Draft`.

**201 Created**

```json
{
  "message": "Post created successfully!",
  "post": { "_id": "...", "title": "...", "author": "...", "status": "Published", "...": "..." }
}
```

**Errors** — `400` missing required fields · `401` not logged in · `500` schema validation failure (e.g. content shorter than 20 characters, more than 5 tags, unknown category).

#### GET /post

Public feed. Only posts with `status: "Published"` are returned, and the author is populated with their `name`.

**Query** — `page`, `limit`, `search`, `category`, `tags`, `from`, `to`, `sort`. See [Query Parameters](#query-parameters).

**200 OK**

```json
{
  "message": "Posts are: ",
  "post": [ { "_id": "...", "title": "...", "author": { "_id": "...", "name": "Ada Lovelace" } } ],
  "pages": 3,
  "page": 1,
  "limit": 5,
  "total": 12
}
```

#### GET /post/my

Same shape as the public feed, but scoped to `author: req.user._id` and **including drafts**. The response array is named `myPost`, and it additionally supports the `status` filter.

**200 OK**

```json
{
  "message": "My post: ",
  "myPost": [ { "_id": "...", "title": "...", "status": "Draft" } ],
  "pages": 1,
  "page": 1,
  "limit": 5,
  "total": 2
}
```

#### GET /post/:id

Returns a single published post with the author populated (`name`, `email`).

**200 OK**

```json
{ "message": "Post: ", "post": { "_id": "...", "title": "...", "author": { "name": "...", "email": "..." } } }
```

**Errors** — `404` if the id doesn't exist or the post is still a draft.

#### PATCH /post/:id

Partial update — send only the fields you want to change. Accepted: `title`, `content`, `category`, `tags`, `status`. Validators run on update, and the updated document is returned.

**Body**

```json
{ "status": "Published", "tags": ["node", "express", "mongodb"] }
```

**200 OK**

```json
{ "message": "Post updated successfully", "updatePost": { "...": "..." } }
```

**Errors** — `401` not logged in · `404` post doesn't exist **or you are not its author** · `500` validation failure.

#### DELETE /post/:id

Deletes the post and every comment referencing it.

**200 OK**

```json
{ "message": "Post deleted successfully!" }
```

**Errors** — `401` not logged in · `404` post doesn't exist or you are not its author.

---

### Comments

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/post/:postId/comment` | Protected | Comment on a published post |
| `GET` | `/post/:postId/comment` | Public | List a post's comments (paginated) |
| `PATCH` | `/comment/:commentId` | Protected | Edit your own comment |
| `DELETE` | `/comment/:commentId` | Protected | Delete your own comment |

#### POST /post/:postId/comment

**Body**

```json
{ "comment": "Great write-up, thanks!" }
```

**201 Created**

```json
{
  "message": "Comment Added Successfully!",
  "comment": { "_id": "...", "comment": "Great write-up, thanks!", "post": "...", "user": "..." }
}
```

**Errors** — `400` empty comment · `401` not logged in · `404` post not found or not published · `500` length validation (2–250 characters).

#### GET /post/:postId/comment

Lists comments on a published post, newest first by default, with the commenter populated (`name`, `email`).

**Query** — `page` (default `1`), `limit` (default `10`, max `50`), `sort=oldest|newest`.

**200 OK**

```json
{
  "message": "Comments: ",
  "comment": [ { "_id": "...", "comment": "...", "user": { "name": "...", "email": "..." } } ],
  "pages": 2,
  "page": 1,
  "limit": 10,
  "totalComments": 14
}
```

**Errors** — `404` post not found or not published.

#### PATCH /comment/:commentId

**Body**

```json
{ "comment": "Edited: great write-up!" }
```

**200 OK**

```json
{ "message": "Comment updated successfully!", "comment": { "...": "..." } }
```

**Errors** — `400` empty comment · `401` not logged in · `404` comment doesn't exist or you are not its author.

#### DELETE /comment/:commentId

**200 OK**

```json
{ "message": "Comment deleted successfully!" }
```

**Errors** — `401` not logged in · `404` comment doesn't exist or you are not its author.

---

## Query Parameters

Supported on `GET /post` and `GET /post/my`:

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | number | `1` | Values `<= 0` are coerced to `1` |
| `limit` | number | `5` | Values `<= 0` become `5`; capped at `50` |
| `search` | string | — | Case-insensitive regex match on the title |
| `category` | string | — | Exact match against the category enum |
| `tags` | string | — | Matches posts containing that tag |
| `status` | string | — | `/post/my` only — `Draft` or `Published` |
| `from` | date | — | Posts created on or after this date |
| `to` | date | — | Posts created on or before this date |
| `sort` | string | newest | `oldest` flips to ascending; anything else is newest-first |

Supported on `GET /post/:postId/comment`: `page` (default `1`), `limit` (default `10`, max `50`), `sort`.

**Example**

```
GET /post?search=express&category=Technology&tags=node&sort=oldest&page=2&limit=10
```

---

## Error Responses

Every error is JSON. Validation and business-rule failures carry only a `message`; unexpected failures also include the underlying `error` string.

```json
{ "message": "Post not found!" }
```

```json
{ "message": "Internal Server Error", "error": "Post validation failed: content: ..." }
```

| Status | Meaning |
| --- | --- |
| `400` | Missing or invalid input, duplicate email, bad credentials |
| `401` | Missing, expired, or invalid auth cookie |
| `404` | Resource not found, or found but not owned by / not visible to the caller |
| `500` | Unhandled server or Mongoose validation error |

Ownership failures deliberately return `404` rather than `403`, so a caller can't tell the difference between "doesn't exist" and "isn't yours".
