# Get Google Maps API Key for Street View - URGENT

**Time needed:** 5 minutes
**Once complete:** We can fix all 810 booths immediately

---

## Step 1: Go to Google Cloud Console

Open: https://console.cloud.google.com/apis/credentials

(You may need to select your project first)

---

## Step 2: Create New API Key

1. Click **"+ CREATE CREDENTIALS"** at top
2. Select **"API key"**
3. A new key will be created (format: `AIzaSy...`)
4. **Copy the key immediately**

---

## Step 3: Remove Restrictions

**CRITICAL:** The key must work server-side (no referrer restrictions)

1. Click the edit icon (pencil) next to your new key
2. Under **"API restrictions"**:
   - Select **"Don't restrict key"** (OR)
   - Select **"Restrict key"** and enable:
     - ✅ Maps JavaScript API
     - ✅ Street View Static API
     - ✅ Maps Embed API
     - ✅ Places API
3. Under **"Application restrictions"**:
   - Select **"None"** (critical for server-side use)
4. Click **"Save"**

---

## Step 4: Enable Required APIs

Go to: https://console.cloud.google.com/apis/library

Enable these APIs (click each, then click "ENABLE"):
1. **Street View Static API**
2. **Maps Embed API** (probably already enabled)
3. **Places API** (probably already enabled)

---

## Step 5: Verify Billing is Enabled

Go to: https://console.cloud.google.com/billing

- Ensure a billing account is linked
- Street View API requires billing (has free tier)

---

## Step 6: Provide the Key

**Send me the API key** (format: `AIzaSy...` followed by ~39 characters)

Example: `AIzaSyDk3j4_dG5fH7I8kL9mN0pQ1rS2tT3uU4vV5wW6xX7yY8zZ9`

---

## What Happens Next

Once I have the key:
1. I'll set it in Supabase Edge Function secrets (10 seconds)
2. Run universal validation on all 810 booths (14 minutes)
3. Every booth page will show correct Street View (no more wrong locations!)

---

## Why We Need This

**Current problem:**
- Booths use raw coordinates for Street View
- Google shows NEAREST panorama (often wrong business)
- "The Smith" shows "Josephina restaurant" ❌

**After validation:**
- Each booth gets specific panorama ID
- Google shows EXACT panorama we specify
- "The Smith" shows "The Smith" ✅

---

## Security Note

This key will be stored securely in:
- Supabase secrets (encrypted at rest)
- Used only by server-side Edge Functions
- Never exposed to client browsers
- Never committed to git

---

**Time sensitive:** Once you provide the key, I can fix all 810 booths in 14 minutes.
