import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ConnectionConfig } from "../../src/interfaces/index.js";
import { PostgresDbRepository } from "../../src/repository/db.js";

export class SchemaLoader {
  private executor: PostgresDbRepository;

  constructor(connectionConfig: ConnectionConfig) {
    this.executor = new PostgresDbRepository(connectionConfig);
  }

  async connect(): Promise<void> {
    await this.executor.connect();
  }

  async disconnect(): Promise<void> {
    await this.executor.disconnect();
  }

  async loadSchemaFromDirectory(schemaDirectory: string): Promise<void> {
    try {
      const files = await readdir(schemaDirectory);
      const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort(); // Execute in alphabetical order

      for (const sqlFile of sqlFiles) {
        const filePath = join(schemaDirectory, sqlFile);
        await this.loadSchemaFromFile(filePath);
      }
    } catch (error) {
      throw new Error(
        `Failed to load schema from directory ${schemaDirectory}: ${(error as Error).message}`,
      );
    }
  }

  async loadSchemaFromFile(filePath: string): Promise<void> {
    try {
      const sqlContent = await readFile(filePath, "utf-8");

      // Remove comments and split by semicolons
      const cleanContent = sqlContent
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");

      const statements = cleanContent
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await this.executor.executeSQL(statement);
          } catch (error) {
            console.warn(
              `Warning: Failed to execute statement in ${filePath}: ${(error as Error).message}`,
            );
            // Continue with other statements
          }
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to load schema from file ${filePath}: ${(error as Error).message}`,
      );
    }
  }

  async executeScript(sqlScript: string): Promise<void> {
    const statements = sqlScript
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        await this.executor.executeSQL(statement);
      }
    }
  }
}
