# RFP AI Grader Feature

## Overview

The **RFP AI Grader** is an intelligent document analysis system that automates the evaluation of Request for Proposals (RFPs) and vendor responses using Google's Gemini AI. This feature is now integrated into the Propagent website as a separate page.

## Features

### 🎯 Dual Grading Modes

**1. RFP Quality Grader**
- Analyzes RFP documents for clarity, completeness, and feasibility
- Provides A-F letter grades with numeric scores
- Identifies strengths and weaknesses
- Suggests concrete improvements

**2. Response Compliance Grader**
- Compares vendor responses against original RFP requirements
- Performs gap analysis to identify missing or incomplete sections
- Highlights compliance issues
- Provides actionable recommendations

### 🚀 Key Capabilities

- **Multi-file Upload**: Drag & drop or click to upload multiple documents
- **Large File Support**: Handles files up to 100MB each (PDF, DOCX, TXT)
- **Smart Validation**: Client-side validation for file types and sizes
- **Email Notifications**: Professionally formatted HTML emails with results
- **Dual Recipients**: Sends results to both user and internal team
- **Fast Processing**: Leverages Gemini Flash models for quick analysis (5-10 minutes)
- **Detailed Feedback**: Structured analysis with executive summary, strengths, weaknesses, and recommendations

### 📊 Grading Rubric

**Grade A (90-100%)**
- Crystal clear requirements
- Complete scope definition
- Well-structured with logical flow
- Realistic expectations

**Grade B (80-89%)**
- Clear requirements with minor gaps
- Good structure
- Reasonable expectations

**Grade C (70-79%)**
- Requirements lack specificity
- Important details missing
- Structure needs improvement

**Grade D (60-69%)**
- Vague or unclear requirements
- Poor organization
- Unrealistic expectations

**Grade F (Below 60%)**
- Severely lacking clarity
- Major gaps
- No clear structure

## Access

Navigate to `/rfp-grader` on the deployed website to access the RFP AI Grader.

The feature is also linked in the main navigation bar.

## Technical Stack

### Frontend
- **React 19** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **HTML5 Drag & Drop API** for file uploads

### Backend
- **Firebase Cloud Functions** (Node.js 24)
- **Google Gemini API** (gemini-3-flash-preview)
- **Nodemailer** for email delivery
- **Busboy** for multipart form parsing

### AI Processing
- **Model**: Google Gemini 2.0 Flash (experimental)
- **Fallback**: Gemini 1.5 Flash
- **Context Window**: 1M+ tokens (handles very large documents)
- **Output Format**: Structured JSON with grading results

## Setup Requirements

To deploy this feature, you need:

1. **Firebase Secrets** (via Secret Manager):
   - `EMAIL_USER`: Gmail address for notifications
   - `EMAIL_PASS`: Gmail app-specific password
   - `GEMINI_API_KEY`: Google Gemini API key

2. **Firebase Configuration**:
   - Blaze plan (pay-as-you-go) required
   - Cloud Functions enabled
   - Secret Manager API enabled

3. **Google Cloud Platform**:
   - Gemini API access enabled
   - API key with sufficient quota

See [RFP_GRADER_SETUP.md](./RFP_GRADER_SETUP.md) for detailed setup instructions.

## Quick Start

```bash
# 1. Install dependencies
npm install
cd functions && npm install && cd ..

# 2. Configure secrets
firebase functions:secrets:set EMAIL_USER
firebase functions:secrets:set EMAIL_PASS
firebase functions:secrets:set GEMINI_API_KEY

# 3. Build and deploy
npm run build
firebase deploy
```

See [RFP_GRADER_QUICK_START.md](./RFP_GRADER_QUICK_START.md) for 5-minute setup guide.

## File Structure

```
components/
  └── RFPGrader.tsx          # Main UI component (500+ lines)
functions/
  ├── rfpGrader.js           # AI grading logic (600+ lines)
  └── index.js               # Exports gradeRfp function
App.tsx                      # Routing configuration
firebase.json                # API endpoint configuration
```

## API Endpoint

**POST** `/api/gradeRfp`

