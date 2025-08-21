# Google Services Integration with n8n

## Overview

This integration creates multiple Google service credentials for each user when they sign up with Google OAuth. Each user gets individual credentials for Calendar, Gmail, Contacts, Drive, Sheets, and Docs with the proper scopes and credential types.

## How It Works

### 1. User OAuth Flow
1. User clicks "Sign up with Google" on your web app
2. User grants permissions for all required Google services
3. Your app receives access/refresh tokens with comprehensive scopes
4. n8n automatically creates 6 separate credentials for the user

### 2. Credential Creation Process
For each user, the system creates these credentials:

| Service | Credential Type | Scopes |
|---------|----------------|---------|
| **Google Calendar** | `googleCalendarOAuth2Api` | `https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events` |
| **Gmail** | `gmailOAuth2Api` | `https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send` |
| **Google Contacts** | `googleContactsOAuth2Api` | `https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/contacts.readonly` |
| **Google Drive** | `googleDriveOAuth2Api` | `https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file` |
| **Google Sheets** | `googleSheetsOAuth2Api` | `https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly` |
| **Google Docs** | `googleDocsOAuth2Api` | `https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/documents.readonly` |

## Implementation Details

### OAuth Scopes Requested
The Google OAuth flow requests these scopes:
```javascript
scope: [
  'profile', 
  'email',
  // Calendar scopes
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  // Gmail scopes
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  // Drive scopes
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  // Contacts scopes
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.readonly',
  // Sheets scopes
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  // Docs scopes
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly'
]
```

### Credential Data Structure
Each credential follows this structure (based on the examples provided):

```json
{
  "name": "Google Calendar - user@example.com",
  "type": "googleCalendarOAuth2Api",
  "data": {
    "clientId": "your-client-id.googleusercontent.com",
    "clientSecret": "your-client-secret",
    "oauthTokenData": {
      "accessToken": "user-access-token",
      "refreshToken": "user-refresh-token",
      "expiresAt": "2024-01-15T10:30:00.000Z",
      "expiresIn": 3600,
      "tokenType": "Bearer",
      "scope": "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
    }
  }
}
```

## Testing

### Run the Google Services Test
```bash
npm run test:google-services
```

This test will:
1. Check n8n API connectivity
2. Verify all credential schemas are available
3. Create test credentials for all 6 Google services
4. Clean up test credentials
5. Provide a detailed summary

### Expected Output
```
🧪 Testing Google services credential creation...
✅ n8n API is reachable
✅ googleCalendarOAuth2Api schema available
✅ gmailOAuth2Api schema available
✅ googleContactsOAuth2Api schema available
✅ googleDriveOAuth2Api schema available
✅ googleSheetsOAuth2Api schema available
✅ googleDocsOAuth2Api schema available

🔧 Creating Google Calendar credential...
✅ Google Calendar credential created successfully!
📄 Credential ID: abc123def456
📄 Credential name: Google Calendar - test@example.com

[... continues for all 6 services ...]

🎉 Google services credential test completed!
📋 Your n8n integration is ready to create Google service credentials for real users.
```

## Live User Experience

### For Real Users
When a user signs up with Google OAuth:

1. **User grants permissions** for all Google services during OAuth
2. **6 credentials are created** automatically in n8n
3. **Each credential is named** with the user's email (e.g., "Google Calendar - user@example.com")
4. **User can immediately use** all Google services in n8n workflows

### Monitoring
- Check n8n interface at `https://n8n.hireninja.site`
- Look for new credentials in the credentials section
- Each user will have 6 credentials with their email in the name

## Troubleshooting

### Common Issues

1. **Credential Schema Not Available**
   - Some Google service credential types might not be available in your n8n version
   - The system will continue with available services and log warnings for unavailable ones

2. **OAuth Scope Issues**
   - Ensure your Google OAuth app has all required scopes enabled
   - Check Google Cloud Console for API enablement

3. **Token Expiry**
   - Tokens are set to expire in 1 hour (3600 seconds)
   - n8n handles token refresh automatically

### Debug Commands
```bash
# Test specific service
curl -H "X-N8N-API-KEY: your_api_key" \
     -H "Content-Type: application/json" \
     -d '{"name":"test","type":"googleCalendarOAuth2Api","data":{}}' \
     https://n8n.hireninja.site/api/v1/credentials

# Check available schemas
curl -H "X-N8N-API-KEY: your_api_key" \
     https://n8n.hireninja.site/api/v1/credentials/schema/googleCalendarOAuth2Api
```

## Benefits

### For Users
- **One-time setup**: Single OAuth flow grants access to all services
- **Individual credentials**: Each user has their own isolated credentials
- **Immediate access**: Can use all Google services in n8n workflows right away

### For Your Application
- **Automated provisioning**: No manual credential setup required
- **Scalable**: Works for any number of users
- **Secure**: Each user's credentials are isolated
- **Comprehensive**: Covers all major Google services

## Next Steps

1. **Test the integration** with `npm run test:google-services`
2. **Deploy to production** with the updated code
3. **Monitor real user signups** in your n8n interface
4. **Create workflows** that use these credentials

Your Google services integration is now ready for production! 🚀
