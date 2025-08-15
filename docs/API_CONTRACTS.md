# API Contracts Documentation

This document outlines the API contracts for all Edge Functions and their relationships with the frontend components.

## Authentication

All Edge Functions require authentication unless explicitly marked as public. Authentication is handled via the `Authorization` header with a Bearer token:

```
Authorization: Bearer <supabase_access_token>
```

## Edge Functions

### 1. KYC Verification (`/functions/kyc-verification`)

**Purpose**: Handles KYC document verification workflow

**Related Components**: 
- `src/pages/KycCenter.tsx`
- `src/hooks/use-file-upload.ts`

**Endpoints**:

#### Submit Verification
```typescript
POST /functions/kyc-verification
{
  "action": "submit_verification",
  "documentPaths": string[],
  "riskScore": number,
  "verificationNotes": string
}

Response:
{
  "success": boolean,
  "verification_id": string,
  "status": "pending" | "approved" | "rejected",
  "message": string
}
```

#### Get Verification Status
```typescript
POST /functions/kyc-verification
{
  "action": "get_status"
}

Response:
{
  "success": boolean,
  "verification": KycVerification | null,
  "status": "not_started" | "pending" | "approved" | "rejected"
}
```

#### Admin Actions (Approve/Reject)
```typescript
POST /functions/kyc-verification
{
  "action": "approve" | "reject",
  "user_id": string,
  "reason": string
}

Response:
{
  "success": boolean,
  "status": "approved" | "rejected",
  "message": string
}
```

### 2. Market Data Scheduler (`/functions/market-data-scheduler`)

**Purpose**: Updates market data for tokenized assets

**Related Components**: 
- `src/pages/TokenomicsPage.tsx`
- `src/hooks/useTokenomicsData.ts`
- `src/components/TokenomicsCharts.tsx`

**Endpoint**:
```typescript
POST /functions/market-data-scheduler

Response:
{
  "success": boolean,
  "updated_assets": number,
  "message": string
}
```

### 3. Update User Profile (`/functions/update-user-profile`)

**Purpose**: Updates user profile with encrypted 2FA data

**Related Components**: 
- `src/components/TwoFactorManager.tsx`
- `src/contexts/AuthContext.tsx`

**Endpoint**:
```typescript
POST /functions/update-user-profile
{
  "display_name": string,
  "bio": string,
  "avatar_url": string,
  "mfa_secret": string (encrypted),
  "backup_codes": string[] (encrypted),
  "totp_enabled": boolean
}

Response:
{
  "success": boolean,
  "profile": UserProfile,
  "message": string
}
```

### 4. Scrape Website (`/functions/scrape-website`)

**Purpose**: Securely scrapes website content with authentication

**Related Components**: 
- Various components that need external data

**Endpoint**:
```typescript
POST /functions/scrape-website
{
  "url": string,
  "options": {
    "extract_text": boolean,
    "extract_links": boolean,
    "max_pages": number
  }
}

Response:
{
  "success": boolean,
  "data": {
    "url": string,
    "title": string,
    "content": string,
    "links": string[]
  },
  "message": string
}
```

### 5. Tokenize Asset (`/functions/tokenize-asset`)

**Purpose**: Creates new tokenized assets on the blockchain

**Related Components**: 
- `src/pages/Tokenize.tsx`
- Asset creation forms

**Endpoint**:
```typescript
POST /functions/tokenize-asset
{
  "asset_name": string,
  "asset_symbol": string,
  "total_supply": number,
  "description": string,
  "metadata": object,
  "compliance_data": object
}

Response:
{
  "success": boolean,
  "asset_id": string,
  "transaction_hash": string,
  "xrpl_currency_code": string,
  "message": string
}
```

### 6. XRPL Transaction (`/functions/xrpl-transaction`)

**Purpose**: Handles XRPL blockchain transactions

**Related Components**: 
- Trading components
- Wallet integration

**Endpoint**:
```typescript
POST /functions/xrpl-transaction
{
  "transaction_type": "payment" | "escrow" | "token_create",
  "amount": string,
  "destination": string,
  "currency_code": string,
  "memo": string
}

Response:
{
  "success": boolean,
  "transaction_hash": string,
  "ledger_index": number,
  "message": string
}
```

### 7. Deploy Contract (`/functions/deploy-contract`)

**Purpose**: Deploys smart contracts with templates

**Related Components**: 
- `src/pages/SmartContracts.tsx`
- Contract deployment forms

**Endpoint**:
```typescript
POST /functions/deploy-contract
{
  "template_name": string,
  "parameters": object,
  "metadata": object
}

Response:
{
  "success": boolean,
  "contract_address": string,
  "transaction_hash": string,
  "deployment_data": object,
  "message": string
}
```

### 8. Execute AI Agent (`/functions/execute-ai-agent`)

**Purpose**: Executes AI agent workflows

**Related Components**: 
- `src/pages/AIAgents.tsx`
- AI agent components

**Endpoint**:
```typescript
POST /functions/execute-ai-agent
{
  "agent_id": string,
  "workflow_data": object,
  "input_data": object
}

Response:
{
  "success": boolean,
  "execution_id": string,
  "result": object,
  "message": string
}
```

## Database Tables Integration

### Key Tables and Their API Relationships:

1. **`profiles`** - User profile management
   - Updated by: `update-user-profile`, `kyc-verification`
   - Read by: Authentication context, profile components

2. **`kyc_verification`** - KYC document verification
   - Updated by: `kyc-verification`
   - Read by: `KycCenter.tsx`

3. **`tokenized_assets`** - Asset tokenization
   - Updated by: `tokenize-asset`
   - Read by: Tokenomics dashboard, trading components

4. **`market_data`** - Real-time market information
   - Updated by: `market-data-scheduler`
   - Read by: `useTokenomicsData`, `TradingChart`

5. **`trade_executions`** - Trading transaction records
   - Updated by: Trading edge functions
   - Read by: Tokenomics analytics, trading history

## Security Considerations

1. **Rate Limiting**: All functions implement rate limiting to prevent abuse
2. **CORS**: Restricted to allowed origins via centralized CORS helper
3. **Authentication**: JWT validation on all protected endpoints
4. **Encryption**: Sensitive data (MFA secrets, backup codes) encrypted with AES-GCM
5. **Input Validation**: All inputs validated and sanitized
6. **Audit Logging**: Security events logged to `security_events` table

## Error Handling

All Edge Functions follow a consistent error response format:

```typescript
{
  "success": false,
  "error": string,
  "code": string (optional),
  "details": object (optional)
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Testing

Each Edge Function has corresponding tests in `tests/edge-functions.test.ts`. Tests cover:
- Authentication requirements
- Input validation
- Success scenarios
- Error handling
- Rate limiting
- CORS functionality

## Development Setup

1. Environment variables must be configured in `.env`
2. Supabase secrets must be added for external API integrations
3. Database migrations must be applied for schema changes
4. Edge Functions are automatically deployed with code changes