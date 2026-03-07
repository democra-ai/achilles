# Platform Preset Keys

Total: 388 keys across 131 platforms

## Category Distribution


| Category    | Count |
| ----------- | ----- |
| api_key     | 151   |
| token       | 73    |
| password    | 5     |
| certificate | 6     |
| env_var     | 153   |


## AI / ML

### OpenAI


| Key                 | Category | Name            | Sensitive |
| ------------------- | -------- | --------------- | --------- |
| `OPENAI_API_KEY`    | api_key  | API Key         | Yes       |
| `OPENAI_ORG_ID`     | env_var  | Organization ID | No        |
| `OPENAI_PROJECT_ID` | env_var  | Project ID      | No        |
| `OPENAI_BASE_URL`   | env_var  | Base URL        | No        |


### Anthropic


| Key                  | Category | Name     | Sensitive |
| -------------------- | -------- | -------- | --------- |
| `ANTHROPIC_API_KEY`  | api_key  | API Key  | Yes       |
| `ANTHROPIC_BASE_URL` | env_var  | Base URL | No        |


### Google Gemini


| Key                 | Category | Name                      | Sensitive |
| ------------------- | -------- | ------------------------- | --------- |
| `GEMINI_API_KEY`    | api_key  | Gemini API Key            | Yes       |
| `GOOGLE_AI_API_KEY` | api_key  | Google AI API Key (alias) | Yes       |


### xAI (Grok)


| Key           | Category | Name    | Sensitive |
| ------------- | -------- | ------- | --------- |
| `XAI_API_KEY` | api_key  | API Key | Yes       |


### Hugging Face


| Key                     | Category | Name                   | Sensitive |
| ----------------------- | -------- | ---------------------- | --------- |
| `HF_TOKEN`              | token    | Access Token           | Yes       |
| `HF_INFERENCE_ENDPOINT` | env_var  | Inference Endpoint URL | No        |


### Groq


| Key            | Category | Name    | Sensitive |
| -------------- | -------- | ------- | --------- |
| `GROQ_API_KEY` | api_key  | API Key | Yes       |


### Mistral AI


| Key               | Category | Name    | Sensitive |
| ----------------- | -------- | ------- | --------- |
| `MISTRAL_API_KEY` | api_key  | API Key | Yes       |


### Cohere


| Key              | Category | Name    | Sensitive |
| ---------------- | -------- | ------- | --------- |
| `COHERE_API_KEY` | api_key  | API Key | Yes       |


### Together AI


| Key                | Category | Name    | Sensitive |
| ------------------ | -------- | ------- | --------- |
| `TOGETHER_API_KEY` | api_key  | API Key | Yes       |


### Perplexity AI


| Key                  | Category | Name    | Sensitive |
| -------------------- | -------- | ------- | --------- |
| `PERPLEXITY_API_KEY` | api_key  | API Key | Yes       |


### OpenRouter


| Key                   | Category | Name     | Sensitive |
| --------------------- | -------- | -------- | --------- |
| `OPENROUTER_API_KEY`  | api_key  | API Key  | Yes       |
| `OPENROUTER_SITE_URL` | env_var  | Site URL | No        |


### Fireworks AI


| Key                 | Category | Name    | Sensitive |
| ------------------- | -------- | ------- | --------- |
| `FIREWORKS_API_KEY` | api_key  | API Key | Yes       |


### Cerebras


| Key                | Category | Name    | Sensitive |
| ------------------ | -------- | ------- | --------- |
| `CEREBRAS_API_KEY` | api_key  | API Key | Yes       |


### ElevenLabs


| Key                   | Category | Name     | Sensitive |
| --------------------- | -------- | -------- | --------- |
| `ELEVENLABS_API_KEY`  | api_key  | API Key  | Yes       |
| `ELEVENLABS_VOICE_ID` | env_var  | Voice ID | No        |


### Stability AI


| Key                 | Category | Name    | Sensitive |
| ------------------- | -------- | ------- | --------- |
| `STABILITY_API_KEY` | api_key  | API Key | Yes       |


### Replicate


| Key                   | Category | Name      | Sensitive |
| --------------------- | -------- | --------- | --------- |
| `REPLICATE_API_TOKEN` | token    | API Token | Yes       |


### DeepSeek


| Key                | Category | Name    | Sensitive |
| ------------------ | -------- | ------- | --------- |
| `DEEPSEEK_API_KEY` | api_key  | API Key | Yes       |


### Voyage AI


| Key              | Category | Name    | Sensitive |
| ---------------- | -------- | ------- | --------- |
| `VOYAGE_API_KEY` | api_key  | API Key | Yes       |


### fal.ai


| Key       | Category | Name    | Sensitive |
| --------- | -------- | ------- | --------- |
| `FAL_KEY` | api_key  | API Key | Yes       |


## Cloud Providers

### AWS


| Key                              | Category | Name                       | Sensitive |
| -------------------------------- | -------- | -------------------------- | --------- |
| `AWS_ACCESS_KEY_ID`              | api_key  | Access Key ID              | No        |
| `AWS_SECRET_ACCESS_KEY`          | api_key  | Secret Access Key          | Yes       |
| `AWS_DEFAULT_REGION`             | env_var  | Default Region             | No        |
| `AWS_SESSION_TOKEN`              | token    | Session Token              | Yes       |
| `AWS_S3_BUCKET`                  | env_var  | S3 Bucket Name             | No        |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | env_var  | CloudFront Distribution ID | No        |
| `AWS_ECR_REGISTRY`               | env_var  | ECR Registry URL           | No        |
| `AWS_SQS_QUEUE_URL`              | env_var  | SQS Queue URL              | No        |


### Google Cloud


| Key                        | Category    | Name                    | Sensitive |
| -------------------------- | ----------- | ----------------------- | --------- |
| `GCP_PROJECT_ID`           | env_var     | Project ID              | No        |
| `GCP_SERVICE_ACCOUNT_JSON` | certificate | Service Account JSON    | Yes       |
| `GOOGLE_CLIENT_ID`         | api_key     | OAuth 2.0 Client ID     | No        |
| `GOOGLE_CLIENT_SECRET`     | api_key     | OAuth 2.0 Client Secret | Yes       |
| `GCP_STORAGE_BUCKET`       | env_var     | GCS Bucket Name         | No        |


### Microsoft Azure


