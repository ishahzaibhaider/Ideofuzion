# Gmail OAuth2 Credentials Fix - Local Testing Guide

This guide will help you test the Gmail OAuth2 credentials fix locally without needing SSH access to your server.

## 🚨 The Problem

Your Gmail workflows are failing with the error:
```
"Unable to sign without access token (item 0)"
```

This happens because the n8n Gmail OAuth2 credentials are being created without the actual OAuth2 token data.

## ✅ The Fix

The fix adds the `oauthTokenData` object to the credential creation, including:
- `access_token`: The fresh access token
- `refresh_token`: The refresh token from your database
- `scope`: The OAuth2 scope
- `token_type`: The token type (Bearer)
- `expiry_date`: The token expiry timestamp

## 🧪 Local Testing Steps

### Step 1: Check if the fix is applied

Run the comprehensive test script:

```bash
node test-gmail-fix-local.js
```

This script will:
- ✅ Check if the fix is in your local code
- ✅ Test n8n connectivity
- ✅ Check Gmail OAuth2 credential schema
- ✅ List existing Gmail credentials
- ✅ Test credential creation structure
- ✅ Provide recommendations

### Step 2: Apply the fix (if needed)

If the test shows the fix is not applied, run:

```bash
node apply-gmail-fix.js
```

This will automatically apply the necessary changes to `server/n8nService.ts`.

### Step 3: Deploy and test

1. **Deploy the updated code** to your server
2. **Run the test script again** to verify the fix is working
3. **Refresh existing credentials** using your server's API endpoint

## 📋 What the Test Script Checks

### Code Analysis
- ✅ Checks if `oauthTokenData` structure is present
- ✅ Verifies `access_token` and `refresh_token` mappings
- ✅ Confirms the fix is in your local code

### n8n Integration
- ✅ Tests connectivity to your n8n instance
- ✅ Checks Gmail OAuth2 credential schema
- ✅ Lists existing Gmail credentials
- ✅ Verifies if credentials have `oauthTokenData`

### Credential Analysis
- ✅ Identifies credentials without `oauthTokenData` (old implementation)
- ✅ Shows which credentials have the fix applied
- ✅ Provides specific recommendations for each case

## 🔧 Manual Fix (if automated script fails)

If the automated script doesn't work, manually update `server/n8nService.ts`:

**Find this section:**
```typescript
data: {
  clientId: accessInfo.clientId,
  clientSecret: accessInfo.clientSecret,
  sendAdditionalBodyProperties: false,
  additionalBodyProperties: "{}"
  // Note: We don't include oauthTokenData here...
}
```

**Replace with:**
```typescript
data: {
  clientId: accessInfo.clientId,
  clientSecret: accessInfo.clientSecret,
  sendAdditionalBodyProperties: false,
  additionalBodyProperties: "{}",
  oauthTokenData: {
    access_token: freshToken.accessToken,
    refresh_token: accessInfo.refreshToken,
    scope: accessInfo.scope,
    token_type: accessInfo.tokenType || 'Bearer',
    expiry_date: freshToken.expiresAt.getTime()
  }
}
```

## 🚀 After Applying the Fix

### For New Users
- New Google OAuth signups will automatically create credentials with `oauthTokenData`
- Gmail workflows should work immediately

### For Existing Users
- Existing credentials need to be refreshed/recreated
- Use your server's refresh endpoint: `POST /api/auth/refresh-tokens/{userId}`
- Or manually trigger credential recreation through your application

## 📊 Expected Results

After the fix:
- ✅ Gmail credentials will have `oauthTokenData` field
- ✅ Access tokens will be properly included
- ✅ Gmail workflows will execute without "Unable to sign without access token" errors
- ✅ Token refresh will work automatically

## 🆘 Troubleshooting

### Test script shows "fix not applied"
- Run `node apply-gmail-fix.js` to apply automatically
- Or manually edit `server/n8nService.ts` following the manual fix guide

### Test script shows "credentials without oauthTokenData"
- Deploy the updated code to your server
- Refresh existing credentials using the API endpoint
- Or recreate credentials through your application

### n8n connectivity issues
- Check if your n8n instance is running
- Verify the API key is correct
- Check network connectivity to `n8n.hireninja.site`

## 📞 Support

If you encounter issues:
1. Run the test script and share the output
2. Check the console logs for specific error messages
3. Verify your n8n instance is accessible
4. Ensure your Google OAuth credentials are properly configured

---

**🎉 Once the fix is applied and tested, your Gmail workflows should work correctly!**
