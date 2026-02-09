# RFP Grader - Complete Workflow Explained

## The Big Picture

The RFP Grader is a **3-part system** that works together:

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   FRONTEND  │ ───> │   BACKEND    │ ───> │  GEMINI AI  │
│   (React)   │      │  (Firebase)  │      │  (Google)   │
└─────────────┘      └──────────────┘      └─────────────┘
     │                      │                      │
     │                      │                      │
     v                      v                      v
  User uploads          Processes             Analyzes
  RFP files             files                 content

                           │
                           v
                    Sends email
                    with results
```

---

## Step-by-Step: What Happens When You Submit an RFP

### 1. User Interaction (Frontend)

**Location**: Your browser at `/rfp-grader`

**What you do**:
1. Enter your email: `user@example.com`
2. Choose mode: "Grade My RFP" or "Grade My Response"
3. Drag & drop or upload PDF/DOCX/TXT files
4. Click "Submit for Grading"

**What the code does**:
```typescript
// In components/RFPGrader.tsx
const formData = new FormData();
formData.append('email', 'user@example.com');
formData.append('mode', 'rfp');
formData.append('rfpFiles', yourPdfFile);

// Send to backend
fetch('/api/gradeRfp', {
  method: 'POST',
  body: formData
});
```

---

### 2. Request Routing (Firebase Hosting)

**What happens**: Firebase Hosting intercepts the request

**Configuration** (in firebase.json):
```json
{
  "source": "/api/gradeRfp",
  "function": "gradeRfp"
}
```

**Translation**:
- User calls: `https://yoursite.com/api/gradeRfp`
- Firebase routes to: Cloud Function named `gradeRfp`

---

### 3. Function Starts (Firebase Cloud Function)

**Location**: `functions/rfpGrader.js` (line 388)

**First thing**: Validate secrets (NEW - this is what I just added!)

```javascript
// Check if all required secrets exist
const missingSecrets = [];
if (!process.env.EMAIL_USER) missingSecrets.push('EMAIL_USER');
if (!process.env.EMAIL_PASS) missingSecrets.push('EMAIL_PASS');
if (!process.env.GEMINI_API_KEY) missingSecrets.push('GEMINI_API_KEY');

if (missingSecrets.length > 0) {
  // Return clear error message
  return res.status(500).json({
    error: "Missing secrets: EMAIL_USER, GEMINI_API_KEY",
    details: "Please configure these in Firebase Secret Manager"
  });
}
```

**This is why you're getting an error now** - at least one secret is missing!

---

### 4. File Processing (If secrets are OK)

**What happens**:

```javascript
// Parse the uploaded files
busboy.on('file', (fieldname, file, info) => {
  // Save to temp directory
  const tempPath = '/tmp/user-uploaded-file.pdf';
  saveFile(file, tempPath);
});

// Wait for all files to upload
// Then proceed to next step...
```

**Files saved to**:
- `/tmp/` (temporary directory in Cloud Function)
- Automatically deleted when function completes

---

### 5. Upload to Gemini Google Cloud Storage

**Why?** Gemini can't accept 100MB files directly in the API call. We must upload them first.

**What happens**:

```javascript
// Upload each file to Gemini's storage
const uploadedFile = await genAI.uploadFile('/tmp/file.pdf', {
  mimeType: 'application/pdf',
  displayName: 'file.pdf'
});

// Returns a URI we can reference
// Example: "https://generativelanguage.googleapis.com/v1beta/files/abc123"
```

**Wait for processing**:
```javascript
// Poll until file is ready
while (file.state === "PROCESSING") {
  await sleep(2000); // Wait 2 seconds
  file = await genAI.getFile(file.name);
}

// file.state === "ACTIVE" means ready to use
```

---

### 6. Call Gemini AI for Analysis

**What happens**: Send the file references + grading instructions to Gemini