| Key                               | Category | Name                        | Sensitive |
| --------------------------------- | -------- | --------------------------- | --------- |
| `AZURE_SUBSCRIPTION_ID`           | env_var  | Subscription ID             | No        |
| `AZURE_TENANT_ID`                 | env_var  | Tenant ID                   | No        |
| `AZURE_CLIENT_ID`                 | api_key  | Client / App ID             | No        |
| `AZURE_CLIENT_SECRET`             | api_key  | Client Secret               | Yes       |
| `AZURE_OPENAI_API_KEY`            | api_key  | Azure OpenAI API Key        | Yes       |
| `AZURE_OPENAI_ENDPOINT`           | env_var  | Azure OpenAI Endpoint       | No        |
| `AZURE_OPENAI_DEPLOYMENT_NAME`    | env_var  | Deployment Name             | No        |
| `AZURE_STORAGE_CONNECTION_STRING` | env_var  | Storage Connection String   | Yes       |
| `AZURE_COSMOS_CONNECTION_STRING`  | env_var  | Cosmos DB Connection String | Yes       |


### DigitalOcean


| Key                         | Category | Name                     | Sensitive |
| --------------------------- | -------- | ------------------------ | --------- |
| `DIGITALOCEAN_ACCESS_TOKEN` | token    | Personal Access Token    | Yes       |
| `SPACES_ACCESS_KEY_ID`      | api_key  | Spaces Access Key ID     | No        |
| `SPACES_SECRET_ACCESS_KEY`  | api_key  | Spaces Secret Access Key | Yes       |
| `SPACES_ENDPOINT`           | env_var  | Spaces Endpoint          | No        |


### Hetzner Cloud


| Key                 | Category | Name      | Sensitive |
| ------------------- | -------- | --------- | --------- |
| `HETZNER_API_TOKEN` | token    | API Token | Yes       |


### Linode / Akamai


| Key                     | Category | Name                      | Sensitive |
| ----------------------- | -------- | ------------------------- | --------- |
| `LINODE_TOKEN`          | token    | Personal Access Token     | Yes       |
| `LINODE_OBJ_ACCESS_KEY` | api_key  | Object Storage Access Key | No        |
| `LINODE_OBJ_SECRET_KEY` | api_key  | Object Storage Secret Key | Yes       |


### Vultr


| Key             | Category | Name    | Sensitive |
| --------------- | -------- | ------- | --------- |
| `VULTR_API_KEY` | api_key  | API Key | Yes       |


### IBM Cloud


| Key                | Category | Name    | Sensitive |
| ------------------ | -------- | ------- | --------- |
| `IBM_API_KEY`      | api_key  | API Key | Yes       |
| `IBM_CLOUD_REGION` | env_var  | Region  | No        |


## Database

### Supabase


| Key                         | Category | Name              | Sensitive |
| --------------------------- | -------- | ----------------- | --------- |
| `SUPABASE_URL`              | env_var  | Project URL       | No        |
| `SUPABASE_ANON_KEY`         | api_key  | Anon / Public Key | No        |
| `SUPABASE_SERVICE_ROLE_KEY` | api_key  | Service Role Key  | Yes       |
| `SUPABASE_DB_PASSWORD`      | password | Database Password | Yes       |
| `SUPABASE_JWT_SECRET`       | api_key  | JWT Secret        | Yes       |


### MongoDB Atlas


| Key               | Category | Name              | Sensitive |
| ----------------- | -------- | ----------------- | --------- |
| `MONGODB_URI`     | env_var  | Connection String | Yes       |
| `MONGODB_DB_NAME` | env_var  | Database Name     | No        |


### PlanetScale


| Key                         | Category | Name          | Sensitive |
| --------------------------- | -------- | ------------- | --------- |
| `DATABASE_URL`              | env_var  | Database URL  | Yes       |
| `PLANETSCALE_SERVICE_TOKEN` | token    | Service Token | Yes       |


### Neon


| Key                     | Category | Name         | Sensitive |
| ----------------------- | -------- | ------------ | --------- |
| `DATABASE_URL`          | env_var  | Database URL | Yes       |
| `DATABASE_URL_UNPOOLED` | env_var  | Direct URL   | Yes       |


### Upstash


| Key                                  | Category | Name                       | Sensitive |
| ------------------------------------ | -------- | -------------------------- | --------- |
| `UPSTASH_REDIS_REST_URL`             | env_var  | Redis REST URL             | No        |
| `UPSTASH_REDIS_REST_TOKEN`           | token    | Redis REST Token           | Yes       |
| `UPSTASH_VECTOR_REST_URL`            | env_var  | Vector REST URL            | No        |
| `UPSTASH_VECTOR_REST_TOKEN`          | token    | Vector REST Token          | Yes       |
| `UPSTASH_QSTASH_TOKEN`               | token    | QStash Token               | Yes       |
| `UPSTASH_QSTASH_CURRENT_SIGNING_KEY` | api_key  | QStash Current Signing Key | Yes       |
| `UPSTASH_QSTASH_NEXT_SIGNING_KEY`    | api_key  | QStash Next Signing Key    | Yes       |


### Turso (LibSQL)


| Key                  | Category | Name         | Sensitive |
| -------------------- | -------- | ------------ | --------- |
| `TURSO_DATABASE_URL` | env_var  | Database URL | No        |
| `TURSO_AUTH_TOKEN`   | token    | Auth Token   | Yes       |


### Pinecone


| Key                | Category | Name           | Sensitive |
| ------------------ | -------- | -------------- | --------- |
| `PINECONE_API_KEY` | api_key  | API Key        | Yes       |
| `PINECONE_INDEX`   | env_var  | Index Name     | No        |
| `PINECONE_CLOUD`   | env_var  | Cloud Provider | No        |
| `PINECONE_REGION`  | env_var  | Region         | No        |


### Weaviate


| Key                | Category | Name        | Sensitive |
| ------------------ | -------- | ----------- | --------- |
| `WEAVIATE_URL`     | env_var  | Cluster URL | No        |
| `WEAVIATE_API_KEY` | api_key  | API Key     | Yes       |


### Qdrant


| Key                 | Category | Name            | Sensitive |
| ------------------- | -------- | --------------- | --------- |
| `QDRANT_URL`        | env_var  | Cluster URL     | No        |
| `QDRANT_API_KEY`    | api_key  | API Key         | Yes       |
| `QDRANT_COLLECTION` | env_var  | Collection Name | No        |


