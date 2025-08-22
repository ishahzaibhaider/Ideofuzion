# N8N Token Refresh Fix - "Unable to Sign Without Access Token" Error

## Problem Description

When using n8n credentials created from Google OAuth tokens, workflows were failing with the error:
```
"unable to sign without access token (item 0)"
```

## Root Cause

The issue was that when creating n8n credentials, we were using the access tokens stored in the `access_info` collection, but these tokens had likely expired by the time the workflow was executed. Google OAuth access tokens typically expire after 1 hour, and n8n needs fresh tokens to authenticate API requests.

## Solution Implemented

### 1. Token Refresh Functionality

Added automatic token refresh before creating n8n credentials:

```typescript
/**
 * Refreshes a Google OAuth access token using the refresh token
 */
async function refreshGoogleToken(refreshToken: string, clientId: string, clientSecret: string): Promise<TokenRefreshResponse> {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  return response.data;
}
```

### 2. Fresh Token Acquisition

Added a function to get fresh access tokens before creating credentials:

```typescript
/**
 * Gets fresh access token for a user, refreshing if necessary
 */
async function getFreshAccessToken(accessInfo: AccessInfo): Promise<{ accessToken: string; expiresAt: Date }> {
  // Check if current token is expired or will expire soon (within 5 minutes)
  const now = new Date();
  const expiresAt = new Date(accessInfo.expiresAt);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  if (expiresAt > fiveMinutesFromNow) {
    // Token is still valid
    return { accessToken: accessInfo.accessToken, expiresAt: expiresAt };
  }
  
  // Token expired, refresh it
  const refreshResponse = await refreshGoogleToken(
    accessInfo.refreshToken,
    accessInfo.clientId,
    accessInfo.clientSecret
  );
  
  // Update database with new token
  const newExpiresAt = new Date(now.getTime() + (refreshResponse.expires_in * 1000));
  await storage.updateAccessInfo(accessInfo.userId, {
    accessToken: refreshResponse.access_token,
    expiresAt: newExpiresAt,
    tokenType: refreshResponse.token_type,
    scope: refreshResponse.scope
  });
  
  return { accessToken: refreshResponse.access_token, expiresAt: newExpiresAt };
}
```

### 3. Updated Credential Creation

Modified all credential creation functions to use fresh tokens:

```typescript
export async function createN8nCredentialsFromAccessInfo(accessInfo: AccessInfo): Promise<any[]> {
  // Get fresh access token before creating credentials
  const freshToken = await getFreshAccessToken(accessInfo);
  
  // Use fresh token in credential data
  const credentialData = {
    // ... other fields ...
    oauthTokenData: JSON.stringify({
      accessToken: freshToken.accessToken,  // Fresh token
      refreshToken: accessInfo.refreshToken,
      expiresAt: freshToken.expiresAt.toISOString(),
      expiresIn: Math.floor((freshToken.expiresAt.getTime() - Date.now()) / 1000),
      tokenType: accessInfo.tokenType,
      scope: serviceConfig.scope
    })
  };
}
```

### 4. Manual Token Refresh API

Added an API endpoint to manually refresh tokens and recreate credentials:

```typescript
/**
 * Manually refresh tokens and recreate n8n credentials for a user
 * This is useful for fixing "unable to sign without access token" errors
 */
export async function refreshTokensAndRecreateCredentials(userId: string): Promise<any[]> {
  // Get user's access info
  const accessInfo = await storage.getAccessInfo(userId);
  
  // Force refresh the token
  const refreshResponse = await refreshGoogleToken(
    accessInfo.refreshToken,
    accessInfo.clientId,
    accessInfo.clientSecret
  );
  
  // Update database with new token
  await storage.updateAccessInfo(userId, {
    accessToken: refreshResponse.access_token,
    expiresAt: newExpiresAt,
    tokenType: refreshResponse.token_type,
    scope: refreshResponse.scope
  });
  
  // Create fresh credentials
  const updatedAccessInfo = await storage.getAccessInfo(userId);
  const credentials = await createN8nCredentialsFromAccessInfo(updatedAccessInfo);
  
  return credentials;
}
```

## API Endpoints

### 1. Manual Token Refresh
```http
POST /api/n8n/refresh-tokens/:userId
Authorization: Bearer <jwt-token>
```

This endpoint:
- Refreshes the user's Google OAuth access token
- Updates the token in the database
- Recreates all n8n credentials with the fresh token
- Returns the list of created credentials

### 2. Create Credentials (Updated)
```http
POST /api/n8n/create-credentials/:userId
Authorization: Bearer <jwt-token>
```

This endpoint now automatically refreshes tokens before creating credentials.

## Usage Instructions

### For New Users
1. Complete Google OAuth authentication
2. System automatically refreshes tokens and creates credentials
3. Credentials work immediately in n8n workflows

### For Existing Users with Token Issues
1. Call the refresh endpoint: `POST /api/n8n/refresh-tokens/:userId`
2. System will refresh tokens and recreate all credentials
3. Use the new credentials in n8n workflows

### For Manual Fix
If you encounter the "unable to sign without access token" error:

1. **Identify the user ID** from the error or database
2. **Call the refresh endpoint**:
   ```bash
   curl -X POST \
     http://localhost:5000/api/n8n/refresh-tokens/USER_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```
3. **Use the new credentials** in your n8n workflow

## Testing

### Test Token Refresh
```bash
npm run test:n8n-credentials
```

This will test:
- Token refresh functionality
- Credential creation with fresh tokens
- API endpoints

### Manual Testing
1. Create a test workflow in n8n using Google Calendar/Gmail nodes
2. Use the credentials created by the system
3. Execute the workflow - it should work without token errors

## Monitoring

The system provides detailed logging:

```
🔄 [N8N] Token expired or expiring soon, refreshing...
📅 [N8N] Current time: 2024-01-15T10:00:00.000Z
📅 [N8N] Token expires at: 2024-01-15T09:30:00.000Z
✅ [N8N] Token refreshed successfully
✅ [N8N] Token refreshed and stored in database
🔧 [N8N] Creating Google Calendar credential with fresh token
✅ [N8N] Google Calendar credential created successfully
```

## Benefits

1. **Automatic Token Management**: Tokens are automatically refreshed when needed
2. **Database Synchronization**: Fresh tokens are stored in the database
3. **Manual Recovery**: API endpoint to fix token issues manually
4. **Comprehensive Logging**: Detailed logs for debugging
5. **Error Resilience**: Graceful handling of token refresh failures

## Future Enhancements

1. **Scheduled Token Refresh**: Automatically refresh tokens before they expire
2. **Credential Cleanup**: Remove old credentials when recreating new ones
3. **Bulk Operations**: Refresh tokens for all users at once
4. **Webhook Notifications**: Notify when tokens are refreshed
5. **Token Health Monitoring**: Dashboard to monitor token status

This fix ensures that n8n credentials always have valid, fresh access tokens, preventing the "unable to sign without access token" error.
