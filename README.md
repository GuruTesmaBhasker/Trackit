# 📘 SQL Learning & Practice – README

## 📌 Overview

This repository/document contains my SQL learning journey, where I studied core to advanced SQL concepts and implemented them practically using code.
The focus was on understanding how SQL works internally, not just writing queries.

## 🧠 Concepts Learned

### 1️⃣ SQL Basics & Table Handling

- Creating databases and tables using `CREATE DATABASE` and `CREATE TABLE`
- Understanding schema (columns, data types, structure)
- Applying constraints:
  - `PRIMARY KEY`
  - `UNIQUE`
  - `NOT NULL`
  - `FOREIGN KEY`
- Inserting data using `INSERT INTO`
- Viewing data and structure using:
  - `SELECT *`
  - `DESC table_name`
  - `SHOW TABLES`

### 2️⃣ Filtering & Logical Operations

- Filtering rows using:
  - `WHERE`
  - `AND`, `OR`, `NOT`
  - `LIKE`, `IN`, `BETWEEN`
- Handling NULL values using:
  - `IS NULL`
  - `IS NOT NULL`
  - `COALESCE()`
  - `IFNULL()` (MySQL)
- Sorting data using `ORDER BY ASC / DESC`
- Understanding why `NOT NULL` cannot be used directly in `WHERE`

### 3️⃣ Aggregate Functions & Grouping

- Using aggregate functions:
  - `SUM()`, `AVG()`, `COUNT()`, `MIN()`, `MAX()`
- Understanding how aggregates treat `NULL` values
- Grouping data using `GROUP BY`
- Filtering grouped data using `HAVING`
- **Rule learned:**
  - Every non-aggregated column in `SELECT` must appear in `GROUP BY`
- Using aliases and ordering by aliases

### 4️⃣ Subqueries

- Writing subqueries inside `WHERE`
- Single-row and multi-row subqueries
- Using:
  - `IN`, `NOT IN`
  - `EXISTS`, `NOT EXISTS`
- Understanding correlated subqueries
- Solving comparison-based subqueries using aggregates

### 5️⃣ Joins

- Understanding how SQL combines tables internally
- Practicing:
  - `INNER JOIN`
  - `LEFT JOIN`
  - `RIGHT JOIN`
  - `FULL JOIN` (conceptual)
- Writing multi-table joins
- **Important execution insight:**
  - `JOIN` happens before `WHERE` and `SELECT`

### 6️⃣ Views

- Creating views using `CREATE VIEW`
- Updating views using `CREATE OR REPLACE VIEW`
- Removing views using `DROP VIEW`
- Understanding why views are used:
  - Security
  - Simplification
  - Reusability

### 7️⃣ Window Functions (Advanced SQL)

- Learning analytic functions:
  - `ROW_NUMBER()`
  - `RANK()`
  - `DENSE_RANK()`
  - `NTILE()`
  - `SUM() OVER()`
  - `AVG() OVER()`
- Understanding how window functions:
  - Do **NOT** reduce rows
  - Add calculated columns instead

### 8️⃣ PARTITION BY

- Using `PARTITION BY` inside window functions
- Understanding the difference between:
  - `GROUP BY` (collapses rows)
  - `PARTITION BY` (keeps rows)

### 9️⃣ UNION & UNION ALL

- Combining result sets using:
  - `UNION` (removes duplicates)
  - `UNION ALL` (keeps duplicates)
- Understanding column count and type compatibility rules

### 🔟 SQL Order of Execution

- Learned the actual execution order of SQL queries:
  1. `FROM`
  2. `JOIN`
  3. `WHERE`
  4. `GROUP BY`
  5. `HAVING`
  6. `SELECT`
  7. `ORDER BY`
  8. `LIMIT`
- This helped in debugging complex queries correctly.

### 1️⃣1️⃣ Database Normalization

- Learned normalization concepts:
  - **1NF** – Atomic values, no repeating groups
  - **2NF** – No partial dependency
  - **3NF** – No transitive dependency
- Practiced converting tables into normalized forms

### 1️⃣2️⃣ ACID Properties

- Understood transactional reliability using:
  - **A**tomicity
  - **C**onsistency
  - **I**solation
  - **D**urability
- Practiced transactions using:
  - `START TRANSACTION`
  - `COMMIT`
  - `ROLLBACK`
- Learned why ACID is critical for real-world systems (banking, payments, etc.)

## 🛠️ What I Implemented (Hands-on)

- Created multiple tables with constraints
- Inserted sample datasets
- Wrote queries for:
  - Filtering
  - Aggregation
  - Subqueries
  - Joins
  - Window functions
- Simulated transactions to understand ACID behavior
- Debugged SQL errors related to:
  - `GROUP BY` rules
  - `NULL` handling
  - `JOIN` logic
  - Execution order

## 🎯 Outcome

By completing this practice:
- I can design relational tables correctly
- I understand how SQL queries execute internally
- I can debug SQL errors logically
- I am comfortable writing intermediate to advanced SQL queries