### Airtable


| Key                   | Category | Name                  | Sensitive |
| --------------------- | -------- | --------------------- | --------- |
| `AIRTABLE_API_KEY`    | api_key  | Personal Access Token | Yes       |
| `AIRTABLE_BASE_ID`    | env_var  | Base ID               | No        |
| `AIRTABLE_TABLE_NAME` | env_var  | Table Name            | No        |


### Convex


| Key                      | Category | Name            | Sensitive |
| ------------------------ | -------- | --------------- | --------- |
| `CONVEX_DEPLOYMENT`      | env_var  | Deployment Name | No        |
| `NEXT_PUBLIC_CONVEX_URL` | env_var  | Convex URL      | No        |
| `CONVEX_DEPLOY_KEY`      | token    | Deploy Key      | Yes       |


### CockroachDB


| Key                 | Category | Name         | Sensitive |
| ------------------- | -------- | ------------ | --------- |
| `DATABASE_URL`      | env_var  | Database URL | Yes       |
| `COCKROACH_API_KEY` | api_key  | API Key      | Yes       |


### Fauna


| Key            | Category | Name            | Sensitive |
| -------------- | -------- | --------------- | --------- |
| `FAUNA_SECRET` | api_key  | Database Secret | Yes       |


### Xata


| Key              | Category | Name         | Sensitive |
| ---------------- | -------- | ------------ | --------- |
| `XATA_API_KEY`   | api_key  | API Key      | Yes       |
| `XATA_WORKSPACE` | env_var  | Workspace ID | No        |
| `XATA_BRANCH`    | env_var  | Branch       | No        |


### Redis / Redis Cloud


| Key              | Category | Name           | Sensitive |
| ---------------- | -------- | -------------- | --------- |
| `REDIS_URL`      | env_var  | Connection URL | Yes       |
| `REDIS_HOST`     | env_var  | Host           | No        |
| `REDIS_PORT`     | env_var  | Port           | No        |
| `REDIS_PASSWORD` | password | Password       | Yes       |


## Dev Tools

### GitHub


| Key                          | Category    | Name                    | Sensitive |
| ---------------------------- | ----------- | ----------------------- | --------- |
| `GITHUB_TOKEN`               | token       | Personal Access Token   | Yes       |
| `GITHUB_OAUTH_CLIENT_ID`     | api_key     | OAuth App Client ID     | No        |
| `GITHUB_OAUTH_CLIENT_SECRET` | api_key     | OAuth App Client Secret | Yes       |
| `GITHUB_APP_ID`              | env_var     | GitHub App ID           | No        |
| `GITHUB_APP_PRIVATE_KEY`     | certificate | GitHub App Private Key  | Yes       |
| `GITHUB_WEBHOOK_SECRET`      | token       | Webhook Secret          | Yes       |


### GitLab


| Key                     | Category | Name                            | Sensitive |
| ----------------------- | -------- | ------------------------------- | --------- |
| `GITLAB_TOKEN`          | token    | Personal / Project Access Token | Yes       |
| `GITLAB_WEBHOOK_SECRET` | token    | Webhook Secret Token            | Yes       |


### npm


| Key         | Category | Name         | Sensitive |
| ----------- | -------- | ------------ | --------- |
| `NPM_TOKEN` | token    | Access Token | Yes       |


### PyPI


| Key              | Category | Name      | Sensitive |
| ---------------- | -------- | --------- | --------- |
| `PYPI_API_TOKEN` | token    | API Token | Yes       |


### Sentry


| Key                 | Category | Name              | Sensitive |
| ------------------- | -------- | ----------------- | --------- |
| `SENTRY_DSN`        | env_var  | DSN               | No        |
| `SENTRY_AUTH_TOKEN` | token    | Auth Token        | Yes       |
| `SENTRY_ORG`        | env_var  | Organization Slug | No        |
| `SENTRY_PROJECT`    | env_var  | Project Slug      | No        |


### Datadog


| Key          | Category | Name            | Sensitive |
| ------------ | -------- | --------------- | --------- |
| `DD_API_KEY` | api_key  | API Key         | Yes       |
| `DD_APP_KEY` | api_key  | Application Key | Yes       |
| `DD_SITE`    | env_var  | Site            | No        |


### Linear


| Key                     | Category | Name                   | Sensitive |
| ----------------------- | -------- | ---------------------- | --------- |
| `LINEAR_API_KEY`        | api_key  | API Key                | Yes       |
| `LINEAR_WEBHOOK_SECRET` | token    | Webhook Signing Secret | Yes       |
| `LINEAR_TEAM_ID`        | env_var  | Team ID                | No        |


### Notion


| Key                  | Category | Name              | Sensitive |
| -------------------- | -------- | ----------------- | --------- |
| `NOTION_TOKEN`       | token    | Integration Token | Yes       |
| `NOTION_DATABASE_ID` | env_var  | Database ID       | No        |
| `NOTION_PAGE_ID`     | env_var  | Page ID           | No        |


### Figma


| Key                    | Category | Name                  | Sensitive |
| ---------------------- | -------- | --------------------- | --------- |
| `FIGMA_ACCESS_TOKEN`   | token    | Personal Access Token | Yes       |
| `FIGMA_WEBHOOK_SECRET` | token    | Webhook Secret        | Yes       |
| `FIGMA_FILE_KEY`       | env_var  | File Key              | No        |


### Jira / Atlassian


| Key                | Category | Name          | Sensitive |
| ------------------ | -------- | ------------- | --------- |
| `JIRA_API_TOKEN`   | token    | API Token     | Yes       |
| `JIRA_EMAIL`       | env_var  | Account Email | No        |
| `JIRA_HOST`        | env_var  | Jira Host URL | No        |
| `JIRA_PROJECT_KEY` | env_var  | Project Key   | No        |


### New Relic


| Key                     | Category | Name             | Sensitive |
| ----------------------- | -------- | ---------------- | --------- |
| `NEW_RELIC_LICENSE_KEY` | api_key  | License Key      | Yes       |
| `NEW_RELIC_APP_NAME`    | env_var  | Application Name | No        |
| `NEW_RELIC_ACCOUNT_ID`  | env_var  | Account ID       | No        |


### Grafana Cloud


