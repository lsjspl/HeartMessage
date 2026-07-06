ALTER TABLE sensitive_configs ADD COLUMN label TEXT;

ALTER TABLE sensitive_configs ADD COLUMN group_name TEXT NOT NULL DEFAULT '自定义';

UPDATE sensitive_configs
SET label = '登录 Token 签名密钥',
    group_name = '认证'
WHERE key = 'AUTH_TOKEN_SECRET';

UPDATE sensitive_configs
SET label = '本地测试 AI Key',
    group_name = 'AI 供应商'
WHERE key = 'LOCAL_TEST_MODEL_API_KEY';

UPDATE sensitive_configs
SET label = '微信网站应用 AppID',
    group_name = '第三方登录'
WHERE key = 'WECHAT_WEB_APP_ID';

UPDATE sensitive_configs
SET label = '微信网站应用 AppSecret',
    group_name = '第三方登录'
WHERE key = 'WECHAT_WEB_APP_SECRET';

UPDATE sensitive_configs
SET label = 'Google OAuth Client ID',
    group_name = '第三方登录'
WHERE key = 'GOOGLE_OAUTH_CLIENT_ID';

UPDATE sensitive_configs
SET label = 'Google OAuth Client Secret',
    group_name = '第三方登录'
WHERE key = 'GOOGLE_OAUTH_CLIENT_SECRET';
