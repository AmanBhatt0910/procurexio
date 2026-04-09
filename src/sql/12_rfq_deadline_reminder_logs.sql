-- Migration 12: Log RFQ deadline reminder emails (dedupe 12h/6h reminders per deadline)

CREATE TABLE IF NOT EXISTS rfq_deadline_reminder_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rfq_id BIGINT UNSIGNED NOT NULL,
  vendor_id BIGINT UNSIGNED NOT NULL,
  hours_before TINYINT UNSIGNED NOT NULL,
  deadline_at DATETIME NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_rfq_vendor_hours_deadline (rfq_id, vendor_id, hours_before, deadline_at),
  INDEX idx_deadline_reminders_rfq (rfq_id),
  INDEX idx_deadline_reminders_vendor (vendor_id),

  CONSTRAINT fk_deadline_reminders_rfq
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
  CONSTRAINT fk_deadline_reminders_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