| Key                      | Category | Name                        | Sensitive |
| ------------------------ | -------- | --------------------------- | --------- |
| `GRAFANA_API_KEY`        | api_key  | API Key                     | Yes       |
| `GRAFANA_URL`            | env_var  | Grafana URL                 | No        |
| `GRAFANA_PROMETHEUS_URL` | env_var  | Prometheus Remote Write URL | No        |


### PagerDuty


| Key                     | Category | Name                   | Sensitive |
| ----------------------- | -------- | ---------------------- | --------- |
| `PAGERDUTY_API_KEY`     | api_key  | API Key                | Yes       |
| `PAGERDUTY_ROUTING_KEY` | api_key  | Events API Routing Key | Yes       |


### Rollbar


| Key                    | Category | Name         | Sensitive |
| ---------------------- | -------- | ------------ | --------- |
| `ROLLBAR_ACCESS_TOKEN` | token    | Access Token | Yes       |
| `ROLLBAR_CLIENT_TOKEN` | token    | Client Token | Yes       |


## Deployment

### Vercel


| Key                 | Category | Name       | Sensitive |
| ------------------- | -------- | ---------- | --------- |
| `VERCEL_TOKEN`      | token    | API Token  | Yes       |
| `VERCEL_PROJECT_ID` | env_var  | Project ID | No        |
| `VERCEL_TEAM_ID`    | env_var  | Team ID    | No        |


### Cloudflare