**The Request**:
```javascript
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
});

const result = await model.generateContent([
  // System prompt with grading rubric
  `You are an expert RFP evaluator. Grade this RFP on A-F scale...`,

  // File reference (not the actual file!)
  {
    fileData: {
      mimeType: "application/pdf",
      fileUri: "https://generativelanguage.googleapis.com/v1beta/files/abc123"
    }
  }
]);
```

**Gemini's Job**:
1. Read the PDF content
2. Apply the grading rubric
3. Assign a grade (A-F)
4. Identify strengths and weaknesses
5. Suggest improvements
6. Return structured JSON

**Example Response**:
```json
{
  "grade": "B+",
  "score": 87,
  "executiveSummary": "Well-structured RFP with clear requirements...",
  "strengths": [
    "Clear project scope",
    "Realistic timeline",
    "Detailed technical specs"
  ],
  "weaknesses": [
    "Missing evaluation criteria",
    "Vague budget section"
  ],
  "improvements": [
    {
      "title": "Add weighted evaluation criteria",
      "description": "Include specific weights for each requirement..."
    }
  ]
}
```

---

### 7. Generate Email

**What happens**: Convert the JSON response into a beautiful HTML email

**The Code**:
```javascript
const emailHtml = `
<!DOCTYPE html>
<html>
  <body>
    <h1>RFP Grading Results</h1>
    <div class="grade-badge">B+</div>
    <div class="score">87/100</div>

    <div class="strengths">
      ✓ Clear project scope
      ✓ Realistic timeline
      ✓ Detailed technical specs
    </div>

    <div class="improvements">
      → Add weighted evaluation criteria
      → Clarify budget expectations
    </div>
  </body>
</html>
`;
```

**Styled with**:
- Color-coded grade badge (green for A, red for F)
- Professional formatting
- Propagent branding

---

### 8. Send Email Notifications

**Two emails are sent**:

#### Email #1: To the User
```javascript
await transporter.sendMail({
  from: 'Propagent RFP Grader <your-email@gmail.com>',
  to: 'user@example.com',  // Email they entered in form
  subject: 'RFP Grading Results: B+ (87/100)',
  html: emailHtml
});
```

#### Email #2: To Your Team
```javascript
await transporter.sendMail({
  from: 'Propagent RFP Grader <your-email@gmail.com>',
  to: 'your-email@gmail.com',  // Your internal email
  subject: 'New RFP Grading Request - B+',
  html: emailHtml + userInfo
});
```

**This uses**:
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: Gmail app-specific password
- Nodemailer library to send via Gmail SMTP

---

### 9. Clean Up & Return

**What happens**:

```javascript
// Delete temporary files
for (const tempFile of tempFiles) {
  fs.unlinkSync(tempFile);
}

// Return success to frontend
return res.status(200).json({
  message: "Your RFP has been analyzed successfully.",
  grade: "B+",
  score: 87
});
```

---

### 10. Frontend Displays Result

**User sees**:
```
✅ Success!
Your RFP has been analyzed successfully.
Results have been sent to your email.
```

**User receives email** within 5-10 minutes with full grading report.

---

## The Three Required Secrets

### Why Secrets?

Secrets are sensitive credentials that shouldn't be in your code. Firebase stores them securely and injects them into your function at runtime.

### What Each Secret Does:

```
EMAIL_USER
  ↓
Used to: Log in to Gmail SMTP server
Example: propagent-rfp@gmail.com
Without it: ❌ Can't send emails

EMAIL_PASS
  ↓
Used to: Authenticate with Gmail
Example: abcd efgh ijkl mnop (16 chars)
Without it: ❌ Gmail rejects authentication
Note: NOT your regular Gmail password!
      Must be an "app-specific password"

GEMINI_API_KEY
  ↓
Used to: Call Google Gemini API
Example: AIzaSyC9XqL3v8B...
Without it: ❌ Can't analyze documents
Get it from: https://aistudio.google.com/
```

---

## Why You're Getting an Error Now

