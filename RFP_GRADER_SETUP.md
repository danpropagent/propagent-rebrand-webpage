# RFP AI Grader - Setup & Configuration Guide

## Overview

The RFP AI Grader is an automated system for evaluating Request for Proposals (RFPs) and RFP responses using Google's Gemini AI. The system provides two modes:

1. **RFP Grader Mode**: Analyzes RFP documents for quality, clarity, and completeness
2. **Response Grader Mode**: Evaluates vendor responses against original RFP requirements

## Architecture

### Frontend
- **Framework**: React with TypeScript
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **File Upload**: HTML5 Drag & Drop API with multipart/form-data

### Backend
- **Platform**: Firebase Cloud Functions (Node.js 24)
- **AI Model**: Google Gemini (gemini-3-flash-preview)
- **Email**: Nodemailer with Gmail SMTP
- **File Processing**: Busboy for multipart form parsing
- **Storage**: Temporary files in Cloud Functions (auto-cleanup)

## Prerequisites

1. **Firebase Project**
   - Active Firebase project with Blaze (pay-as-you-go) plan
   - Functions enabled in your project

2. **Google Cloud Platform**
   - Gemini API access enabled
   - API key generated for Gemini

3. **Email Account**
   - Gmail account for sending notifications
   - App-specific password generated (if using 2FA)

## Installation Steps

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
```

### 2. Configure Firebase Secrets

Firebase Cloud Functions uses Secret Manager for sensitive data. You need to set up three secrets:

```bash
# Set Gmail credentials
firebase functions:secrets:set EMAIL_USER
# Enter your Gmail address when prompted

firebase functions:secrets:set EMAIL_PASS
# Enter your Gmail app-specific password when prompted

# Set Gemini API key
firebase functions:secrets:set GEMINI_API_KEY
# Enter your Google Gemini API key when prompted
```

### 3. Obtain API Keys & Credentials

#### Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key or use an existing one
5. Copy the API key for use in Firebase secrets

#### Gmail App-Specific Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled
3. Go to "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Name it "Propagent RFP Grader"
6. Copy the 16-character password (no spaces)

### 4. Update Configuration Files

The system is already configured in the codebase. Verify these files:

**firebase.json** - Should include API rewrite:
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/gradeRfp",
        "function": "gradeRfp"
      }
    ]
  }
}
```

**functions/package.json** - Should include dependencies:
```json
{
  "dependencies": {
    "@google/genai": "^0.x.x",
    "busboy": "^1.x.x",
    "nodemailer": "^6.x.x"
  }
}
```

## Deployment

### 1. Build the Frontend

```bash
npm run build
```

### 2. Deploy to Firebase

```bash
# Deploy both hosting and functions
firebase deploy

# Or deploy separately
firebase deploy --only hosting
firebase deploy --only functions
```

### 3. Verify Deployment

After deployment, Firebase will provide URLs:
- **Hosting URL**: `https://YOUR-PROJECT.web.app`
- **Function URL**: `https://REGION-YOUR-PROJECT.cloudfunctions.net/gradeRfp`

Visit your site at `/rfp-grader` to test the interface.

## Configuration Details

### Email Notification Recipients

The system sends emails to two recipients:

1. **User Email**: The email address provided in the form
2. **Internal Team**: The EMAIL_USER address (set in secrets)

To change the internal recipient, modify `functions/rfpGrader.js`:

```javascript
const internalMailOptions = {
  to: "your-team-email@example.com", // Change this line
  // ...
};
```

### AI Model Configuration

The system uses `gemini-3-flash-preview` by default. To change the model:

**functions/rfpGrader.js** (line ~330):
```javascript
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", // Change to: gemini-1.5-flash, etc.
});
```

Available models:
- `gemini-2.0-flash-exp` (Recommended - experimental, fastest)
- `gemini-1.5-flash` (Stable, fast)
- `gemini-1.5-pro` (More capable, slower, higher cost)
- `gemini-3-flash-preview` (More capable, slower, higher cost)

### Grading Rubrics

The grading criteria are defined in system prompts:

