import type {
  ParsedData,
  TableSchema,
  TransformedData,
} from "../interfaces/index.js";
import { DataTransformError } from "../errors/index.js";

export interface DataTransformer {
  transform(data: ParsedData, schema: TableSchema): Promise<TransformedData>;
}

export class DefaultDataTransformer implements DataTransformer {
  private nullValue: string;

  constructor(nullValue: string = "") {
    this.nullValue = nullValue;
  }

  async transform(
    data: ParsedData,
    schema: TableSchema,
  ): Promise<TransformedData> {
    try {
      const { headers, rows } = data;

      if (
        headers.length === 0 &&
        rows.length > 0 &&
        schema.columns.length === 0
      ) {
        throw new Error("No headers found but data rows exist");
      }

      const columns =
        headers.length > 0 ? headers : schema.columns.map((col) => col.name);

      const transformedValues = rows.map((row) => {
        return row.map((value) => {
          if (value === this.nullValue) {
            return null;
          }
          return value;
        });
      });

      return {
        columns,
        values: transformedValues,
      };
    } catch (error) {
      throw new DataTransformError(
        `Failed to transform data for table: ${schema.name}`,
        error as Error,
      );
    }
  }
}
