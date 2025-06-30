import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { FileParseError, ValidationError } from "../errors/index.js";
import type {
  ConnectionConfig,
  DbSeediaConfig,
  LoadOptions,
  LoadStrategy,
  ParseOptions,
  TableSchema,
} from "../interfaces/index.js";
import { PostgresDbRepository } from "../repository/db.js";
import { CsvFileRepository } from "../repository/file.js";
import { DefaultDataTransformer } from "../services/data-transformer.js";

export class DbSeedia {
  private config: DbSeediaConfig;
  private executors: Map<string, PostgresDbRepository> = new Map();
  private fileRepository: CsvFileRepository;
  private dataTransformer: DefaultDataTransformer;

  constructor(config: DbSeediaConfig) {
    this.config = this.validateConfig(config);
    this.fileRepository = new CsvFileRepository();
    this.dataTransformer = new DefaultDataTransformer(config.nullValue);
    this.initializeExecutors();
  }

  private validateConfig(config: DbSeediaConfig): DbSeediaConfig {
    if (!config.connection) {
      throw new ValidationError("Connection configuration is required");
    }

    const connections = Array.isArray(config.connection)
      ? config.connection
      : [config.connection];

    for (const conn of connections) {
      if (!conn.host || !conn.database || !conn.username) {
        throw new ValidationError(
          "Host, database, and username are required for connection",
        );
      }
    }

    return {
      strategy: "truncate",
      separator: ",",
      encoding: "utf8",
      nullValue: "",
      batchSize: 1000,
      ...config,
    };
  }

  private initializeExecutors(): void {
    const connections = Array.isArray(this.config.connection)
      ? this.config.connection
      : [this.config.connection];

    for (const conn of connections) {
      const name = conn.name || "default";
      this.executors.set(name, new PostgresDbRepository(conn));
    }
  }

  async connect(): Promise<void> {
    const connectionPromises = Array.from(this.executors.values()).map(
      (executor) => executor.connect(),
    );
    await Promise.all(connectionPromises);
  }

  async disconnect(): Promise<void> {
    const disconnectionPromises = Array.from(this.executors.values()).map(
      (executor) => executor.disconnect(),
    );
    await Promise.all(disconnectionPromises);
  }

  async loadFrom(directory: string, options: LoadOptions = {}): Promise<void> {
    const executor = this.getExecutor(options.target);
    const strategy = options.strategy || this.config.strategy || "truncate";

    try {
      const tableOrdering = await this.getTableOrdering(directory);
      const tablesToLoad = options.tables || tableOrdering;

      for (const tableName of tablesToLoad) {
        await this.loadTable(directory, tableName, executor, strategy);
      }
    } catch (error) {
      throw new FileParseError(
        `Failed to load data from directory: ${directory}`,
        error as Error,
      );
    }
  }

  private getExecutor(target?: string): PostgresDbRepository {
    const executorName = target || "default";
    const executor = this.executors.get(executorName);

    if (!executor) {
      throw new ValidationError(
        `Database executor '${executorName}' not found`,
      );
    }

    return executor;
  }

  private async getTableOrdering(directory: string): Promise<string[]> {
    const orderingFile = join(directory, "table-ordering.txt");

    try {
      return await this.fileRepository.readTableOrdering(orderingFile);
    } catch {
      return await this.discoverTables(directory);
    }
  }

  private async discoverTables(directory: string): Promise<string[]> {
    try {
      const files = await readdir(directory);
      return files
        .filter((file) => file.endsWith(".csv") || file.endsWith(".tsv"))
        .map((file) => file.replace(/\.(csv|tsv)$/, ""));
    } catch (error) {
      throw new FileParseError(
        `Failed to discover tables in directory: ${directory}`,
        error as Error,
      );
    }
  }

  private async loadTable(
    directory: string,
    tableName: string,
    executor: PostgresDbRepository,
    strategy: LoadStrategy,
  ): Promise<void> {
    const csvFile = join(directory, `${tableName}.csv`);
    const tsvFile = join(directory, `${tableName}.tsv`);

    let filePath: string;
    let separator: string;

    try {
      await import("node:fs").then((fs) => fs.promises.access(csvFile));
      filePath = csvFile;
      separator = ",";
    } catch {
      try {
        await import("node:fs").then((fs) => fs.promises.access(tsvFile));
        filePath = tsvFile;
        separator = "\t";
      } catch {
        throw new FileParseError(`No data file found for table: ${tableName}`);
      }
    }

    const parseOptions: ParseOptions = {
      separator: separator,
      encoding: this.config.encoding || "utf8",
      header: true,
    };

    const parsedData = await this.fileRepository.readCsv(
      filePath,
      parseOptions,
    );

    const schema: TableSchema = {
      name: tableName,
      columns: parsedData.headers.map((header) => ({
        name: header,
        type: "text",
        nullable: true,
      })),
    };

    const transformedData = await this.dataTransformer.transform(
      parsedData,
      schema,
    );
    await executor.execute(tableName, transformedData, strategy);
  }

  withStrategy(strategy: LoadStrategy): DbSeedia {
    return new DbSeedia({ ...this.config, strategy });
  }

  withOptions(options: Partial<DbSeediaConfig>): DbSeedia {
    return new DbSeedia({ ...this.config, ...options });
  }

  withTables(tables: string[]): DbSeedia {
    return new DbSeedia({ ...this.config, tables });
  }

  withConnection(connection: ConnectionConfig): DbSeedia {
    return new DbSeedia({ ...this.config, connection });
  }
}