**RFP Grader Rubric** (`functions/rfpGrader.js` lines 15-60):
- Grades RFP documents on clarity, completeness, and feasibility
- A-F scale with detailed criteria for each grade

**Response Grader Rubric** (`functions/rfpGrader.js` lines 62-120):
- Evaluates vendor responses against RFP requirements
- Includes gap analysis and compliance checking

To customize rubrics, edit the `RFP_GRADER_PROMPT` and `RESPONSE_GRADER_PROMPT` constants.

### File Upload Limits

**Current Limits**:
- Max file size: 100 MB per file
- Accepted formats: PDF, DOCX, TXT
- Multiple files: Yes (unlimited count)

To change limits, edit `components/RFPGrader.tsx`:

```typescript
const isValidSize = file.size <= 100 * 1024 * 1024; // Change 100 to desired MB
```

And update the UI text accordingly.

### Function Timeout & Memory

**Current Settings** (`functions/rfpGrader.js`):
```javascript
const options = {
  timeoutSeconds: 540,  // 9 minutes (max for Cloud Functions)
  memory: "1GiB",       // 1GB RAM
};
```

For large documents, you may need to increase memory:
- Options: "256MiB", "512MiB", "1GiB", "2GiB", "4GiB", "8GiB"

## Usage Guide

### For End Users

1. Navigate to `https://your-site.com/rfp-grader`
2. Enter your email address
3. Select grading mode:
   - **Grade My RFP**: Upload RFP documents only
   - **Grade My Response**: Upload both RFP and your response
4. Drag & drop files or click to browse
5. Click "Submit for Grading"
6. Wait for email notification (typically 3-10 minutes)

### Email Format

Users receive a professionally formatted HTML email with:
- Letter grade (A-F) and numeric score
- Executive summary
- Strengths and weaknesses
- Specific examples (RFP mode) or gap analysis (Response mode)
- Actionable recommendations

## Cost Estimation

### Firebase Costs

**Cloud Functions**:
- Invocations: $0.40 per million
- Compute time: ~$0.0000025 per GB-second
- Network egress: $0.12 per GB

**Estimated per request**: $0.01 - $0.05

### Google Gemini API Costs

**Gemini 2.0 Flash** (as of Jan 2025):
- Input: ~$0.075 per million tokens
- Output: ~$0.30 per million tokens

**Estimated per RFP**:
- Small RFP (50 pages): ~$0.05 - $0.15
- Large RFP (200 pages): ~$0.20 - $0.50

### Gmail SMTP
- Free for reasonable usage
- Consider SendGrid/Mailgun for high volume

## Troubleshooting

### Common Issues

**1. "Failed to process your request"**
- Check Firebase Functions logs: `firebase functions:log`
- Verify all secrets are set correctly
- Ensure Gemini API key is valid and has quota

**2. Files not uploading**
- Verify file size < 100MB
- Check file format (PDF, DOCX, TXT only)
- Inspect browser console for errors

**3. No email received**
- Check spam folder
- Verify EMAIL_USER and EMAIL_PASS secrets
- Test Gmail credentials separately

**4. Timeout errors**
- Increase function timeout (max 540s)
- Increase memory allocation
- Consider splitting large documents

**5. API quota exceeded**
- Check Gemini API quota in Google Cloud Console
- Upgrade API tier if needed
- Implement rate limiting in frontend

### Monitoring

**Firebase Console**:
- Functions > Dashboard: View invocations, errors, execution time
- Functions > Logs: Detailed execution logs
- Functions > Health: Function status

**Command Line**:
```bash
# View recent logs
firebase functions:log

# Stream logs in real-time
firebase functions:log --only gradeRfp
```

## Security Considerations

### File Upload Security

The system validates:
- File extensions (PDF, DOCX, TXT only)
- File size (max 100MB)
- MIME types

**Not implemented** (consider adding):
- Virus scanning
- Content sanitization
- User authentication

### API Security

Current protection:
- CORS enabled for all origins
- No authentication required

**Recommended for production**:
- Implement reCAPTCHA on frontend
- Add rate limiting (Firebase App Check)
- Require user authentication
- Whitelist allowed origins in CORS

