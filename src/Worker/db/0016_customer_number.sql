-- Migration 0016: Add customer_number to customers
ALTER TABLE customers ADD COLUMN customer_number TEXT;
