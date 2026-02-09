# RFP Grader Fix Applied ✅

## What Was Fixed

I've updated the RFP Grader to provide **detailed error messages** so you can see exactly what's wrong.

### Changes Made:

1. **Backend** ([functions/rfpGrader.js](functions/rfpGrader.js)):
   - Added secret validation at the start of the function
   - Now checks if EMAIL_USER, EMAIL_PASS, and GEMINI_API_KEY are configured
   - Returns specific error message telling you which secrets are missing

2. **Frontend** ([components/RFPGrader.tsx](components/RFPGrader.tsx)):
   - Improved error handling to display server error messages
   - Now shows the specific error from the backend instead of generic message

---

## Next Steps to Fix the Error

### Step 1: Re-authenticate with Firebase

Your Firebase credentials expired. Run this:

```bash
firebase login --reauth
```

This will open your browser to log in to Firebase again.

---

### Step 2: Check Which Secrets Are Missing

After logging in, the error message will now tell you exactly which secrets are missing. But let's set them all up:

---

### Step 3: Get Your API Keys

#### A. Gmail App Password

1. Go to https://myaccount.google.com/security
2. Make sure **2-Step Verification** is enabled
3. Go to https://myaccount.google.com/apppasswords
4. Create a new app password:
   - App: **Mail**
   - Device: **Other (Custom name)**
   - Name it: **Propagent RFP Grader**
5. Copy the **16-character password** (ignore spaces)

#### B. Google Gemini API Key

1. Go to https://aistudio.google.com/
2. Click **"Get API Key"** in the top right
3. Create a new API key (or use existing)
4. Copy the API key (starts with `AIza...`)

---

### Step 4: Configure Firebase Secrets

Run these commands and paste your values when prompted:

```bash
# 1. Set your Gmail address
firebase functions:secrets:set EMAIL_USER
# Paste: your-email@gmail.com

# 2. Set your Gmail app password (from Step 3A)
firebase functions:secrets:set EMAIL_PASS
# Paste: the 16-character code (no spaces)

# 3. Set your Gemini API key (from Step 3B)
firebase functions:secrets:set GEMINI_API_KEY
# Paste: AIza... (your API key)
```

**Important**: Type or paste carefully - there's no visual confirmation!

---

### Step 5: Deploy the Updated Function

```bash
# Deploy only functions (faster)
firebase deploy --only functions

# Expected output:
# ✓ functions[gradeRfp(us-central1)] Successful update operation.
```

---

### Step 6: Test It!

1. Visit: https://propagentlanding.web.app/rfp-grader
2. Enter your email address
3. Select "Grade My RFP"
4. Upload a small PDF file (10 pages or less for testing)
5. Click **Submit for Grading**

**Expected Results**:

✅ **If All Secrets Configured**:
- Success message: "Your RFP is being analyzed..."
- Email arrives in 5-10 minutes

❌ **If Missing Secrets**:
- Error message now shows: "Missing secrets: EMAIL_USER, GEMINI_API_KEY"
- This tells you exactly what to fix!

---

## Debugging Commands

### View Function Logs
```bash
firebase functions:log --only gradeRfp
```

Look for:
- ✅ "All required secrets are configured" (good!)
- ❌ "Missing required secrets: ..." (need to set these)

### Test Locally (Optional)
```bash
# Start Firebase emulators
firebase emulators:start

# Visit: http://localhost:5000/rfp-grader
```

Note: Emulators may not have access to secrets, so cloud deployment is recommended for full testing.

---

## Current Workflow

```
User submits form
  ↓
Frontend → /api/gradeRfp
  ↓
Function checks secrets
  ↓
┌─────────────────────────┐
│ Are all secrets set?    │
└─────────┬───────────────┘
          │
    ┌─────┴─────┐
    NO          YES
    │           │
    ↓           ↓
Error msg    Process RFP
with exact    ↓
missing     Send email
secrets       ↓
            Success!
```

---

## What If It Still Doesn't Work?

### Issue: Firebase login fails
**Solution**: Try using an incognito window or clearing browser cache

### Issue: Secrets won't set
**Error**: "Permission denied"
**Solution**: Make sure you're an owner/editor of the `propagentlanding` Firebase project

### Issue: Function deploys but still errors
**Check**:
```bash
firebase functions:log --only gradeRfp
```
Look for the error message in the logs

### Issue: Email not arriving
**Possible causes**:
1. Gmail app password is incorrect
2. Email is in spam folder
3. Gmail account needs to verify "less secure app" access

---

## Quick Test: Which Secrets Are Set?

After deployment, try submitting a test RFP. The error message will now say:

- **"Missing secrets: EMAIL_USER, EMAIL_PASS, GEMINI_API_KEY"** → None are set
- **"Missing secrets: GEMINI_API_KEY"** → Only this one is missing
- **No error** → All secrets are configured! 🎉

---

## Cost Reminder

Once working:
- **Test RFP (10 pages)**: ~$0.05
- **Real RFP (50 pages)**: ~$0.10 - $0.15
- **Large RFP (200 pages)**: ~$0.25 - $0.50

Monitor costs in Firebase Console under Functions.

---

## Files Modified

- ✅ [functions/rfpGrader.js](functions/rfpGrader.js) - Added secret validation
- ✅ [components/RFPGrader.tsx](components/RFPGrader.tsx) - Better error display
- ✅ Built and ready to deploy

---

## Summary

**The Problem**: Generic error message made it impossible to debug

**The Fix**: Now shows exactly which secrets are missing

**Next Action**:
1. `firebase login --reauth`
2. Set the 3 secrets (EMAIL_USER, EMAIL_PASS, GEMINI_API_KEY)
3. `firebase deploy --only functions`
4. Test at /rfp-grader

**You'll know it works when**: You submit a test RFP and get a success message, followed by an email with grading results!

---

Good luck! The error messages should now guide you exactly to what needs to be fixed. 🚀
