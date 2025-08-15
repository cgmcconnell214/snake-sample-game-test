# API Endpoints Documentation

This document outlines the authorization requirements for all Edge Functions in the system.

## Authentication & Authorization

All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header unless otherwise specified.

### Role Hierarchy
- `basic`: Basic user access
- `premium`: Premium user access (includes basic permissions)  
- `admin`: Administrative access (includes all permissions)

### Subscription Tiers
- `free`: Free tier (limited functionality)
- `standard`: Standard subscription
- `enterprise`: Enterprise subscription (includes all features)

## Endpoints

### Certification Management

#### `POST /functions/v1/generate-certification-code`
**Required Tier**: `standard`  
**Description**: Generates a secure verification code for earned certifications  
**Returns**: 403 if user doesn't have standard+ subscription

#### `POST /functions/v1/reveal-verification-code`
**Required Tier**: `standard`  
**Description**: Reveals a previously generated certification code (limited displays)  
**Returns**: 403 if user doesn't have standard+ subscription

### Trading & Orders

#### `POST /functions/v1/create-order`
**Required Tier**: `standard`  
**Description**: Creates trading orders in the marketplace  
**Returns**: 403 if user doesn't have standard+ subscription

### Administrative

#### `POST /functions/v1/deploy-contract`
**Required Role**: `admin`  
**Description**: Deploys smart contracts to the blockchain  
**Returns**: 403 if user doesn't have admin role

### Payment & Subscriptions

#### `POST /functions/v1/create-checkout`
**Required Tier**: `free`+ (authenticated users)  
**Description**: Creates Stripe checkout sessions for subscriptions

#### `POST /functions/v1/check-subscription`
**Required Tier**: `free`+ (authenticated users)  
**Description**: Validates current subscription status

### User Management

#### `POST /functions/v1/update-user-profile`
**Required Tier**: `free`+ (authenticated users)  
**Description**: Updates user profile information with validation

### Data & Sync

#### `POST /functions/v1/trigger-sync`
**Required Role**: `admin`  
**Description**: Triggers data synchronization processes

### External Services

#### `POST /functions/v1/scrape-website`
**Required Tier**: `standard`  
**Description**: Scrapes website content for analysis

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Missing authorization header",
  "code": "AUTHENTICATION_REQUIRED", 
  "success": false,
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "error": "Requires standard subscription, user has free",
  "code": "INSUFFICIENT_TIER",
  "success": false, 
  "statusCode": 403
}
```

```json
{
  "error": "Requires admin role, user has basic",
  "code": "INSUFFICIENT_ROLE",
  "success": false,
  "statusCode": 403
}
```

## Security Notes

- All endpoints validate user roles/tiers server-side after JWT validation
- Client-side guards can be bypassed, but server-side authorization cannot
- Failed authorization attempts are logged for security monitoring
- Rate limiting is applied to all endpoints to prevent abuse