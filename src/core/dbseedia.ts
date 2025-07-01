import { join } from "node:path";
import { FileNotFoundError, FileParseError, ValidationError } from "../errors/index.js";
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
import { type ConfigValidatorInterface, DbSeediaConfigValidator } from "../services/config-validator.js";
import { DefaultDataTransformer } from "../services/data-transformer.js";
import { TableFileLocator, type TableFileLocatorInterface } from "../services/table-file-locator.js";

export class DbSeedia {
  private config: DbSeediaConfig;
  private executors: Map<string, PostgresDbRepository> = new Map();
  private fileRepository: CsvFileRepository;
  private dataTransformer: DefaultDataTransformer;
  private tableFileLocator: TableFileLocatorInterface;
  private configValidator: ConfigValidatorInterface;

  constructor(config: DbSeediaConfig) {
    this.configValidator = new DbSeediaConfigValidator();
    this.config = this.configValidator.validateAndApplyDefaults(config);
    this.fileRepository = new CsvFileRepository();
    this.dataTransformer = new DefaultDataTransformer(this.config.nullValue);
    this.tableFileLocator = new TableFileLocator();
    this.initializeExecutors();
  }

  private initializeExecutors(): void {
    const connections = Array.isArray(this.config.connection) ? this.config.connection : [this.config.connection];

    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      if (conn) {
        const name = conn.name || (i === 0 ? "default" : `connection_${i}`);
        this.executors.set(name, new PostgresDbRepository(conn));
      }
    }
  }

  async connect(): Promise<void> {
    const connectionPromises = Array.from(this.executors.values()).map((executor) => executor.connect());
    await Promise.all(connectionPromises);
  }

  async disconnect(): Promise<void> {
    const disconnectionPromises = Array.from(this.executors.values()).map((executor) => executor.disconnect());
    await Promise.all(disconnectionPromises);
  }

  async loadFrom(directory: string, options: LoadOptions = {}): Promise<void> {
    const executor = this.getExecutor(options.target);
    const strategy = options.strategy || this.config.strategy || "truncate";

    try {
      const tableOrdering = await this.getTableOrdering(directory);

      if (tableOrdering.length === 0) {
        throw new FileParseError(`No tables specified in table-ordering.txt in directory: ${directory}`);
      }

      for (const tableName of tableOrdering) {
        await this.loadTable(directory, tableName, executor, strategy);
      }
    } catch (error) {
      if (error instanceof FileNotFoundError) {
        throw error;
      }
      throw new FileParseError(`Failed to load data from directory: ${directory}`, error as Error);
    }
  }

  private getExecutor(target?: string): PostgresDbRepository {
    const executorName = target || "default";
    const executor = this.executors.get(executorName);

    if (!executor) {
      throw new ValidationError(`Database executor '${executorName}' not found`);
    }

    return executor;
  }

  private async getTableOrdering(directory: string): Promise<string[]> {
    const orderingFile = join(directory, "table-ordering.txt");

    try {
      return await this.fileRepository.readTableOrdering(orderingFile);
    } catch (error) {
      if (error instanceof FileNotFoundError) {
        throw error;
      }
      throw new FileParseError(`table-ordering.txt not found in directory: ${directory}`, error as Error);
    }
  }

  private async loadTable(
    directory: string,
    tableName: string,
    executor: PostgresDbRepository,
    strategy: LoadStrategy,
  ): Promise<void> {
    const tableFileInfo = await this.tableFileLocator.locateTableFile(directory, tableName);

    const parseOptions: ParseOptions = {
      separator: tableFileInfo.separator,
      encoding: this.config.encoding || "utf8",
      header: true,
    };

    const parsedData = await this.fileRepository.readCsv(tableFileInfo.filePath, parseOptions);

    const schema: TableSchema = {
      name: tableName,
      columns: parsedData.headers.map((header) => ({
        name: header,
        type: "text",
        nullable: true,
      })),
    };

    const transformedData = await this.dataTransformer.transform(parsedData, schema);
    await executor.execute(tableName, transformedData, strategy);
  }

  withStrategy(strategy: LoadStrategy): DbSeedia {
    return new DbSeedia({ ...this.config, strategy });
  }

  withOptions(options: Partial<DbSeediaConfig>): DbSeedia {
    return new DbSeedia({ ...this.config, ...options });
  }

  withConnection(connection: ConnectionConfig): DbSeedia {
    return new DbSeedia({ ...this.config, connection });
  }
}
