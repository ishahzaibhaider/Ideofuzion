# N8N Token Refresh Fix - "Unable to Sign Without Access Token" Error

## Problem Description

When using n8n credentials created from Google OAuth tokens, workflows were failing with the error:
```
"unable to sign without access token (item 0)"
```

## Root Cause

The issue was that when creating n8n credentials, we were using the access tokens stored in the `access_info` collection, but these tokens had likely expired by the time the workflow was executed. Google OAuth access tokens typically expire after 1 hour, and n8n needs fresh tokens to authenticate API requests.

## Solution Implemented

### 1. Correct OAuth2 Approach

The issue was that we were trying to create OAuth2 credentials with pre-existing tokens, but n8n's Google service nodes expect to handle the OAuth2 flow themselves. The correct approach is to create credentials with only client credentials and let n8n handle the OAuth2 flow.

### 2. Updated Credential Creation

Modified all credential creation functions to use the proper OAuth2 format:

```typescript
export async function createN8nCredentialsFromAccessInfo(accessInfo: AccessInfo): Promise<any[]> {
  const credentialData: CreateCredentialData = {
    name: `${serviceConfig.name} - ${accessInfo.email}`,
    type: serviceConfig.type,
    data: {
      clientId: accessInfo.clientId,
      clientSecret: accessInfo.clientSecret,
      sendAdditionalBodyProperties: false,
      additionalBodyProperties: "{}"
      // Note: We don't include oauthTokenData here because n8n will handle the OAuth2 flow
      // when the workflow runs. The credential will be created in "pending" state
      // and n8n will prompt for OAuth2 authorization when first used.
    }
  };
}
```

### 3. How n8n OAuth2 Works

When you create an OAuth2 credential in n8n:

1. **Credential Creation**: The credential is created in a "pending" state with only client credentials
2. **First Use**: When the workflow runs for the first time, n8n will:
   - Detect that the credential needs OAuth2 authorization
   - Open a browser window for Google OAuth2 consent
   - Handle the OAuth2 flow automatically
   - Store the tokens securely in n8n's credential store
3. **Subsequent Uses**: The credential will work automatically with the stored tokens

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
1. **Complete Google OAuth authentication** in your application
2. **System creates n8n credentials** with client credentials only
3. **First workflow run**: n8n will prompt for OAuth2 authorization
4. **Authorize the application** in the browser window that opens
5. **Subsequent runs**: Credentials work automatically

### For Existing Users with Token Issues
1. **Delete existing credentials** in n8n that are causing issues
2. **Recreate credentials** using the API endpoint:
   ```bash
   POST /api/n8n/create-credentials/:userId
   ```
3. **First workflow run**: Complete OAuth2 authorization when prompted
4. **Use the new credentials** in your workflows

### For Manual Fix
If you encounter the "unable to sign without access token" error:

1. **Delete the problematic credential** in n8n
2. **Recreate the credential** using the API endpoint:
   ```bash
   curl -X POST \
     http://localhost:5000/api/n8n/create-credentials/USER_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```
3. **First workflow run**: Complete OAuth2 authorization when prompted
4. **Use the new credential** in your n8n workflow

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