| Key                               | Category | Name                 | Sensitive |
| --------------------------------- | -------- | -------------------- | --------- |
| `CLOUDFLARE_API_TOKEN`            | token    | API Token            | Yes       |
| `CLOUDFLARE_ZONE_ID`              | env_var  | Zone ID              | No        |
| `CLOUDFLARE_ACCOUNT_ID`           | env_var  | Account ID           | No        |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`     | api_key  | R2 Access Key ID     | No        |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | api_key  | R2 Secret Access Key | Yes       |
| `CLOUDFLARE_R2_BUCKET`            | env_var  | R2 Bucket Name       | No        |


### Railway


| Key             | Category | Name      | Sensitive |
| --------------- | -------- | --------- | --------- |
| `RAILWAY_TOKEN` | token    | API Token | Yes       |


### Netlify


| Key                  | Category | Name                  | Sensitive |
| -------------------- | -------- | --------------------- | --------- |
| `NETLIFY_AUTH_TOKEN` | token    | Personal Access Token | Yes       |
| `NETLIFY_SITE_ID`    | env_var  | Site ID               | No        |


### Fly.io


| Key             | Category | Name           | Sensitive |
| --------------- | -------- | -------------- | --------- |
| `FLY_API_TOKEN` | token    | API Token      | Yes       |
| `FLY_APP_NAME`  | env_var  | App Name       | No        |
| `FLY_REGION`    | env_var  | Primary Region | No        |


### Render


| Key                 | Category | Name       | Sensitive |
| ------------------- | -------- | ---------- | --------- |
| `RENDER_API_KEY`    | api_key  | API Key    | Yes       |
| `RENDER_SERVICE_ID` | env_var  | Service ID | No        |


### Heroku


| Key               | Category | Name     | Sensitive |
| ----------------- | -------- | -------- | --------- |
| `HEROKU_API_KEY`  | api_key  | API Key  | Yes       |
| `HEROKU_APP_NAME` | env_var  | App Name | No        |


### Deno Deploy


| Key                 | Category | Name         | Sensitive |
| ------------------- | -------- | ------------ | --------- |
| `DENO_DEPLOY_TOKEN` | token    | Deploy Token | Yes       |


## Payments

### Stripe


| Key                           | Category | Name                   | Sensitive |
| ----------------------------- | -------- | ---------------------- | --------- |
| `STRIPE_SECRET_KEY`           | api_key  | Secret Key (Live)      | Yes       |
| `STRIPE_PUBLISHABLE_KEY`      | api_key  | Publishable Key (Live) | No        |
| `STRIPE_WEBHOOK_SECRET`       | token    | Webhook Signing Secret | Yes       |
| `STRIPE_SECRET_KEY_TEST`      | api_key  | Secret Key (Test)      | Yes       |
| `STRIPE_PUBLISHABLE_KEY_TEST` | api_key  | Publishable Key (Test) | No        |
| `STRIPE_PRICE_ID`             | env_var  | Price ID               | No        |


### PayPal


| Key                    | Category | Name          | Sensitive |
| ---------------------- | -------- | ------------- | --------- |
| `PAYPAL_CLIENT_ID`     | api_key  | Client ID     | No        |
| `PAYPAL_CLIENT_SECRET` | api_key  | Client Secret | Yes       |
| `PAYPAL_WEBHOOK_ID`    | env_var  | Webhook ID    | No        |
| `PAYPAL_ENVIRONMENT`   | env_var  | Environment   | No        |


### Lemon Squeezy


| Key                           | Category | Name                   | Sensitive |
| ----------------------------- | -------- | ---------------------- | --------- |
| `LEMONSQUEEZY_API_KEY`        | api_key  | API Key                | Yes       |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | token    | Webhook Signing Secret | Yes       |
| `LEMONSQUEEZY_STORE_ID`       | env_var  | Store ID               | No        |


### RevenueCat


| Key                         | Category | Name           | Sensitive |
| --------------------------- | -------- | -------------- | --------- |
| `REVENUECAT_PUBLIC_SDK_KEY` | api_key  | Public SDK Key | No        |
| `REVENUECAT_SECRET_API_KEY` | api_key  | Secret API Key | Yes       |


### Paddle


| Key                     | Category | Name           | Sensitive |
| ----------------------- | -------- | -------------- | --------- |
| `PADDLE_API_KEY`        | api_key  | API Key        | Yes       |
| `PADDLE_WEBHOOK_SECRET` | token    | Webhook Secret | Yes       |
| `PADDLE_VENDOR_ID`      | env_var  | Vendor ID      | No        |


### Square


| Key                            | Category | Name                  | Sensitive |
| ------------------------------ | -------- | --------------------- | --------- |
| `SQUARE_ACCESS_TOKEN`          | token    | Access Token          | Yes       |
| `SQUARE_APPLICATION_ID`        | api_key  | Application ID        | No        |
| `SQUARE_LOCATION_ID`           | env_var  | Location ID           | No        |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | api_key  | Webhook Signature Key | Yes       |


### Adyen


| Key                      | Category | Name             | Sensitive |
| ------------------------ | -------- | ---------------- | --------- |
| `ADYEN_API_KEY`          | api_key  | API Key          | Yes       |
| `ADYEN_MERCHANT_ACCOUNT` | env_var  | Merchant Account | No        |
| `ADYEN_WEBHOOK_HMAC_KEY` | api_key  | Webhook HMAC Key | Yes       |


### Plaid


| Key               | Category | Name        | Sensitive |
| ----------------- | -------- | ----------- | --------- |
| `PLAID_CLIENT_ID` | api_key  | Client ID   | No        |
| `PLAID_SECRET`    | api_key  | Secret Key  | Yes       |
| `PLAID_ENV`       | env_var  | Environment | No        |


## Communication

### Slack


| Key                    | Category | Name                 | Sensitive |
| ---------------------- | -------- | -------------------- | --------- |
| `SLACK_BOT_TOKEN`      | token    | Bot Token            | Yes       |
| `SLACK_SIGNING_SECRET` | api_key  | Signing Secret       | Yes       |
| `SLACK_WEBHOOK_URL`    | env_var  | Incoming Webhook URL | Yes       |
| `SLACK_APP_TOKEN`      | token    | App-Level Token      | Yes       |


### Discord


| Key                     | Category | Name                      | Sensitive |
| ----------------------- | -------- | ------------------------- | --------- |
| `DISCORD_BOT_TOKEN`     | token    | Bot Token                 | Yes       |
| `DISCORD_CLIENT_ID`     | api_key  | Application Client ID     | No        |
| `DISCORD_CLIENT_SECRET` | api_key  | Application Client Secret | Yes       |
| `DISCORD_WEBHOOK_URL`   | env_var  | Webhook URL               | Yes       |
| `DISCORD_GUILD_ID`      | env_var  | Server (Guild) ID         | No        |
| `DISCORD_PUBLIC_KEY`    | api_key  | Application Public Key    | No        |


### Twilio


| Key                   | Category | Name           | Sensitive |
| --------------------- | -------- | -------------- | --------- |
| `TWILIO_ACCOUNT_SID`  | api_key  | Account SID    | No        |
| `TWILIO_AUTH_TOKEN`   | token    | Auth Token     | Yes       |
| `TWILIO_PHONE_NUMBER` | env_var  | Phone Number   | No        |
| `TWILIO_API_KEY`      | api_key  | API Key SID    | No        |
| `TWILIO_API_SECRET`   | api_key  | API Key Secret | Yes       |


### SendGrid


| Key                   | Category | Name       | Sensitive |
| --------------------- | -------- | ---------- | --------- |
| `SENDGRID_API_KEY`    | api_key  | API Key    | Yes       |
| `SENDGRID_FROM_EMAIL` | env_var  | From Email | No        |


### Resend


| Key                  | Category | Name        | Sensitive |
| -------------------- | -------- | ----------- | --------- |
| `RESEND_API_KEY`     | api_key  | API Key     | Yes       |
| `RESEND_FROM_EMAIL`  | env_var  | From Email  | No        |
| `RESEND_AUDIENCE_ID` | env_var  | Audience ID | No        |


### Postmark


| Key                      | Category | Name              | Sensitive |
| ------------------------ | -------- | ----------------- | --------- |
| `POSTMARK_SERVER_TOKEN`  | token    | Server API Token  | Yes       |
| `POSTMARK_ACCOUNT_TOKEN` | token    | Account API Token | Yes       |


### Mailgun


| Key                           | Category | Name                | Sensitive |
| ----------------------------- | -------- | ------------------- | --------- |
| `MAILGUN_API_KEY`             | api_key  | Private API Key     | Yes       |
| `MAILGUN_DOMAIN`              | env_var  | Sending Domain      | No        |
| `MAILGUN_WEBHOOK_SIGNING_KEY` | api_key  | Webhook Signing Key | Yes       |


### Vonage / Nexmo


| Key                       | Category | Name             | Sensitive |
| ------------------------- | -------- | ---------------- | --------- |
| `VONAGE_API_KEY`          | api_key  | API Key          | No        |
| `VONAGE_API_SECRET`       | api_key  | API Secret       | Yes       |
| `VONAGE_APPLICATION_ID`   | env_var  | Application ID   | No        |
| `VONAGE_PRIVATE_KEY_PATH` | env_var  | Private Key Path | No        |


### Pusher


| Key              | Category | Name       | Sensitive |
| ---------------- | -------- | ---------- | --------- |
| `PUSHER_APP_ID`  | env_var  | App ID     | No        |
| `PUSHER_KEY`     | api_key  | App Key    | No        |
| `PUSHER_SECRET`  | api_key  | App Secret | Yes       |
| `PUSHER_CLUSTER` | env_var  | Cluster    | No        |


### Ably


| Key            | Category | Name    | Sensitive |
| -------------- | -------- | ------- | --------- |
| `ABLY_API_KEY` | api_key  | API Key | Yes       |


### Intercom


| Key                     | Category | Name                        | Sensitive |
| ----------------------- | -------- | --------------------------- | --------- |
| `INTERCOM_ACCESS_TOKEN` | token    | Access Token                | Yes       |
| `INTERCOM_SECRET_KEY`   | api_key  | Client Secret / Signing Key | Yes       |


### Zendesk


| Key                 | Category | Name        | Sensitive |
| ------------------- | -------- | ----------- | --------- |
| `ZENDESK_SUBDOMAIN` | env_var  | Subdomain   | No        |
| `ZENDESK_EMAIL`     | env_var  | Agent Email | No        |
| `ZENDESK_API_TOKEN` | token    | API Token   | Yes       |


## Mobile

### Apple Developer


| Key                              | Category    | Name                           | Sensitive |
| -------------------------------- | ----------- | ------------------------------ | --------- |
| `APPLE_TEAM_ID`                  | env_var     | Team ID                        | No        |
| `APPLE_BUNDLE_ID`                | env_var     | Bundle ID                      | No        |
| `APNS_KEY_ID`                    | env_var     | APNs Key ID                    | No        |
| `APNS_AUTH_KEY`                  | certificate | APNs Auth Key (.p8)            | Yes       |
| `APP_STORE_CONNECT_KEY_ID`       | env_var     | App Store Connect API Key ID   | No        |
| `APP_STORE_CONNECT_ISSUER_ID`    | env_var     | Issuer ID                      | No        |
| `APP_STORE_CONNECT_PRIVATE_KEY`  | certificate | App Store Connect Private Key  | Yes       |
| `APPLE_IAP_SHARED_SECRET`        | api_key     | In-App Purchase Shared Secret  | Yes       |
| `SIGN_IN_WITH_APPLE_KEY_ID`      | env_var     | Sign in with Apple Key ID      | No        |
| `SIGN_IN_WITH_APPLE_PRIVATE_KEY` | certificate | Sign in with Apple Private Key | Yes       |


### Google / Firebase


| Key                             | Category    | Name                          | Sensitive |
| ------------------------------- | ----------- | ----------------------------- | --------- |
| `FIREBASE_PROJECT_ID`           | env_var     | Firebase Project ID           | No        |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | certificate | Firebase Service Account JSON | Yes       |
| `FIREBASE_API_KEY`              | api_key     | Firebase API Key              | No        |
| `FIREBASE_AUTH_DOMAIN`          | env_var     | Firebase Auth Domain          | No        |
| `FIREBASE_STORAGE_BUCKET`       | env_var     | Firebase Storage Bucket       | No        |
| `FIREBASE_MESSAGING_SENDER_ID`  | env_var     | Messaging Sender ID           | No        |
| `FIREBASE_APP_ID`               | env_var     | Firebase App ID               | No        |
| `ANDROID_KEYSTORE_PASSWORD`     | password    | Android Keystore Password     | Yes       |
| `ANDROID_KEY_ALIAS`             | env_var     | Android Key Alias             | No        |


### Expo / EAS


| Key                   | Category | Name                  | Sensitive |
| --------------------- | -------- | --------------------- | --------- |
| `EXPO_TOKEN`          | token    | Access Token          | Yes       |
| `EXPO_PUBLIC_API_URL` | env_var  | API Base URL (Public) | No        |
| `EAS_PROJECT_ID`      | env_var  | EAS Project ID        | No        |


### OneSignal


| Key                      | Category | Name         | Sensitive |
| ------------------------ | -------- | ------------ | --------- |
| `ONESIGNAL_APP_ID`       | api_key  | App ID       | No        |
| `ONESIGNAL_REST_API_KEY` | api_key  | REST API Key | Yes       |


### AppsFlyer


| Key                 | Category | Name    | Sensitive |
| ------------------- | -------- | ------- | --------- |
| `APPSFLYER_DEV_KEY` | api_key  | Dev Key | Yes       |
| `APPSFLYER_APP_ID`  | env_var  | App ID  | No        |


### Branch.io


| Key             | Category | Name          | Sensitive |
| --------------- | -------- | ------------- | --------- |
| `BRANCH_KEY`    | api_key  | Branch Key    | No        |
| `BRANCH_SECRET` | api_key  | Branch Secret | Yes       |


## Auth & Identity

### Auth0


| Key                          | Category | Name                 | Sensitive |
| ---------------------------- | -------- | -------------------- | --------- |
| `AUTH0_DOMAIN`               | env_var  | Domain               | No        |
| `AUTH0_CLIENT_ID`            | api_key  | Client ID            | No        |
| `AUTH0_CLIENT_SECRET`        | api_key  | Client Secret        | Yes       |
| `AUTH0_MANAGEMENT_API_TOKEN` | token    | Management API Token | Yes       |
| `AUTH0_AUDIENCE`             | env_var  | API Audience         | No        |


### Clerk


| Key                                 | Category | Name                   | Sensitive |
| ----------------------------------- | -------- | ---------------------- | --------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | api_key  | Publishable Key        | No        |
| `CLERK_SECRET_KEY`                  | api_key  | Secret Key             | Yes       |
| `CLERK_WEBHOOK_SECRET`              | token    | Webhook Signing Secret | Yes       |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | env_var  | Sign-In URL            | No        |


### NextAuth.js / Auth.js


| Key               | Category | Name            | Sensitive |
| ----------------- | -------- | --------------- | --------- |
| `NEXTAUTH_SECRET` | token    | NextAuth Secret | Yes       |
| `NEXTAUTH_URL`    | env_var  | NextAuth URL    | No        |
| `AUTH_TRUST_HOST` | env_var  | Trust Host      | No        |


### Okta


| Key                  | Category | Name          | Sensitive |
| -------------------- | -------- | ------------- | --------- |
| `OKTA_DOMAIN`        | env_var  | Okta Domain   | No        |
| `OKTA_CLIENT_ID`     | api_key  | Client ID     | No        |
| `OKTA_CLIENT_SECRET` | api_key  | Client Secret | Yes       |
| `OKTA_API_TOKEN`     | token    | API Token     | Yes       |


### Stytch


| Key                               | Category | Name           | Sensitive |
| --------------------------------- | -------- | -------------- | --------- |
| `STYTCH_PROJECT_ID`               | env_var  | Project ID     | No        |
| `STYTCH_SECRET`                   | api_key  | Project Secret | Yes       |
| `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` | token    | Public Token   | No        |


### Kinde


| Key                   | Category | Name          | Sensitive |
| --------------------- | -------- | ------------- | --------- |
| `KINDE_DOMAIN`        | env_var  | Domain        | No        |
| `KINDE_CLIENT_ID`     | api_key  | Client ID     | No        |
| `KINDE_CLIENT_SECRET` | api_key  | Client Secret | Yes       |
| `KINDE_ISSUER_URL`    | env_var  | Issuer URL    | No        |


### WorkOS


| Key                     | Category | Name           | Sensitive |
| ----------------------- | -------- | -------------- | --------- |
| `WORKOS_API_KEY`        | api_key  | API Key        | Yes       |
| `WORKOS_CLIENT_ID`      | env_var  | Client ID      | No        |
| `WORKOS_WEBHOOK_SECRET` | token    | Webhook Secret | Yes       |


## Analytics

### Mixpanel


| Key               | Category | Name           | Sensitive |
| ----------------- | -------- | -------------- | --------- |
| `MIXPANEL_TOKEN`  | token    | Project Token  | No        |
| `MIXPANEL_SECRET` | api_key  | Project Secret | Yes       |


### PostHog


| Key                        | Category | Name             | Sensitive |
| -------------------------- | -------- | ---------------- | --------- |
| `NEXT_PUBLIC_POSTHOG_KEY`  | api_key  | Project API Key  | No        |
| `NEXT_PUBLIC_POSTHOG_HOST` | env_var  | API Host         | No        |
| `POSTHOG_PERSONAL_API_KEY` | api_key  | Personal API Key | Yes       |


### Amplitude


| Key                    | Category | Name       | Sensitive |
| ---------------------- | -------- | ---------- | --------- |
| `AMPLITUDE_API_KEY`    | api_key  | API Key    | No        |
| `AMPLITUDE_SECRET_KEY` | api_key  | Secret Key | Yes       |


### Segment


| Key                 | Category | Name      | Sensitive |
| ------------------- | -------- | --------- | --------- |
| `SEGMENT_WRITE_KEY` | api_key  | Write Key | No        |
| `SEGMENT_API_KEY`   | api_key  | API Key   | Yes       |


### Google Analytics


| Key                             | Category | Name           | Sensitive |
| ------------------------------- | -------- | -------------- | --------- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | env_var  | Measurement ID | No        |
| `GOOGLE_ANALYTICS_PROPERTY_ID`  | env_var  | Property ID    | No        |


### Hotjar


| Key                     | Category | Name    | Sensitive |
| ----------------------- | -------- | ------- | --------- |
| `NEXT_PUBLIC_HOTJAR_ID` | env_var  | Site ID | No        |


### Plausible Analytics


| Key                            | Category | Name        | Sensitive |
| ------------------------------ | -------- | ----------- | --------- |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | env_var  | Site Domain | No        |
| `PLAUSIBLE_API_KEY`            | api_key  | API Key     | Yes       |


### Fathom Analytics


| Key                          | Category | Name    | Sensitive |
| ---------------------------- | -------- | ------- | --------- |
| `NEXT_PUBLIC_FATHOM_SITE_ID` | env_var  | Site ID | No        |
| `FATHOM_API_KEY`             | api_key  | API Key | Yes       |


### LogRocket


| Key                            | Category | Name   | Sensitive |
| ------------------------------ | -------- | ------ | --------- |
| `NEXT_PUBLIC_LOGROCKET_APP_ID` | env_var  | App ID | No        |


## Storage & CDN

### Cloudinary


| Key                                 | Category | Name           | Sensitive |
| ----------------------------------- | -------- | -------------- | --------- |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | env_var  | Cloud Name     | No        |
| `CLOUDINARY_API_KEY`                | api_key  | API Key        | No        |
| `CLOUDINARY_API_SECRET`             | api_key  | API Secret     | Yes       |
| `CLOUDINARY_URL`                    | env_var  | Cloudinary URL | Yes       |


### Backblaze B2


| Key                     | Category | Name               | Sensitive |
| ----------------------- | -------- | ------------------ | --------- |
| `B2_APPLICATION_KEY_ID` | api_key  | Application Key ID | No        |
| `B2_APPLICATION_KEY`    | api_key  | Application Key    | Yes       |
| `B2_BUCKET_NAME`        | env_var  | Bucket Name        | No        |
| `B2_ENDPOINT`           | env_var  | Endpoint           | No        |


### Bunny.net


| Key                        | Category | Name                    | Sensitive |
| -------------------------- | -------- | ----------------------- | --------- |
| `BUNNY_API_KEY`            | api_key  | API Key                 | Yes       |
| `BUNNY_STORAGE_ZONE_NAME`  | env_var  | Storage Zone Name       | No        |
| `BUNNY_STORAGE_ACCESS_KEY` | api_key  | Storage Zone Access Key | Yes       |


### ImageKit


| Key                     | Category | Name         | Sensitive |
| ----------------------- | -------- | ------------ | --------- |
| `IMAGEKIT_PUBLIC_KEY`   | api_key  | Public Key   | No        |
| `IMAGEKIT_PRIVATE_KEY`  | api_key  | Private Key  | Yes       |
| `IMAGEKIT_URL_ENDPOINT` | env_var  | URL Endpoint | No        |


### UploadThing


| Key                 | Category | Name  | Sensitive |
| ------------------- | -------- | ----- | --------- |
| `UPLOADTHING_TOKEN` | token    | Token | Yes       |


### S3-Compatible Storage


| Key                    | Category | Name              | Sensitive |
| ---------------------- | -------- | ----------------- | --------- |
| `S3_ACCESS_KEY_ID`     | api_key  | Access Key ID     | No        |
| `S3_SECRET_ACCESS_KEY` | api_key  | Secret Access Key | Yes       |
| `S3_REGION`            | env_var  | Region            | No        |
| `S3_BUCKET`            | env_var  | Bucket Name       | No        |
| `S3_ENDPOINT`          | env_var  | Endpoint          | No        |


## Search

### Algolia


| Key                                  | Category | Name           | Sensitive |
| ------------------------------------ | -------- | -------------- | --------- |
| `ALGOLIA_APP_ID`                     | env_var  | Application ID | No        |
| `ALGOLIA_ADMIN_API_KEY`              | api_key  | Admin API Key  | Yes       |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY` | api_key  | Search API Key | No        |
| `ALGOLIA_INDEX_NAME`                 | env_var  | Index Name     | No        |


