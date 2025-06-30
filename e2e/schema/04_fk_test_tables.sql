-- 外部キー制約テスト用のテーブル群
-- 厳格な外部キー制約を持つテーブルを作成

-- 親テーブル: 部門
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100)
);

-- 子テーブル: 従業員（部門に依存）
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    department_id INTEGER NOT NULL,
    CONSTRAINT fk_employees_department_id 
        FOREIGN KEY (department_id) REFERENCES departments(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 孫テーブル: プロジェクト（従業員に依存）
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    lead_employee_id INTEGER NOT NULL,
    CONSTRAINT fk_projects_lead_employee_id 
        FOREIGN KEY (lead_employee_id) REFERENCES employees(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_lead_employee_id ON projects(lead_employee_id);