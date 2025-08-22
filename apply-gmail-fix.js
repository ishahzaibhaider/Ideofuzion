// Script to apply the Gmail OAuth2 credentials fix
// This script will check and apply the necessary changes to n8nService.ts

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

function applyGmailFix() {
  console.log('🔧 Applying Gmail OAuth2 credentials fix...');
  
  try {
    const n8nServicePath = join(process.cwd(), 'server', 'n8nService.ts');
    
    if (!existsSync(n8nServicePath)) {
      console.log('❌ n8nService.ts not found in server directory');
      console.log('💡 Please run this script from the project root directory');
      return false;
    }
    
    console.log('📁 Found n8nService.ts, reading current content...');
    const fileContent = readFileSync(n8nServicePath, 'utf8');
    
    // Check if the fix is already applied
    if (fileContent.includes('oauthTokenData: {') && 
        fileContent.includes('access_token: freshToken.accessToken')) {
      console.log('✅ The fix is already applied!');
      return true;
    }
    
    console.log('🔍 Looking for the credential creation section...');
    
    // Find the section that needs to be updated
    const oldPattern = `data: {
            clientId: accessInfo.clientId,
            clientSecret: accessInfo.clientSecret,
            sendAdditionalBodyProperties: false,
            additionalBodyProperties: "{}"
            // Note: We don't include oauthTokenData here because n8n will handle the OAuth2 flow
            // when the workflow runs. The credential will be created in "pending" state
            // and n8n will prompt for OAuth2 authorization when first used.
          }`;
    
    const newPattern = `data: {
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
          }`;
    
    if (fileContent.includes(oldPattern)) {
      console.log('🔧 Applying the fix...');
      const updatedContent = fileContent.replace(oldPattern, newPattern);
      
      // Also update the logging section
      const oldLogPattern = `oauthTokenData: {
              ...credentialData.data.oauthTokenData,
              accessToken: '[REDACTED]',
              refreshToken: '[REDACTED]'
            }`;
      
      const newLogPattern = `oauthTokenData: {
              ...credentialData.data.oauthTokenData,
              access_token: '[REDACTED]',
              refresh_token: '[REDACTED]'
            }`;
      
      const finalContent = updatedContent.replace(oldLogPattern, newLogPattern);
      
      // Write the updated content back to the file
      writeFileSync(n8nServicePath, finalContent, 'utf8');
      
      console.log('✅ Fix applied successfully!');
      console.log('📝 Changes made:');
      console.log('   • Added oauthTokenData object to credential creation');
      console.log('   • Included access_token, refresh_token, scope, token_type, and expiry_date');
      console.log('   • Updated logging to use correct field names');
      
      return true;
      
    } else {
      console.log('❌ Could not find the exact pattern to replace');
      console.log('💡 The file structure might be different than expected');
      console.log('📝 Manual intervention required - please check the file manually');
      
      // Show what the fix should look like
      console.log('\n🔧 Here is what the fix should look like:');
      console.log('In the createN8nCredentialsFromAccessInfo function, find this section:');
      console.log('```typescript');
      console.log('data: {');
      console.log('  clientId: accessInfo.clientId,');
      console.log('  clientSecret: accessInfo.clientSecret,');
      console.log('  sendAdditionalBodyProperties: false,');
      console.log('  additionalBodyProperties: "{}"');
      console.log('}');
      console.log('```');
      console.log('\nAnd replace it with:');
      console.log('```typescript');
      console.log('data: {');
      console.log('  clientId: accessInfo.clientId,');
      console.log('  clientSecret: accessInfo.clientSecret,');
      console.log('  sendAdditionalBodyProperties: false,');
      console.log('  additionalBodyProperties: "{}",');
      console.log('  oauthTokenData: {');
      console.log('    access_token: freshToken.accessToken,');
      console.log('    refresh_token: accessInfo.refreshToken,');
      console.log('    scope: accessInfo.scope,');
      console.log('    token_type: accessInfo.tokenType || "Bearer",');
      console.log('    expiry_date: freshToken.expiresAt.getTime()');
      console.log('  }');
      console.log('}');
      console.log('```');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error applying fix:', error.message);
    return false;
  }
}

// Run the fix
console.log('🚀 Gmail OAuth2 Credentials Fix Application Tool\n');
const success = applyGmailFix();

if (success) {
  console.log('\n🎉 Fix application completed successfully!');
  console.log('📋 Next steps:');
  console.log('   1. Deploy the updated code to your server');
  console.log('   2. Run the test script: node test-gmail-fix-local.js');
  console.log('   3. Refresh existing credentials using the API endpoint');
} else {
  console.log('\n⚠️ Fix application was not completed');
  console.log('💡 Please check the output above and apply changes manually if needed');
}
