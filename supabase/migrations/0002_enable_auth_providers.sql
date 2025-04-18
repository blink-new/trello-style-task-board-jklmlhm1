
-- Enable email/password authentication
UPDATE auth.providers SET enabled = true WHERE provider_id = 'email';

-- Enable Google OAuth
UPDATE auth.providers SET enabled = true WHERE provider_id = 'google';