**Request**: `multipart/form-data`
- `email` (string): User email address
- `mode` (string): "rfp" or "response"
- `rfpFiles` (files[]): RFP documents
- `responseFiles` (files[]): Response documents (response mode only)

**Response**: JSON
```json
{
  "message": "Your RFP has been analyzed successfully...",
  "grade": "B+",
  "score": 87
}
```

## Email Template

Results are delivered via HTML email with:
- Large grade badge with color coding
- Executive summary section
- Strengths listed with visual indicators
- Weaknesses with detailed explanations
- Specific examples from the document
- Actionable improvement recommendations
- Professional branding

## Cost Structure

**Per RFP Analysis**:
- Cloud Functions: $0.01 - $0.05
- Gemini API (50 pages): $0.05 - $0.15
- Gemini API (200 pages): $0.20 - $0.50
- Email (Gmail): Free

**Total**: $0.06 - $0.55 per request

**Monthly** (100 RFPs): $6 - $55

## Performance

- **Small RFPs** (< 50 pages): 2-5 minutes
- **Large RFPs** (100+ pages): 5-10 minutes
- **Max Processing Time**: 9 minutes (function timeout)
- **Max File Size**: 100MB per file
- **Concurrent Requests**: 10 (configurable)

## Security Features

### Implemented
- File type validation (PDF, DOCX, TXT only)
- File size validation (max 100MB)
- MIME type checking
- Temporary file cleanup
- Secure secret management

### Recommended for Production
- User authentication (Firebase Auth)
- Rate limiting (Firebase App Check)
- CAPTCHA protection
- Virus scanning
- CORS whitelist

## Monitoring

### Firebase Console
- **Functions Dashboard**: View invocations, errors, execution time
- **Logs**: Real-time function execution logs
- **Metrics**: Cost analysis and usage statistics

### Command Line
```bash
# View recent logs
firebase functions:log --only gradeRfp

# Monitor in real-time
firebase functions:log --only gradeRfp --follow
```

## Customization

### Modify Rubric
Edit system prompts in `functions/rfpGrader.js`:
- `RFP_GRADER_PROMPT` (line 15-60)
- `RESPONSE_GRADER_PROMPT` (line 62-120)

### Change Email Template
Edit `generateRFPGradeEmail()` function in `functions/rfpGrader.js` (line ~125)

### Adjust File Limits
Edit validation logic in `components/RFPGrader.tsx` (line ~45)

### Change AI Model
Edit model configuration in `functions/rfpGrader.js` (line ~330)

## Testing

### Local Development
```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal
npm run dev

# Visit http://localhost:5173/rfp-grader
```

### Test Cases
1. Upload single small PDF (< 10 pages)
2. Upload multiple large PDFs (> 100 pages)
3. Test RFP mode with complete RFP
4. Test RFP mode with incomplete RFP
5. Test Response mode with matching RFP & response
6. Test Response mode with gaps in response
7. Verify email delivery
8. Check grading accuracy

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No email received | Check spam folder, verify EMAIL_USER/EMAIL_PASS |
| Function timeout | Increase memory allocation to 2GiB |
| File upload fails | Verify file size and format |
| CORS errors | Check firebase.json rewrites |
| API quota exceeded | Upgrade Gemini API tier |
| Invalid JSON response | Check Gemini API response format |

## Roadmap

### Potential Enhancements
- [ ] Real-time processing status updates
- [ ] PDF report generation
- [ ] Grading history dashboard
- [ ] Batch processing for multiple RFPs
- [ ] Comparison mode (compare multiple responses)
- [ ] Custom rubric builder (UI for editing rubrics)
- [ ] Multi-language support
- [ ] Integration with project management tools
- [ ] Analytics dashboard for grading trends

## Documentation

- **Setup Guide**: [RFP_GRADER_SETUP.md](./RFP_GRADER_SETUP.md)
- **Quick Start**: [RFP_GRADER_QUICK_START.md](./RFP_GRADER_QUICK_START.md)
- **This File**: Feature overview and reference

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase function logs
3. Consult setup documentation
4. Open an issue in the project repository

## License

Part of the Propagent project. Same license applies.

---

**Built with** ❤️ **using Google Gemini AI**
