-- ================================================================
-- MODULE 18: Expand Company Settings (MySQL compatible)
-- ================================================================

-- tax_id
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'company_settings'
    AND COLUMN_NAME = 'tax_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE company_settings ADD COLUMN tax_id VARCHAR(64) DEFAULT NULL COMMENT ''Tax / GST / VAT identification number'';',
  'SELECT "tax_id already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- registered_address
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'company_settings'
    AND COLUMN_NAME = 'registered_address'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE company_settings ADD COLUMN registered_address VARCHAR(500) DEFAULT NULL COMMENT ''Official registered business address'';',
  'SELECT "registered_address already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- phone_number
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'company_settings'
    AND COLUMN_NAME = 'phone_number'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE company_settings ADD COLUMN phone_number VARCHAR(32) DEFAULT NULL COMMENT ''Company contact phone number'';',
  'SELECT "phone_number already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- website_url
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'company_settings'
    AND COLUMN_NAME = 'website_url'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE company_settings ADD COLUMN website_url VARCHAR(512) DEFAULT NULL COMMENT ''Company website URL'';',
  'SELECT "website_url already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;