# Getting Started

## Installation

BluFiles uses Docker Compose for easy setup and deployment. Files are stored in a mounted volume, and all extra metadata such as users, file/folder records, etc. are stored in a PostgreSQL database. This is explained in more detail below.

1. Create a new directory for BluFiles and navigate into it:

   ```bash
   mkdir blufiles
   cd blufiles
   ```

2. Create a `compose.yml` file with the following content:

   ```yaml
   services:
     blufiles:
       image: ghcr.io/bludood/files:latest
       restart: unless-stopped
       ports:
         - 1337:1337 # change which port BluFiles binds to
       volumes:
         - ./data:/data # change this mount if you want to store files in a different location
       environment:
         - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/files
         - STORAGE_DIR=/data
     postgres:
       image: postgres
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
         POSTGRES_DB: files
       volumes:
         - postgres:/var/lib/postgresql/data

   volumes:
     postgres:
   ```

3. Start the BluFiles container using Docker Compose:
   ```bash
    docker compose up -d
   ```
4. Access BluFiles by navigating to `http://localhost:1337` in your web browser.

## Initial Setup

The default configuration for BluFiles lets the first registered user be the admin, and then registration will be disabled. This can be configured using the administration panel explained in the [Admin page documentation](features/admin.md). From here, you can either re-enable registration, or create extra users manually.

## Extra Configuration

BluFiles can be configured using environment variables. The most important ones are:

- `DATABASE_URL`: The connection string for the PostgreSQL database. The default value is `postgresql://postgres:postgres@postgres:5432/files`.
- `STORAGE_DIR`: The directory where files are stored. The default value is `/data`.
- `PORT`: The port that BluFiles binds to. The default value is `1337`.

## Architecture

This setup consists of two main components: the BluFiles server and a PostgreSQL database.

- **BluFiles Server**: Runs the web interface as well as the API for file management. It handles user authentication, file uploads/downloads, and other operations. The server is built using Node.js and Express.
- **PostgreSQL Database**: Stores all metadata related to users, files, folders, and other configuration

The internal file information is stored in the Postgres database, while the actual files are stored in a mounted volume. This means that the files on disk are only used to retrieve the raw data of the file, while everything else such as file name, size, type, etc. is stored in the database.
