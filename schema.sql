-- One row per signed-in traveller, holding the things they saved as a single document.
--
-- A document rather than a table per kind, because the app's stored shape is a handful of lists
-- that already have a version of their own inside them (`lib/storage`). A column per kind would
-- have to be migrated every time a widget or a list is added, and the traveller would have to
-- wait for a deploy to save something new. `rev` is what keeps two devices from overwriting each
-- other: every save carries the revision it was built on.

CREATE TABLE IF NOT EXISTS travel_sync (
  uid        TEXT PRIMARY KEY,
  email      TEXT,
  doc        TEXT NOT NULL DEFAULT '{}',
  rev        INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
