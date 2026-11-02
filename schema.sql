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

-- One row per passkey: the key a phone or computer made, kept by the id that key names itself by.
--
-- The public half only. There is no secret here to steal: checking a sign-in needs the public key,
-- and nothing in this table can be used to sign one. `counter` is what tells a copied key from the
-- real one, and `backed_up` says whether the platform syncs it between devices.

/*
 * **The traveller's photograph, one per account.**
 *
 * It was going to live in an R2 bucket, and Cloudflare will not switch R2 on without a payment
 * method, which this project does not have. A squared photograph is about thirty kilobytes, so
 * the free database holds thousands of them and nothing was given up but tidiness. The value is a
 * JPEG data URL, written by `worker/photos.js` after it has checked the shape.
 */
CREATE TABLE IF NOT EXISTS profile_photo (
  uid TEXT PRIMARY KEY,
  photo TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

/*
 * **How often one caller may do one thing, while there is no zone to point a rule at.**
 *
 * One row per caller per door: the hits in this window and when the window ends. Cloudflare's own
 * rate limiting needs a domain, and this project has none, so the count lives beside the data it
 * protects. Windows are swept on the way past, the way challenges are (there is no cron here).
 */
CREATE TABLE IF NOT EXISTS api_limit (
  bucket    TEXT PRIMARY KEY,
  hits      INTEGER NOT NULL DEFAULT 0,
  resets_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS api_limit_expiry ON api_limit (resets_at);

CREATE TABLE IF NOT EXISTS passkey (
  id          TEXT PRIMARY KEY,
  uid         TEXT NOT NULL,
  name        TEXT NOT NULL,
  public_key  TEXT NOT NULL,
  counter     INTEGER NOT NULL DEFAULT 0,
  transports  TEXT,
  device_type TEXT,
  backed_up   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS passkey_uid ON passkey (uid);

-- A challenge is the question the browser is asked to answer, and it lives for five minutes.
--
-- Kept in the database rather than trusted from the browser, because a challenge the browser can
-- choose is not a challenge: it is what stops yesterday's answer from being replayed today. Rows
-- are deleted the moment they are used and swept when the next one is made.

CREATE TABLE IF NOT EXISTS passkey_challenge (
  id         TEXT PRIMARY KEY,
  challenge  TEXT NOT NULL,
  kind       TEXT NOT NULL,
  uid        TEXT,
  name       TEXT,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS passkey_challenge_expiry ON passkey_challenge (expires_at);
