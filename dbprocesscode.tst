mysql -u root -p -e "DROP DATABASE IF EXISTS procurement_db; CREATE DATABASE procurement_db;"

mysql -u root -p procurement_db < 1auth_schema.sql
mysql -u root -p procurement_db < 2vendor_schema.sql
mysql -u root -p procurement_db < 3rfq_schema.sql
mysql -u root -p procurement_db < 4bidding_schema.sql
mysql -u root -p procurement_db < 5evaluation_schema.sql