### Typesense


| Key                             | Category | Name                | Sensitive |
| ------------------------------- | -------- | ------------------- | --------- |
| `TYPESENSE_API_KEY`             | api_key  | Admin API Key       | Yes       |
| `TYPESENSE_HOST`                | env_var  | Host                | No        |
| `TYPESENSE_PORT`                | env_var  | Port                | No        |
| `TYPESENSE_SEARCH_ONLY_API_KEY` | api_key  | Search-Only API Key | No        |


### Meilisearch


| Key                      | Category | Name           | Sensitive |
| ------------------------ | -------- | -------------- | --------- |
| `MEILISEARCH_HOST`       | env_var  | Host URL       | No        |
| `MEILISEARCH_MASTER_KEY` | api_key  | Master Key     | Yes       |
| `MEILISEARCH_SEARCH_KEY` | api_key  | Search API Key | No        |


### Elasticsearch


| Key                      | Category | Name         | Sensitive |
| ------------------------ | -------- | ------------ | --------- |
| `ELASTICSEARCH_URL`      | env_var  | Endpoint URL | No        |
| `ELASTIC_API_KEY`        | api_key  | API Key      | Yes       |
| `ELASTICSEARCH_USERNAME` | env_var  | Username     | No        |
| `ELASTICSEARCH_PASSWORD` | password | Password     | Yes       |


