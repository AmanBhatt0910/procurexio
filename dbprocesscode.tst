mysql -u root -p -e "DROP DATABASE IF EXISTS procurement_db; CREATE DATABASE procurement_db;"

mysql -u root -p procurement_db < src/sql/1auth_schema.sql
mysql -u root -p procurement_db < src/sql/2vendor_schema.sql
mysql -u root -p procurement_db < src/sql/3rfq_schema.sql
mysql -u root -p procurement_db < src/sql/4bidding_schema.sql
mysql -u root -p procurement_db < src/sql/5evaluation_schema.sql
mysql -u root -p procurement_db < src/sql/6notification_schema.sql
mysql -u root -p procurement_db < src/sql/7_constraints.sql