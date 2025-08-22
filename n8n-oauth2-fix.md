# N8N OAuth2 Credential Fix - "Unable to Sign Without Access Token" Error

## Problem Description

The error "Unable to sign without access token (item 0)" was occurring because we were trying to create OAuth2 credentials with pre-existing tokens, but n8n's Google service nodes (like Gmail) expect to handle the OAuth2 flow themselves.

## Root Cause

The issue was in our credential creation approach:

1. **Incorrect Approach**: We were creating OAuth2 credentials with `oauthTokenData` containing pre-existing access and refresh tokens
2. **n8n Expectation**: n8n's Google service nodes expect to handle the OAuth2 flow themselves when the workflow runs
3. **Token Mismatch**: The tokens we provided were either expired or not in the format n8n expected

## Solution Implemented

### 1. Correct OAuth2 Credential Creation

Instead of providing pre-existing tokens, we now create OAuth2 credentials with only the client credentials:

```typescript
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
```

### 2. How n8n OAuth2 Works

When you create an OAuth2 credential in n8n:

1. **Credential Creation**: The credential is created in a "pending" state with only client credentials
2. **First Use**: When the workflow runs for the first time, n8n will:
   - Detect that the credential needs OAuth2 authorization
   - Open a browser window for Google OAuth2 consent
   - Handle the OAuth2 flow automatically
   - Store the tokens securely in n8n's credential store
3. **Subsequent Uses**: The credential will work automatically with the stored tokens

### 3. Updated Functions

All credential creation functions have been updated:

- `createN8nCredentialsFromAccessInfo()`
- `createMultipleGoogleServiceCredentials()`
- `createGoogleServiceCredential()`

## Usage Instructions

### For New Users

1. **Complete Google OAuth authentication** in your application
2. **System creates n8n credentials** with client credentials only
3. **First workflow run**: n8n will prompt for OAuth2 authorization
4. **Authorize the application** in the browser window that opens
5. **Subsequent runs**: Credentials work automatically

### For Existing Users

1. **Delete existing credentials** in n8n that are causing issues
2. **Recreate credentials** using the API endpoint:
   ```bash
   POST /api/n8n/create-credentials/:userId
   ```
3. **First workflow run**: Complete OAuth2 authorization when prompted
4. **Use the new credentials** in your workflows

### Manual Credential Creation

If you need to create credentials manually in n8n:

1. **Go to Credentials** in n8n
2. **Create new credential** for the Google service you need
3. **Enter only**:
   - Client ID
   - Client Secret
4. **Save the credential**
5. **Use in workflow** - n8n will handle OAuth2 flow automatically

## Testing

### Test the Fix

```bash
npm run test:n8n-credentials
```

This will create credentials without `oauthTokenData` and verify they're created successfully.

### Manual Testing

1. **Create a test workflow** in n8n using Gmail/Google Calendar nodes
2. **Use the credentials** created by the system
3. **Execute the workflow** - n8n should prompt for OAuth2 authorization
4. **Complete the authorization** in the browser
5. **Verify the workflow runs** without token errors

## Benefits

1. **Proper OAuth2 Flow**: n8n handles the OAuth2 flow correctly
2. **Automatic Token Management**: n8n manages token refresh automatically
3. **Secure Token Storage**: Tokens are stored securely in n8n's credential store
4. **No Token Expiry Issues**: n8n handles token refresh transparently
5. **Standard Approach**: This follows n8n's intended OAuth2 credential pattern

## Important Notes

### Credential State

- **Pending**: Credential created but not yet authorized
- **Authorized**: Credential has been authorized and ready to use
- **Error**: Credential has authorization issues

### OAuth2 Scopes

The credentials will request the same scopes that were granted during your application's OAuth2 flow:

- Calendar: `https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events`
- Gmail: `https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send`
- Drive: `https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file`
- Contacts: `https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/contacts.readonly`
- Sheets: `https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly`
- Docs: `https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/documents.readonly`

### Browser Requirements

- The OAuth2 authorization requires a browser window
- For headless environments, you may need to handle this differently
- Consider using service accounts for automated workflows

## Troubleshooting

### If OAuth2 Authorization Fails

1. **Check client credentials**: Ensure Client ID and Client Secret are correct
2. **Verify redirect URIs**: Make sure your Google OAuth2 app has the correct redirect URIs
3. **Check scopes**: Ensure the requested scopes are enabled in your Google OAuth2 app
4. **Clear browser cache**: Sometimes browser cache can cause OAuth2 issues

### If Credentials Still Don't Work

1. **Delete and recreate**: Remove the credential and create it again
2. **Check n8n logs**: Look for OAuth2-related errors in n8n logs
3. **Verify Google OAuth2 app**: Ensure your Google OAuth2 app is properly configured
4. **Test with manual credential**: Try creating the credential manually in n8n first

This fix ensures that n8n credentials follow the proper OAuth2 flow and work correctly with Google services.
