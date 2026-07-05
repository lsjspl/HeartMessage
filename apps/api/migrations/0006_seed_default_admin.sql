INSERT INTO admin_accounts (
  id,
  username,
  name,
  role,
  status,
  password_hash,
  password_salt,
  password_iterations,
  created_at,
  updated_at
)
SELECT
  'default-super-admin',
  'admin',
  '超级管理员',
  'super_admin',
  'active',
  'RcSmEQrbK+svklY5xqPSr9Kh5BXHjLk8tMJpNmWRmeI=',
  'SPqXFx5rFFY2xOSHmbT83g==',
  120000,
  unixepoch() * 1000,
  unixepoch() * 1000
WHERE NOT EXISTS (
  SELECT 1 FROM admin_accounts WHERE username = 'admin'
);