## CMS & Commerce

### Contentful


| Key                           | Category | Name                 | Sensitive |
| ----------------------------- | -------- | -------------------- | --------- |
| `CONTENTFUL_SPACE_ID`         | env_var  | Space ID             | No        |
| `CONTENTFUL_ACCESS_TOKEN`     | token    | Delivery API Token   | No        |
| `CONTENTFUL_PREVIEW_TOKEN`    | token    | Preview API Token    | No        |
| `CONTENTFUL_MANAGEMENT_TOKEN` | token    | Management API Token | Yes       |
| `CONTENTFUL_ENVIRONMENT`      | env_var  | Environment          | No        |


### Sanity


| Key                             | Category | Name           | Sensitive |
| ------------------------------- | -------- | -------------- | --------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | env_var  | Project ID     | No        |
| `NEXT_PUBLIC_SANITY_DATASET`    | env_var  | Dataset        | No        |
| `SANITY_API_TOKEN`              | token    | API Token      | Yes       |
| `SANITY_WEBHOOK_SECRET`         | token    | Webhook Secret | Yes       |


### Shopify


| Key                               | Category | Name                   | Sensitive |
| --------------------------------- | -------- | ---------------------- | --------- |
| `SHOPIFY_STORE_DOMAIN`            | env_var  | Store Domain           | No        |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | token    | Storefront API Token   | No        |
| `SHOPIFY_ADMIN_API_ACCESS_TOKEN`  | token    | Admin API Access Token | Yes       |
| `SHOPIFY_WEBHOOK_SECRET`          | token    | Webhook Secret         | Yes       |
| `SHOPIFY_API_KEY`                 | api_key  | API Key                | No        |
| `SHOPIFY_API_SECRET`              | api_key  | API Secret             | Yes       |


