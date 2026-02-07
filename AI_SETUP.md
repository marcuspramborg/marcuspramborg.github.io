# 🚀 AI Integration Setup Guide

This guide will help you deploy FocusFlow with real AI capabilities using Vercel serverless functions.

## 📋 Prerequisites

1. **GitHub Account** (you already have this!)
2. **Vercel Account** - Sign up at https://vercel.com (free)
3. **OpenAI API Key** - Get from https://platform.openai.com/api-keys

## 🎯 Step-by-Step Deployment

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-...`)
5. **Important**: You'll get $5 free credit as a new user!

### Step 2: Push Your Code to GitHub

```bash
# If you haven't already initialized git
git init
git add .
git commit -m "Add AI integration with serverless functions"

# Push to your GitHub repository
git branch -M main
git remote add origin https://github.com/marcuspramborg/marcuspramborg.github.io.git
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to https://vercel.com and sign up/login with GitHub
2. Click **"Add New Project"**
3. Select your `marcuspramborg.github.io` repository
4. Vercel will auto-detect the settings - click **"Deploy"**
5. Wait for deployment (usually < 1 minute)

### Step 4: Add Environment Variable

1. In Vercel dashboard, go to your project
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in sidebar
4. Add a new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your API key (paste the `sk-...` key)
   - **Environment**: Select all (Production, Preview, Development)
5. Click **"Save"**

### Step 5: Redeploy

1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Select **"Redeploy"**
4. Check "Use existing Build Cache" and click **"Redeploy"**

### Step 6: Test Your AI!

1. Visit your new Vercel URL (e.g., `focusflow.vercel.app`)
2. Go to the AI Helper tab
3. Type a message like "I'm feeling overwhelmed with studying"
4. The AI should respond with helpful, ADHD-friendly advice!

## 🔧 Configuration Options

### Change AI Provider

The default setup uses OpenAI's GPT-3.5-turbo. To switch providers, edit `api/chat.js`:

**For Claude (Anthropic):**
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
    // ... update headers and body for Claude API
});
```

**For Groq (Fast & Free):**
```javascript
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    // ... same format as OpenAI but with Groq API key
});
```

### Adjust AI Behavior

Edit the system prompt in `api/chat.js` (lines 41-58) to customize:
- Personality and tone
- Response length
- Specific ADHD strategies to emphasize

### Toggle AI On/Off

In `script.js`, change:
```javascript
USE_AI: false  // Falls back to rule-based responses
```

## 💰 Cost Management

### OpenAI Pricing (GPT-3.5-turbo)
- **Input**: $0.0015 per 1K tokens (~750 words)
- **Output**: $0.002 per 1K tokens
- **Average message**: ~$0.002 (0.2 cents)

**With $5 credit**: ~2,500 messages

### Cost-Saving Tips

1. **Set token limits** (already set to 250 in code)
2. **Limit conversation history** (already limited to 6 messages)
3. **Add rate limiting** in the API function
4. **Monitor usage** in OpenAI dashboard

### Free Alternatives

**Groq** offers free tier with fast responses:
1. Sign up at https://groq.com
2. Get API key
3. Use endpoint: `https://api.groq.com/openai/v1/chat/completions`
4. Use models: `llama-3.1-8b-instant` or `mixtral-8x7b-32768`

## 🔒 Security Notes

✅ **What's Secure:**
- API keys stored in Vercel environment variables
- Never exposed in client-side code
- HTTPS encryption for all requests

⚠️ **Consider Adding:**
- Rate limiting per IP address
- User authentication
- Request logging and monitoring

## 🐛 Troubleshooting

### "API key not configured" error
- Check environment variable is named exactly `OPENAI_API_KEY`
- Redeploy after adding environment variables

### "Failed to fetch" error
- Check your internet connection
- Verify Vercel deployment is successful
- Check browser console for CORS errors

### API responses are slow
- Normal for first request (cold start)
- Consider using Groq for faster responses
- Or upgrade to OpenAI GPT-4 with better caching

### Costs getting too high
- Set `USE_AI: false` temporarily
- Add rate limiting in the API function
- Monitor usage at https://platform.openai.com/usage

## 📊 Monitoring Usage

1. Go to https://platform.openai.com/usage
2. Check daily/monthly token usage
3. Set spending limits under "Billing > Limits"
4. Get email alerts for high usage

## 🎨 Customization Ideas

### Add More Features
- **Memory**: Store conversation in localStorage
- **Personas**: Different AI personalities for different moods
- **Voice**: Integrate with speech recognition
- **File upload**: Analyze study materials with AI

### Improve UX
- **Suggested prompts**: Add quick action buttons
- **Message reactions**: Like/dislike responses
- **Export chat**: Download conversation as text
- **Markdown support**: Format AI responses nicely

## 📚 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Add API key
3. ✅ Test AI responses
4. 📱 Add to your phone's home screen (PWA)
5. 🎨 Customize the system prompt
6. 📊 Monitor usage and costs
7. 🚀 Share with friends!

## 🆘 Need Help?

- **OpenAI Docs**: https://platform.openai.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Check Issues**: Look at your browser console for errors

## 🎉 You're All Set!

Your FocusFlow app now has real AI capabilities! The AI will:
- Remember conversation context
- Provide ADHD-friendly advice
- Break down complex tasks
- Offer encouragement and motivation

Enjoy your AI-powered study assistant! 🧠✨
