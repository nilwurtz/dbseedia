import { ValidationError } from "../errors/index.js";
import type { ConnectionConfig, DbSeediaConfig } from "../interfaces/index.js";

export interface ConfigValidatorInterface {
  validateAndApplyDefaults(config: DbSeediaConfig): DbSeediaConfig;
}

export class DbSeediaConfigValidator implements ConfigValidatorInterface {
  private readonly defaultConfig = {
    strategy: "truncate" as const,
    separator: ",",
    encoding: "utf8" as const,
    nullValue: "",
    batchSize: 1000,
  };

  validateAndApplyDefaults(config: DbSeediaConfig): DbSeediaConfig {
    this.validateConnection(config);

    return {
      ...this.defaultConfig,
      ...config,
    };
  }

  private validateConnection(config: DbSeediaConfig): void {
    if (!config.connection) {
      throw new ValidationError("Connection configuration is required");
    }

    const connections = Array.isArray(config.connection) ? config.connection : [config.connection];

    for (const conn of connections) {
      this.validateSingleConnection(conn);
    }
  }

  private validateSingleConnection(conn: ConnectionConfig): void {
    if (!conn.host || !conn.database || !conn.username) {
      throw new ValidationError("Host, database, and username are required for connection");
    }
  }
}
