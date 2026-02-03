-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS reps;
DROP TABLE IF EXISTS monthly_targets;

-- 1. Reps Table
CREATE TABLE reps (
    id SERIAL PRIMARY KEY,
    rep_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- 2. Accounts Table
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    segment VARCHAR(50)
);

-- 3. Monthly Targets Table
CREATE TABLE monthly_targets (
    id SERIAL PRIMARY KEY,
    month VARCHAR(20) UNIQUE NOT NULL, -- Format: 'YYYY-MM'
    target INTEGER NOT NULL
);

-- 4. Deals Table
CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    deal_id VARCHAR(50) UNIQUE NOT NULL,
    account_id VARCHAR(50) REFERENCES accounts(account_id) ON DELETE SET NULL,
    rep_id VARCHAR(50) REFERENCES reps(rep_id) ON DELETE SET NULL,
    stage VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2),
    created_at DATE NOT NULL,
    closed_at DATE
);

-- 5. Activities Table
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    activity_id VARCHAR(50) UNIQUE NOT NULL,
    deal_id VARCHAR(50) REFERENCES deals(deal_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL
);
