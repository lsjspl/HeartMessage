UPDATE admin_accounts
SET
  password_hash = 'PK0MDL0Pq62G2s4LwKNyfb/sf1rDO6zxLPrGLAV2YIU=',
  password_iterations = 100000,
  updated_at = unixepoch() * 1000
WHERE
  username = 'admin'
  AND password_hash = 'RcSmEQrbK+svklY5xqPSr9Kh5BXHjLk8tMJpNmWRmeI='
  AND password_salt = 'SPqXFx5rFFY2xOSHmbT83g=='
  AND password_iterations = 120000;
