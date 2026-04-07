# Backing up BluFiles

As laid out in [Architecture](../getting-started/index.md#architecture), BluFiles uses a PostgreSQL database to store all metadata such as users, file/folder records, etc. The actual files, as well as the server config file, are stored in a mounted volume `/data`. To back up BluFiles, you need to back up both the database and the mounted volume.

## Backing up the database

To back up the PostgreSQL database, you can use the `pg_dump` command-line tool like so:

```bash
docker compose exec postgres pg_dump -U postgres --clean files > backup.sql
```

This will produce a `backup.sql` file used for restoring the database later. The `--clean` flag ensures that the dump includes instructions to drop existing tables before recreating them, which is necessary for a clean restore.

## Backing up the mounted volume

To back up the actual file data and the configuration file, you can simply copy or archive the contents of your mounted `/data` volume. Since `./data` is a bind mount on the host, you can do this directly without entering the container:

```bash
tar -czvf backup.tar.gz -C ./data .
```

This will produce a `backup.tar.gz` file containing all the files and the configuration.

## Restoring from backup

::: warning Do not start the BluFiles container before restoring BOTH the database and the mounted volume!
If you start the container after restoring only one of the two, BluFiles will automatically purge any file records that do not have a corresponding file in the mounted volume, or any files in the mounted volume that do not have a corresponding file record in the database. This means that if you start the container after restoring only one of the two, you will lose all your data.
:::

First, make sure only the PostgreSQL container is running (without BluFiles):

```bash
docker compose up postgres -d
```

Restore the database from the `backup.sql` file using the `psql` CLI:

```bash
docker compose exec -T postgres psql -U postgres files < backup.sql
```

Restore the files and configuration from the `backup.tar.gz` file:

```bash
tar -xzvf backup.tar.gz -C ./data
```

Once both are restored, start the rest of the services:

```bash
docker compose up -d
```