**Before my fix**:
```
Missing GEMINI_API_KEY
  ↓
Code tries: new GoogleGenerativeAI(undefined)
  ↓
Crashes with generic error
  ↓
User sees: "An error occurred..."
  ↓
😕 No idea what's wrong!
```

**After my fix**:
```
Missing GEMINI_API_KEY
  ↓
Code checks: if (!process.env.GEMINI_API_KEY)
  ↓
Returns specific error
  ↓
User sees: "Missing secrets: GEMINI_API_KEY"
  ↓
😊 You know exactly what to fix!
```

---

## How to Fix It

### The Complete Process:

```bash
# 1. Authenticate with Firebase
firebase login --reauth

# 2. Set EMAIL_USER
firebase functions:secrets:set EMAIL_USER
# Type your Gmail: propagent@gmail.com

# 3. Set EMAIL_PASS
firebase functions:secrets:set EMAIL_PASS
# Paste app password: abcdefghijklmnop

# 4. Set GEMINI_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
# Paste API key: AIzaSyC9XqL3v8B...

# 5. Deploy the function
firebase deploy --only functions

# 6. Test!
# Visit /rfp-grader and upload a test PDF
```

---

## Timeline: What Takes How Long?

```
User submits form
  ↓ < 1 second
Frontend validates
  ↓ < 1 second
Firebase routes request
  ↓ 1-2 seconds
Function starts & validates secrets
  ↓ 2-5 seconds
Parse & save files
  ↓ 5-15 seconds
Upload to Gemini Google Cloud Storage
  ↓ 10-30 seconds
Wait for file processing
  ↓ 30-120 seconds (depends on file size)
Call Gemini for analysis
  ↓ 60-300 seconds (depends on content)
Generate & send emails
  ↓ 2-5 seconds
Return success to user

TOTAL: 2-10 minutes
```

**Typical**:
- Small RFP (10 pages): 2-3 minutes
- Medium RFP (50 pages): 5-7 minutes
- Large RFP (200 pages): 8-10 minutes

---

## Cost Breakdown

For a 50-page RFP:

```
Function invocation:     $0.0000004
Function compute time:   $0.00075
Gemini Google Cloud Storage upload:  $0.00
Gemini API tokens:       $0.10
Email (Gmail SMTP):      $0.00
────────────────────────────────
TOTAL:                   ~$0.10
```

**Monthly estimate** (100 RFPs):
- Small RFPs (10 pg): $5/month
- Medium RFPs (50 pg): $10/month
- Large RFPs (200 pg): $30/month

---

## Debugging Tips

### Check Function Logs
```bash
firebase functions:log --only gradeRfp
```

**Good logs**:
```
✓ All required secrets are configured
✓ Received RFP grading request - Email: user@example.com
✓ Processing file: document.pdf in field: rfpFiles
✓ Uploaded file: document.pdf as https://...
✓ Waiting for file processing...
✓ All files ready!
✓ Calling Gemini API for analysis...
✓ Results email sent to user: user@example.com
✓ Notification sent to internal team
```

**Bad logs**:
```
✗ Missing required secrets: GEMINI_API_KEY
✗ Error uploading file: Authentication failed
✗ Failed to parse Gemini response as JSON
✗ Error sending email: Invalid login
```

---

## Summary

**How it works**:
1. User uploads files in browser
2. Firebase routes to Cloud Function
3. Function checks secrets (NEW!)
4. Files upload to Gemini
5. AI analyzes and grades
6. Email sent with results
7. User gets detailed feedback

**What you need to do**:
1. Set up 3 secrets (EMAIL_USER, EMAIL_PASS, GEMINI_API_KEY)
2. Deploy the updated function
3. Test with a sample RFP

**You'll know it works when**:
- Form submits successfully
- You see "All required secrets are configured" in logs
- Email arrives with grading results

That's it! The system is actually quite elegant once all the pieces are in place. 🚀
