import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DbSeedia } from "../../../src/index.js";
import type { ConnectionConfig } from "../../../src/interfaces/index.js";
import { PostgresContainer } from "../../utils/postgres-container.js";
import { PostgresHelper } from "../../utils/postgres-helper.js";

describe("マルチデータベース機能", () => {
  let mainContainer: PostgresContainer;
  let analyticsContainer: PostgresContainer;
  let mainHelper: PostgresHelper;
  let analyticsHelper: PostgresHelper;
  let mainConnectionConfig: ConnectionConfig;
  let analyticsConnectionConfig: ConnectionConfig;
  let multiDbSeedia: DbSeedia;

  beforeAll(async () => {
    // シングルトンコンテナを使用
    mainContainer = PostgresContainer.getMainInstance();
    mainConnectionConfig = await mainContainer.start();

    analyticsContainer = PostgresContainer.getAnalyticsInstance();
    analyticsConnectionConfig = await analyticsContainer.start();

    // PostgreSQL操作用ヘルパーを作成
    mainHelper = new PostgresHelper(mainContainer);
    analyticsHelper = new PostgresHelper(analyticsContainer);

    // 両方のコンテナでスキーマを1度だけ初期化
    await mainHelper.initializeSchema();
    await analyticsHelper.initializeSchema();

    // マルチデータベース設定でDbSeedaを初期化
    // 最初の接続にnameを指定しないことで、自動的に"default"になる
    multiDbSeedia = new DbSeedia({
      connection: [
        {
          ...mainConnectionConfig,
        },
        {
          name: "analytics",
          ...analyticsConnectionConfig,
        },
      ],
      strategy: "truncate",
    });

    await multiDbSeedia.connect();
  }, 120000);

  afterAll(async () => {
    if (multiDbSeedia) {
      await multiDbSeedia.disconnect();
    }
    // コンテナは停止しない（他のテストで再利用）
  });

  beforeEach(async () => {
    if (mainHelper) {
      await mainHelper.truncateTables();
    }
    if (analyticsHelper) {
      await analyticsHelper.truncateTables();
    }
  });

  it("複数データベースに同時に接続できること", async () => {
    // 接続確認のため、各データベースにクエリを実行
    const mainResult = await mainHelper.executeQuery("SELECT 1 as test");
    const analyticsResult = await analyticsHelper.executeQuery("SELECT 1 as test");

    expect(mainResult[0]).toBe("1");
    expect(analyticsResult[0]).toBe("1");
  });

  it("アナリティクスデータベースにのみデータをロードできること", async () => {
    // アナリティクスデータベースにのみロード
    await multiDbSeedia.loadFrom("./e2e/scenarios/multi-database/fixtures", {
      target: "analytics",
    });

    // アナリティクスデータベースにデータが存在することを確認
    const analyticsUserCount = await analyticsHelper.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(analyticsUserCount[0])).toBe(3);

    const analyticsPostCount = await analyticsHelper.executeQuery("SELECT COUNT(*) FROM posts");
    expect(parseInt(analyticsPostCount[0])).toBe(3);

    // メインデータベースにはデータが存在しないことを確認
    const mainUserCount = await mainHelper.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(mainUserCount[0])).toBe(0);

    const mainPostCount = await mainHelper.executeQuery("SELECT COUNT(*) FROM posts");
    expect(parseInt(mainPostCount[0])).toBe(0);
  });

  it("メインデータベースにのみデータをロードできること", async () => {
    // メインデータベースにのみロード（defaultターゲット）
    await multiDbSeedia.loadFrom("./e2e/scenarios/multi-database/fixtures", {
      target: "default",
    });

    // メインデータベースにデータが存在することを確認
    const mainUserCount = await mainHelper.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(mainUserCount[0])).toBe(3);

    const mainPostCount = await mainHelper.executeQuery("SELECT COUNT(*) FROM posts");
    expect(parseInt(mainPostCount[0])).toBe(3);

    // アナリティクスデータベースにはデータが存在しないことを確認（独立したテスト）
    const analyticsUserCount = await analyticsHelper.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(analyticsUserCount[0])).toBe(0);

    const analyticsPostCount = await analyticsHelper.executeQuery("SELECT COUNT(*) FROM posts");
    expect(parseInt(analyticsPostCount[0])).toBe(0);
  });

  it("両方のデータベースに順次データをロードできること", async () => {
    // 両方のデータベースに順次ロード
    await multiDbSeedia.loadFrom("./e2e/scenarios/multi-database/fixtures", {
      target: "default",
    });
    await multiDbSeedia.loadFrom("./e2e/scenarios/multi-database/fixtures", {
      target: "analytics",
    });

    // 両方のデータベースにデータが存在することを確認
    const mainUserCount = await mainHelper.executeQuery("SELECT COUNT(*) FROM users");
    const analyticsUserCount = await analyticsHelper.executeQuery("SELECT COUNT(*) FROM users");

    expect(parseInt(mainUserCount[0])).toBe(3);
    expect(parseInt(analyticsUserCount[0])).toBe(3);

    // データの内容も確認
    const mainUsers = await mainHelper.executeQuery("SELECT name FROM users ORDER BY id");
    const analyticsUsers = await analyticsHelper.executeQuery("SELECT name FROM users ORDER BY id");

    expect(mainUsers).toEqual(analyticsUsers);
    expect(mainUsers[0]).toBe("Alice Smith");
    expect(mainUsers[1]).toBe("Bob Wilson");
    expect(mainUsers[2]).toBe("Charlie Brown");
  });

  it("存在しないターゲットを指定した場合エラーが発生すること", async () => {
    await expect(
      multiDbSeedia.loadFrom("./e2e/scenarios/multi-database/fixtures", {
        target: "nonexistent",
      }),
    ).rejects.toThrow("Database executor 'nonexistent' not found");
  });

  it("target指定なしの場合はdefaultデータベースにロードされること", async () => {
    // target指定なしでロード（最初の接続がdefaultになる）
    await multiDbSeedia.loadFrom("./e2e/scenarios/multi-database/fixtures");

    // メインデータベース（最初の接続）にデータが存在することを確認
    const mainUserCount = await mainHelper.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(mainUserCount[0])).toBe(3);

    // アナリティクスデータベースにはデータが存在しないことを確認（独立したテスト）
    const analyticsUserCount = await analyticsHelper.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(analyticsUserCount[0])).toBe(0);
  });

  it("フルエントインターフェースでマルチデータベースを使用できること", async () => {
    const fluentDbSeedia = multiDbSeedia.withStrategy("truncate").withOptions({
      batchSize: 500,
    });

    // フルエントインターフェースは新しいインスタンスを作成するため、接続が必要
    await fluentDbSeedia.connect();

    await fluentDbSeedia.loadFrom("./e2e/scenarios/multi-database/fixtures", {
      target: "default",
    });

    await fluentDbSeedia.loadFrom("./e2e/scenarios/multi-database/fixtures", {
      target: "analytics",
    });

    await fluentDbSeedia.disconnect();

    // 両方のデータベースにデータが正しくロードされたことを確認
    const mainUserCount = await mainHelper.executeQuery("SELECT COUNT(*) FROM users");
    const analyticsUserCount = await analyticsHelper.executeQuery("SELECT COUNT(*) FROM users");

    expect(parseInt(mainUserCount[0])).toBe(3);
    expect(parseInt(analyticsUserCount[0])).toBe(3);
  });
});
