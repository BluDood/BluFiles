# BluFiles

A lightweight and modern selfhosted file management and sharing system.

Easily upload, manage, and share files, folders, pastes, and collections, with a clean web UI and accompanying REST API.

<img src="docs/src/guide/about/blufiles.png" />

## Features

- **File Management**: BluFiles provides a user-friendly interface for managing your files and folders
- **Pastes**: Create and share text-based pastes with syntax highlighting for code snippets
- **Collections**: Organize your files, folders and pastes into collections for sharing a set of items together
- **Sharing**: Share files, folders, pastes or collections with a simple link
- **Admin Panel**: Manage users, quotas, and other configuration through the web interface
- **API Integrations**: Allows for easy integration with custom uploaders using an API, with prebuilt templates for ShareX

## Documentation

If you want a further look at the features, setup, API usage and more, you can find the full documentation available on [docs.files.bludood.com](https://docs.files.bludood.com).

## Getting Started

0. Check that you have Docker + Docker Compose installed
1. Create a directory and add a `compose.yml`:

   ```yaml
   services:
     blufiles:
       image: ghcr.io/bludood/files:latest
       restart: unless-stopped
       ports:
         - 1337:1337
       volumes:
         - ./data:/data
       environment:
         - DATABASE_URL=postgresql://postgres:DB_PASSWORD_PLEASE_CHANGE@postgres:5432/files
         - STORAGE_DIR=/data
       depends_on:
         postgres:
           condition: service_healthy
     postgres:
       image: postgres:16
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: DB_PASSWORD_PLEASE_CHANGE
         POSTGRES_DB: files
       volumes:
         - postgres:/var/lib/postgresql/data
       healthcheck:
         test: ['CMD-SHELL', 'pg_isready -U postgres']
         interval: 5s
         timeout: 5s
         retries: 5

   volumes:
     postgres:
   ```

   > Replace `DB_PASSWORD_PLEASE_CHANGE` with a randomly generated password in both `DATABASE_URL` and `POSTGRES_PASSWORD`.

   > Here you can also choose where BluFiles stores uploaded files by changing the `STORAGE_DIR` variable or the mount point.

   > Adjust the network configuration if you want to use a reverse proxy.

2. Start the BluFiles container using Docker Compose:

   ```bash
   docker compose up -d
   ```

3. Access BluFiles by navigating to `http://localhost:1337` in your web browser. The first registered user will be an administrator, and then registration will be turned off by default.

[You can find further documentation about the features here.](https://docs.files.bludood.com)

## Environment Configuration

The most of the configuration is done using the web interface, but these are some startup options you can set using environment variables:

| Environment Variable | Description                          | Default |
| -------------------- | ------------------------------------ | ------- |
| `DATABASE_URL`       | PostgreSQL connection string         | -       |
| `STORAGE_DIR`        | Directory for uploaded files on disk | `/data` |
| `PORT`               | Port the server listens on           | `1337`  |

## Contributing

Contributions are very welcome! Make sure to follow the guidelines laid out in [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

0. Clone the repository and go to the project directory:
   ```bash
   git clone https://github.com/BluDood/BluFiles
    cd BluFiles
   ```
1. Create an `.env` file based on `.env.example`. Fill in `DATABASE_URL` with the connection string for your local PostgreSQL instance
2. Install dependencies and start the backend server:
   ```bash
   npm i
   npm run dev
   ```
   > This will start the backend on port 1337, or whatever you configured in `.env`.
3. Open a new terminal, go to the `web` directory, install dependencies and start the frontend development server:
   ```bash
   cd web
   npm i
   npm run dev
   ```
   > This will start the frontend on port 5173.
4. (optional) For development on the documentation, go to the `docs` directory, install dependencies and start the Vitepress development server:
   ```bash
   cd docs
   npm i
   npm run dev
   ```
   > This will start the documentation on port 5173 if available, or scan for the next available port.

## Support

Having issues with the app? Feel free to open issues in this repository, or join [my discord server](https://discord.bludood.com) for further support.
