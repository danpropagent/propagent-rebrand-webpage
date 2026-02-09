# RFP AI Grader - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Get API Keys (3 minutes)

**Gemini API Key**:
1. Visit https://aistudio.google.com/
2. Click "Get API Key"
3. Copy the key

**Gmail App Password**:
1. Visit https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Create password for "Mail"
5. Copy 16-character code

### Step 2: Configure Secrets (1 minute)

```bash
firebase functions:secrets:set EMAIL_USER
# Enter: your-email@gmail.com

firebase functions:secrets:set EMAIL_PASS
# Enter: your-16-char-app-password

firebase functions:secrets:set GEMINI_API_KEY
# Enter: your-gemini-api-key
```

### Step 3: Deploy (1 minute)

```bash
npm install
npm run build
firebase deploy
```

Done! Visit `https://your-project.web.app/rfp-grader`

---

## 📊 How It Works

### User Journey

1. **User visits** `/rfp-grader`
2. **Enters email** and selects mode
3. **Uploads files** (drag & drop or click)
4. **Submits** for grading
5. **Receives email** with results (5-10 min)

### System Flow

```
Frontend (React)
    ↓ (Multipart Form Data)
Firebase Function
    ↓ (File Upload)
Google Gemini API
    ↓ (AI Analysis)
Email Service
    ↓ (HTML Email)
User & Internal Team
```

---

## 🎯 Two Grading Modes

### Mode A: RFP Grader
**Purpose**: Analyze RFP quality
**Input**: RFP documents only
**Output**:
- Grade (A-F) + score
- Strengths & weaknesses
- Specific improvement suggestions

### Mode B: Response Grader
**Purpose**: Check response compliance
**Input**: RFP + Vendor response
**Output**:
- Grade (A-F) + score
- Gap analysis
- Compliance issues
- Recommendations

---

## 🔧 Key Configuration Points

### Change Internal Email Recipient

Edit `functions/rfpGrader.js` line ~450:
```javascript
to: "your-team@example.com"
```

### Change AI Model

Edit `functions/rfpGrader.js` line ~330:
```javascript
model: "gemini-3-flash-preview"  // or gemini-1.5-flash
```

### Adjust File Size Limit

Edit `components/RFPGrader.tsx` line ~45:
```typescript
file.size <= 100 * 1024 * 1024  // 100MB
```

### Customize Rubric

Edit system prompts in `functions/rfpGrader.js`:
- `RFP_GRADER_PROMPT` (line 15)
- `RESPONSE_GRADER_PROMPT` (line 62)

---

## 🧪 Testing Checklist

### Frontend Testing
- [ ] Page loads at `/rfp-grader`
- [ ] Email validation works
- [ ] Mode toggle switches UI
- [ ] File drag & drop works
- [ ] File upload button works
- [ ] File removal works
- [ ] Submit button enables/disables correctly

### Backend Testing
- [ ] Function deploys successfully
- [ ] Secrets are configured
- [ ] File upload to Gemini works
- [ ] AI analysis returns valid JSON
- [ ] User email sends successfully
- [ ] Internal email sends successfully

### End-to-End Testing
- [ ] Upload small test RFP (< 10 pages)
- [ ] Upload large test RFP (> 100 pages)
- [ ] Upload multiple files
- [ ] Test both modes
- [ ] Verify email delivery
- [ ] Check grading accuracy

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| No email received | Check spam folder, verify Gmail credentials |
| Function timeout | Increase memory in `functions/rfpGrader.js` |
| File upload fails | Check file size < 100MB, format is PDF/DOCX/TXT |
| API quota exceeded | Check Gemini API limits in Google Cloud Console |
| CORS errors | Verify firebase.json rewrites configuration |

---

## 💰 Cost Estimate (per RFP)

| Service | Cost |
|---------|------|
| Cloud Functions | $0.01 - $0.05 |
| Gemini API (50 pages) | $0.05 - $0.15 |
| Gemini API (200 pages) | $0.20 - $0.50 |
| Gmail SMTP | Free |
| **Total per request** | **$0.06 - $0.55** |

Monthly estimate (100 RFPs): **$6 - $55**

---

## 📝 Sample Email Output

```
Subject: RFP Grading Results: B+ (87/100)

Executive Summary:
The RFP demonstrates good structure and clear requirements
in most sections, with minor areas needing clarification
in technical specifications and evaluation criteria.

Strengths:
✓ Clear project scope and objectives
✓ Reasonable timeline and budget
✓ Well-defined vendor qualifications

Weaknesses:
✗ Vague technical requirements in Section 3
✗ Incomplete evaluation criteria
✗ Missing SLA specifications

Recommendations:
1. Add specific technical requirements
2. Define weighted evaluation criteria
3. Include service level agreements
```

---

## 🎨 Customization Ideas

### Add Authentication
Use Firebase Auth to require login before grading.

### Save Results to Database
Store grading history in Firestore for analytics.

### Implement Rate Limiting
Use Firebase App Check to prevent abuse.

### Add Progress Indicator
Show real-time processing status via WebSockets.

### Export Results as PDF
Generate downloadable PDF reports.

### Multi-language Support
Add i18n for international users.

---

## 📚 Quick Links

- **Full Documentation**: [RFP_GRADER_SETUP.md](./RFP_GRADER_SETUP.md)
- **Firebase Console**: https://console.firebase.google.com/
- **Gemini API Studio**: https://aistudio.google.com/
- **Google Cloud Console**: https://console.cloud.google.com/

---

## 🆘 Support Commands

```bash
# View logs
firebase functions:log --only gradeRfp

# Test locally
firebase emulators:start

# Check function status
firebase functions:list

# Update dependencies
npm update && cd functions && npm update
```

---

**Ready to Grade RFPs?** Visit `/rfp-grader` on your deployed site!