### Strapi


| Key                 | Category | Name       | Sensitive |
| ------------------- | -------- | ---------- | --------- |
| `STRAPI_URL`        | env_var  | API URL    | No        |
| `STRAPI_API_TOKEN`  | token    | API Token  | Yes       |
| `STRAPI_JWT_SECRET` | api_key  | JWT Secret | Yes       |


### Prismic


| Key                       | Category | Name            | Sensitive |
| ------------------------- | -------- | --------------- | --------- |
| `PRISMIC_REPOSITORY_NAME` | env_var  | Repository Name | No        |
| `PRISMIC_ACCESS_TOKEN`    | token    | Access Token    | Yes       |
| `PRISMIC_WEBHOOK_SECRET`  | token    | Webhook Secret  | Yes       |


### WordPress


| Key                | Category | Name                 | Sensitive |
| ------------------ | -------- | -------------------- | --------- |
| `WP_API_URL`       | env_var  | REST API URL         | No        |
| `WP_AUTH_USER`     | env_var  | Username             | No        |
| `WP_AUTH_PASSWORD` | password | Application Password | Yes       |


## Social & OAuth

### X / Twitter


| Key                     | Category | Name                         | Sensitive |
| ----------------------- | -------- | ---------------------------- | --------- |
| `TWITTER_API_KEY`       | api_key  | API Key (Consumer Key)       | No        |
| `TWITTER_API_SECRET`    | api_key  | API Secret (Consumer Secret) | Yes       |
| `TWITTER_BEARER_TOKEN`  | token    | Bearer Token                 | Yes       |
| `TWITTER_ACCESS_TOKEN`  | token    | Access Token                 | Yes       |
| `TWITTER_ACCESS_SECRET` | token    | Access Token Secret          | Yes       |
| `TWITTER_CLIENT_ID`     | api_key  | OAuth 2.0 Client ID          | No        |
| `TWITTER_CLIENT_SECRET` | api_key  | OAuth 2.0 Client Secret      | Yes       |


### Meta / Facebook


| Key                             | Category | Name                 | Sensitive |
| ------------------------------- | -------- | -------------------- | --------- |
| `FACEBOOK_APP_ID`               | api_key  | App ID               | No        |
| `FACEBOOK_APP_SECRET`           | api_key  | App Secret           | Yes       |
| `META_ACCESS_TOKEN`             | token    | User Access Token    | Yes       |
| `FACEBOOK_PIXEL_ID`             | env_var  | Pixel ID             | No        |
| `FACEBOOK_WEBHOOK_VERIFY_TOKEN` | token    | Webhook Verify Token | Yes       |


### LinkedIn


| Key                      | Category | Name          | Sensitive |
| ------------------------ | -------- | ------------- | --------- |
| `LINKEDIN_CLIENT_ID`     | api_key  | Client ID     | No        |
| `LINKEDIN_CLIENT_SECRET` | api_key  | Client Secret | Yes       |
| `LINKEDIN_ACCESS_TOKEN`  | token    | Access Token  | Yes       |


### TikTok


| Key                    | Category | Name          | Sensitive |
| ---------------------- | -------- | ------------- | --------- |
| `TIKTOK_CLIENT_KEY`    | api_key  | Client Key    | No        |
| `TIKTOK_CLIENT_SECRET` | api_key  | Client Secret | Yes       |
| `TIKTOK_ACCESS_TOKEN`  | token    | Access Token  | Yes       |


## Maps & Location

### Google Maps


| Key                       | Category | Name                 | Sensitive |
| ------------------------- | -------- | -------------------- | --------- |
| `GOOGLE_MAPS_API_KEY`     | api_key  | Maps API Key         | Yes       |
| `GOOGLE_MAPS_ANDROID_KEY` | api_key  | Maps Android API Key | Yes       |
| `GOOGLE_MAPS_IOS_KEY`     | api_key  | Maps iOS API Key     | Yes       |


### Mapbox


| Key                   | Category | Name                | Sensitive |
| --------------------- | -------- | ------------------- | --------- |
| `MAPBOX_PUBLIC_TOKEN` | token    | Public Access Token | No        |
| `MAPBOX_SECRET_TOKEN` | token    | Secret Access Token | Yes       |


### HERE Maps


| Key            | Category | Name    | Sensitive |
| -------------- | -------- | ------- | --------- |
| `HERE_API_KEY` | api_key  | API Key | Yes       |


### OpenWeatherMap


| Key                   | Category | Name    | Sensitive |
| --------------------- | -------- | ------- | --------- |
| `OPENWEATHER_API_KEY` | api_key  | API Key | Yes       |


### TomTom


| Key              | Category | Name    | Sensitive |
| ---------------- | -------- | ------- | --------- |
| `TOMTOM_API_KEY` | api_key  | API Key | Yes       |


