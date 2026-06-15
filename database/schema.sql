CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  class_name TEXT NOT NULL DEFAULT '',
  responsibility TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  private_notes TEXT NOT NULL DEFAULT '',
  avatar_path TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  setup_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS private_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'invited', 'pending', 'blocked', 'archived'));

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id),
  activity TEXT NOT NULL,
  related TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  image_path TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON post_comments(post_id);

CREATE TABLE IF NOT EXISTS access_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  ip_address TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS access_events_user_created_idx
  ON access_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_attempts (
  id TEXT PRIMARY KEY,
  identifier_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_attempts_lookup_idx
  ON auth_attempts(identifier_hash, action, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_events_created_at_idx
  ON audit_events(created_at DESC);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  teacher_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  color TEXT NOT NULL DEFAULT 'forest',
  settings JSONB NOT NULL DEFAULT '{
    "linkActive": true,
    "manualApproval": true,
    "allowReentry": true,
    "notifications": true,
    "allowComments": true,
    "allowAttachments": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_invitations (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'monitor')),
  class_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  module_access JSONB NOT NULL DEFAULT '["academic"]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE class_invitations ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE class_invitations ADD COLUMN IF NOT EXISTS class_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE class_invitations ADD COLUMN IF NOT EXISTS module_access JSONB NOT NULL DEFAULT '["academic"]'::jsonb;
ALTER TABLE class_invitations DROP CONSTRAINT IF EXISTS class_invitations_role_check;
ALTER TABLE class_invitations ADD CONSTRAINT class_invitations_role_check
  CHECK (role IN ('student', 'monitor'));

CREATE INDEX IF NOT EXISTS class_invitations_token_idx
  ON class_invitations(token);

CREATE TABLE IF NOT EXISTS class_memberships (
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'monitor', 'teacher')),
  module_access JSONB NOT NULL DEFAULT '["academic"]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked', 'removed', 'rejected')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (class_id, user_id)
);

ALTER TABLE class_memberships ADD COLUMN IF NOT EXISTS module_access JSONB NOT NULL DEFAULT '["academic"]'::jsonb;

CREATE INDEX IF NOT EXISTS class_memberships_user_idx
  ON class_memberships(user_id, status);

UPDATE class_memberships
SET module_access = '[
  "academic",
  "matrizes",
  "gestacao",
  "partos",
  "leitoes",
  "varroes",
  "coberturas",
  "sanitario",
  "relatorios"
]'::jsonb
WHERE role = 'monitor';

INSERT INTO class_memberships (
  class_id,
  user_id,
  role,
  module_access,
  status,
  progress,
  approved_at
)
SELECT
  c.id,
  monitor.user_id,
  'monitor',
  '[
    "academic",
    "matrizes",
    "gestacao",
    "partos",
    "leitoes",
    "varroes",
    "coberturas",
    "sanitario",
    "relatorios"
  ]'::jsonb,
  'active',
  0,
  NOW()
FROM classes c
CROSS JOIN (
  SELECT DISTINCT u.id AS user_id
  FROM users u
  WHERE
    u.role = 'student'
    AND u.status = 'active'
    AND (
      LOWER(TRIM(u.responsibility)) = 'monitor'
      OR EXISTS (
        SELECT 1
        FROM class_memberships existing_membership
        WHERE
          existing_membership.user_id = u.id
          AND existing_membership.role = 'monitor'
          AND existing_membership.status = 'active'
      )
    )
) AS monitor
WHERE c.status = 'active'
ON CONFLICT (class_id, user_id) DO UPDATE SET
  role = 'monitor',
  module_access = EXCLUDED.module_access,
  status = 'active',
  approved_at = COALESCE(class_memberships.approved_at, NOW()),
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS class_activities (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
  due_at TIMESTAMPTZ,
  submissions INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS class_activities_class_idx
  ON class_activities(class_id, due_at);

CREATE TABLE IF NOT EXISTS class_events (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'class',
  starts_at TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS class_events_class_idx
  ON class_events(class_id, starts_at);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS class_id TEXT REFERENCES classes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS posts_class_id_idx ON posts(class_id, created_at DESC);
