# Quick Start: AI Image Generation

## TL;DR
AI image generation has been fixed and now uses OpenAI DALL-E 3. You just need to add your API key.

---

## Step 1: Add API Key (Required)

Open `.env.local` and add:
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Get your key from: https://platform.openai.com/api-keys

---

## Step 2: Test It Works

```bash
npx tsx test-dalle-image-generation.ts
```

Expected output:
```
✅ Image generation successful!
🎉 Real AI-generated image from DALL-E 3!
```

---

## Step 3: Restart Dev Server

```bash
npm run dev
```

---

## Step 4: Test in Browser

1. Open your app at http://localhost:3000
2. Navigate to the map or city guide
3. Click on a booth that has no photo
4. The popup should show an AI-generated vintage street view image

---

## Step 5: Deploy (Optional)

Add the API key to Vercel:
```bash
vercel env add OPENAI_API_KEY
```

Then redeploy:
```bash
git push
```

---

## What Changed?

- Replaced Google Imagen API with OpenAI DALL-E 3
- Added `openai` npm package
- Same function signatures (no breaking changes)
- Better reliability and image quality

---

## Cost

$0.04 per image (standard quality)
- 100 booths = $4
- 1000 booths = $40

---

## Troubleshooting

**Still seeing placeholders?**
1. Check API key is set: `echo $OPENAI_API_KEY` (won't work, check .env.local)
2. Check server logs for errors
3. Verify API key is valid at https://platform.openai.com/api-keys

**Need help?**
- Read full guide: `AI_IMAGE_GENERATION_SETUP.md`
- Check summary: `IMAGE_GENERATION_FIX_SUMMARY.md`

---

## That's It!

Once the API key is added, AI image generation will work automatically.
