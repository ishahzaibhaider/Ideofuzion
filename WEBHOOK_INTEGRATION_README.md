# Webhook Integration Documentation

## Overview

This document describes the webhook integration for the live interview functionality in the Ideofuzion platform. The webhook is triggered when a user starts an interview session and sends relevant data to the n8n automation platform.

## Webhook Configuration

### Production Webhook URL
```
https://n8n.hireninja.site/webhook/meetbot-ideofuzion
```

### Method
- **HTTP Method**: POST
- **Content-Type**: application/json
- **Authentication**: None (public webhook)

## Webhook Data Structure

When an interview session is started, the following data is sent to the webhook:

```json
{
  "userId": "string",
  "userEmail": "string", 
  "userName": "string",
  "candidateId": "string",
  "candidateName": "string",
  "candidateEmail": "string",
  "jobTitle": "string",
  "googleMeetId": "string",
  "interviewStart": "string (ISO 8601)",
  "interviewEnd": "string (ISO 8601)",
  "calendarEventId": "string",
  "timestamp": "string (ISO 8601)",
  "action": "interview_session_started",
  "sessionId": "string (unique identifier)",
  "platform": "ideofuzion"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Database ID of the logged-in user |
| `userEmail` | string | Email address of the logged-in user |
| `userName` | string | Name of the logged-in user |
| `candidateId` | string | Database ID of the candidate |
| `candidateName` | string | Full name of the candidate |
| `candidateEmail` | string | Email address of the candidate |
| `jobTitle` | string | Job title for the position |
| `googleMeetId` | string | Google Meet ID for the interview |
| `interviewStart` | string | Interview start time (ISO 8601 format) |
| `interviewEnd` | string | Interview end time (ISO 8601 format) |
| `calendarEventId` | string | Calendar event ID |
| `timestamp` | string | When the webhook was triggered (ISO 8601 format) |
| `action` | string | Always "interview_session_started" |
| `sessionId` | string | Unique session identifier |
| `platform` | string | Always "ideofuzion" |

## Implementation Details

### Server-Side Implementation

The webhook integration is implemented in the server routes (`server/routes.ts`):

1. **Endpoint**: `/api/start-interview-session`
2. **Authentication**: Requires valid JWT token
3. **Rate Limiting**: 5 requests per minute per user
4. **Timeout**: 10 seconds for webhook requests
5. **Error Handling**: Comprehensive error handling with detailed logging

### Client-Side Implementation

The webhook integration is implemented in the live interview page (`client/src/pages/live-interview.tsx`):

1. **Webhook Health Check**: Automatic health monitoring
2. **Visual Indicators**: Real-time webhook status display
3. **Error Handling**: User-friendly error messages
4. **Validation**: Pre-flight validation of required fields
5. **Rate Limiting**: Client-side protection against rapid successive calls

## Security Features

### Rate Limiting
- Server-side rate limiting: 5 requests per minute per user
- Client-side protection: 5-second cooldown between session starts
- Automatic cleanup of rate limit data

### Validation
- Authentication required for all webhook operations
- Candidate data validation (Google Meet ID, interview times)
- User data validation
- Input sanitization

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Graceful degradation when webhook is unavailable
- Timeout protection (10 seconds)

## Health Monitoring

### Webhook Health Check
- **Endpoint**: `/api/webhook-health`
- **Method**: GET
- **Authentication**: Required
- **Timeout**: 5 seconds
- **Response**: JSON with webhook status

### Health Check Response
```json
{
  "status": "healthy|unhealthy|error",
  "webhookReachable": true|false,
  "webhookStatus": 200,
  "timestamp": "2024-01-15T10:00:00Z",
  "error": "error message (if applicable)"
}
```

## Testing

### Manual Testing
1. Navigate to the live interview page
2. Select a candidate with valid Google Meet ID
3. Click "Start Session"
4. Check browser console for webhook response
5. Verify webhook data in n8n platform

### Automated Testing
Use the test file `test-webhook-integration.js`:

```bash
node test-webhook-integration.js
```

### Health Check Testing
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/webhook-health
```

## Troubleshooting

### Common Issues

1. **Webhook Timeout**
   - Check network connectivity
   - Verify webhook URL is accessible
   - Check n8n platform status

2. **Authentication Errors**
   - Ensure user is logged in
   - Check JWT token validity
   - Refresh authentication if needed

3. **Rate Limiting**
   - Wait 1 minute before retrying
   - Check server logs for rate limit violations

4. **Missing Data**
   - Ensure candidate has Google Meet ID
   - Verify interview times are set
   - Check candidate data integrity

### Debugging

1. **Server Logs**
   - Check console output for webhook requests
   - Monitor error logs for failed requests
   - Verify rate limiting is working

2. **Client Logs**
   - Check browser console for API responses
   - Monitor webhook health check results
   - Verify authentication status

3. **Network Monitoring**
   - Use browser dev tools to monitor requests
   - Check response status codes
   - Verify request payload format

## Monitoring and Alerts

### Logging
- All webhook requests are logged with timestamps
- Error responses include detailed information
- Rate limiting violations are logged
- Health check results are tracked

### Metrics
- Webhook success/failure rates
- Response times
- Rate limiting violations
- Health check status

## Future Enhancements

1. **Retry Logic**: Implement exponential backoff for failed webhooks
2. **Webhook Signatures**: Add HMAC signatures for security
3. **Multiple Webhooks**: Support for multiple webhook endpoints
4. **Webhook History**: Store webhook request history
5. **Real-time Monitoring**: Dashboard for webhook status

## Support

For issues related to the webhook integration:

1. Check the troubleshooting section above
2. Review server and client logs
3. Test webhook connectivity manually
4. Contact the development team with detailed error information

## Changelog

### Version 1.0.0
- Initial webhook integration
- Basic authentication and validation
- Rate limiting implementation
- Health monitoring
- Error handling and logging
