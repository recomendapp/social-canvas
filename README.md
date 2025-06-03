# 🖼️ Social Canvas — Social Image Generation Service

<div align="center">
  <img src="./docs/recomend_icon.svg" alt="Recomend logo" width="50" />
  <h2 align="center">Social Canvas</h2>
  
</div>

A **Fastify**-based service for generating social media sharing images, developed by [@lxup](https://github.com/lxup).

## ✅ TODO

- [ ] Add more endpoints (playlists, reviews, etc.)

## 🚀 Tech Stack

- ⚡️ [Fastify](https://fastify.dev/) – Node.js Framework (TypeScript)
- 🖌️ [Sharp](https://sharp.pixelplumbing.com/) – Image Processing
- 🗄️ [Redis](https://redis.io/) – Caching Layer

## 📦 Installation

```bash
npm install
cp .env.template .env
# Add your environment variables to .env
npm run dev
```

## 📚 API Documentation
Explore the API routes and their documentation using the Swagger interface:
- **Endpoint**: /docs
- **Description**: Access the interactive Swagger UI to view and test all available API endpoints, including parameters and response formats.

Visit http://localhost:9000/docs after starting the service to explore the API documentation.