### Secret Management

Secrets are stored in Google Secret Manager (not in code).

**Best practices**:
- Rotate API keys regularly
- Use separate Gmail accounts for prod/dev
- Monitor secret access logs

## Customization Guide

### Changing Email Templates

Edit the `generateRFPGradeEmail()` function in `functions/rfpGrader.js`:

```javascript
const generateRFPGradeEmail = (result, mode) => {
  // Modify HTML template here
  return `<!DOCTYPE html>...`;
};
```

### Adding New Grading Criteria

1. Update the system prompt rubric definitions
2. Modify the expected JSON output format
3. Update email template to display new fields
4. Test with sample documents

### Integrating with Other Services

**Add Slack notifications**:
```javascript
const axios = require('axios');
await axios.post(process.env.SLACK_WEBHOOK_URL, {
  text: `New RFP graded: ${gradingResult.grade}`,
});
```

**Save to database**:
```javascript
await admin.firestore().collection('rfp_grades').add({
  email,
  grade: gradingResult.grade,
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
});
```

## Performance Optimization

### File Processing

Current implementation uploads files to Gemini sequentially. For faster processing:

```javascript
// Upload in parallel
const uploadedRfpFiles = await Promise.all(
  rfpFiles.map(file => uploadToGemini(file.path, file.mimeType))
);
```

### Caching

Consider implementing Redis caching for identical documents:

```javascript
const cacheKey = crypto.createHash('md5').update(fileContent).digest('hex');
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### Background Processing

For large batches, consider using Firebase Tasks:

```javascript
const {onTaskDispatched} = require('firebase-functions/v2/tasks');
exports.processRfpTask = onTaskDispatched({...}, async (req) => {
  // Process in background
});
```

## Testing

### Local Development

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start Vite dev server
npm run dev
```

Update API endpoint in development:
```typescript
const endpoint = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5001/YOUR-PROJECT/us-central1/gradeRfp'
  : '/api/gradeRfp';
```

### Test Documents

Create test RFPs with known issues to verify grading:
- **Test A-grade**: Complete, detailed RFP
- **Test F-grade**: Vague, incomplete RFP
- **Test Response**: Response with intentional gaps

## Support & Maintenance

### Regular Maintenance Tasks

**Weekly**:
- Review function logs for errors
- Monitor API usage and costs
- Check email delivery rates

**Monthly**:
- Update dependencies: `npm update`
- Review and optimize rubric prompts
- Analyze grading accuracy with user feedback

**Quarterly**:
- Rotate API keys and passwords
- Review and update security policies
- Test disaster recovery procedures

### Getting Help

**Resources**:
- Firebase Documentation: https://firebase.google.com/docs
- Gemini API Docs: https://ai.google.dev/docs
- GitHub Issues: Report bugs and request features

**Logs Location**:
- Frontend: Browser DevTools Console
- Backend: Firebase Console > Functions > Logs
- Email: Check Gmail sent folder

## Appendix

### File Structure

```
/
├── components/
│   ├── RFPGrader.tsx          # Main RFP grader UI component
│   └── Navbar.tsx              # Navigation with RFP link
├── functions/
│   ├── index.js                # Firebase Functions entry point
│   ├── rfpGrader.js           # RFP grading logic & AI integration
│   └── package.json            # Functions dependencies
├── App.tsx                     # Main app with routing
├── firebase.json               # Firebase configuration
├── .firebaserc                 # Firebase project settings
└── RFP_GRADER_SETUP.md        # This file
```

### Environment Variables

Set in Firebase Secret Manager:
- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_PASS`: Gmail app-specific password
- `GEMINI_API_KEY`: Google Gemini API key

### API Endpoints

- **Production**: `https://your-site.com/api/gradeRfp`
- **Local Emulator**: `http://localhost:5001/PROJECT-ID/REGION/gradeRfp`

### Version History

- **v1.0.0**: Initial release with dual-mode grading
  - RFP quality analysis
  - Response compliance checking
  - Email notifications
  - A-F grading rubric

---

**Last Updated**: January 2025
**Maintainer**: Propagent Development Team
