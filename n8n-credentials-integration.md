# N8N Credentials Integration with Access Info Collection

## Overview

This system automatically creates n8n credentials when Google OAuth tokens and scopes are stored in the `access_info` collection. The integration ensures that users who authenticate with Google OAuth get their credentials automatically created in n8n for seamless workflow automation.

## How It Works

### 1. OAuth Flow Integration

When a user completes Google OAuth authentication:

1. **Token Storage**: OAuth tokens are stored in the `access_info` collection with the following structure:
   ```typescript
   {
     userId: string;
     email: string;
     accessToken: string;
     refreshToken: string;
     clientId: string;
     clientSecret: string;
     scope: string;
     tokenType: string;
     expiresAt: Date;
   }
   ```

2. **Automatic Credential Creation**: The system automatically calls `createN8nCredentialsFromAccessInfo()` to create n8n credentials for all applicable Google services.

### 2. Supported Google Services

The system creates credentials for the following Google services based on the user's OAuth scope:

| Service | Credential Type | Required Scopes |
|---------|----------------|-----------------|
| Google Calendar | `googleCalendarOAuth2Api` | `https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events` |
| Gmail | `gmailOAuth2Api` | `https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send` |
| Google Contacts | `googleContactsOAuth2Api` | `https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/contacts.readonly` |
| Google Drive | `googleDriveOAuth2Api` | `https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file` |
| Google Sheets | `googleSheetsOAuth2Api` | `https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly` |
| Google Docs | `googleDocsOAuth2Api` | `https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/documents.readonly` |

### 3. N8N API Integration

The system uses the n8n API at `https://n8n.hireninja.site/api/v1` to create credentials:

#### Credential Creation Request
```typescript
POST /credentials
{
  "name": "Google Calendar - user@example.com",
  "type": "googleCalendarOAuth2Api",
  "data": {
    "clientId": "your-google-client-id",
    "clientSecret": "your-google-client-secret",
    "oauthTokenData": {
      "accessToken": "user-access-token",
      "refreshToken": "user-refresh-token",
      "expiresAt": "2024-01-01T12:00:00.000Z",
      "expiresIn": 3600,
      "tokenType": "Bearer",
      "scope": "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
    }
  }
}
```

#### Response
```typescript
{
  "id": "credential-id",
  "name": "Google Calendar - user@example.com",
  "type": "googleCalendarOAuth2Api",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

## API Endpoints

### 1. Create Credentials for Specific User
```http
POST /api/n8n/create-credentials/:userId
Authorization: Bearer <jwt-token>
```

Creates n8n credentials for a specific user based on their access_info.

### 2. Create Credentials for All Users (Admin)
```http
POST /api/n8n/create-credentials-for-all
Authorization: Bearer <jwt-token>
```

Creates n8n credentials for all users who have access_info entries.

## Code Structure

### Key Files

1. **`server/n8nService.ts`**: Contains the main credential creation logic
   - `createN8nCredentialsFromAccessInfo()`: Creates credentials from access_info data
   - `createN8nCredential()`: Legacy function for user registration
   - `createMultipleGoogleServiceCredentials()`: Creates multiple service credentials

2. **`server/routes.ts`**: Contains the OAuth callback and API endpoints
   - OAuth callback automatically triggers credential creation
   - API endpoints for manual credential creation

3. **`shared/schema.ts`**: Defines the AccessInfo data structure

### Key Functions

#### `createN8nCredentialsFromAccessInfo(accessInfo: AccessInfo)`
```typescript
export async function createN8nCredentialsFromAccessInfo(accessInfo: AccessInfo): Promise<any[]> {
  // 1. Get user information
  // 2. Iterate through supported Google services
  // 3. Check if user has required scopes
  // 4. Create credentials for matching services
  // 5. Return array of created credentials
}
```

## Testing

### Test Script
Run the test script to verify n8n credential creation:

```bash
npm run test:n8n-credentials
```

The test script:
1. Tests Google Calendar credential creation
2. Tests Gmail credential creation
3. Retrieves credential schema
4. Tests API endpoints

### Manual Testing
1. Complete Google OAuth flow
2. Check logs for credential creation messages
3. Verify credentials appear in n8n interface
4. Test API endpoints with valid JWT token

## Error Handling

The system includes comprehensive error handling:

1. **Scope Validation**: Only creates credentials for services the user has access to
2. **API Error Handling**: Logs detailed error information for debugging
3. **Graceful Degradation**: Continues with other services if one fails
4. **Non-blocking**: OAuth flow continues even if credential creation fails

## Security Considerations

1. **Token Security**: Access tokens are never logged in plain text
2. **API Key Protection**: N8N API key is stored securely
3. **Scope Validation**: Only creates credentials for authorized scopes
4. **User Isolation**: Credentials are user-specific

## Monitoring and Logging

The system provides detailed logging:

```
🚀 [N8N] Creating credentials from access_info for user: user@example.com
🔧 [N8N] Creating Google Calendar credential for user@example.com
✅ [N8N] Google Calendar credential created successfully for user user@example.com
📄 [N8N] Credential ID: abc123
🎉 [N8N] Created 2 Google service credentials for user user@example.com
```

## Troubleshooting

### Common Issues

1. **Missing Scopes**: User doesn't have required OAuth scopes
2. **Invalid Tokens**: Access tokens are expired or invalid
3. **API Errors**: N8N API is unavailable or returns errors
4. **Network Issues**: Connection problems to n8n.hireninja.site

### Debug Steps

1. Check server logs for detailed error messages
2. Verify OAuth scopes in access_info collection
3. Test n8n API connectivity manually
4. Verify environment variables are set correctly

## Future Enhancements

1. **Credential Refresh**: Automatically refresh expired credentials
2. **Bulk Operations**: Create credentials for all existing users
3. **Credential Management**: Delete/update existing credentials
4. **Service Discovery**: Dynamically discover available n8n credential types
5. **Webhook Integration**: Real-time credential updates via webhooks
