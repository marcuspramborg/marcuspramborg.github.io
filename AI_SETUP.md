# 🚀 AI Integration Setup Guide

This guide will help you deploy Focus with real AI capabilities using Vercel serverless functions.

## 📋 Prerequisites

1. **GitHub Account** (you already have this!)
2. **Vercel Account** - Sign up at https://vercel.com (free)
3. **OpenAI API Key** - Get from https://platform.openai.com/api-keys

## 🎯 Step-by-Step Deployment

### Step 1: Get Your Groq API Key (FREE!)

1. Go to https://console.groq.com/keys
2. Click **"Sign Up"** or **"Login"** (can use Google/GitHub)
3. Once logged in, you'll see the API Keys page
4. Click **"Create API Key"**
5. Give it a name like "Focus" (optional)
6. Click **"Submit"**
7. **IMPORTANT**: Copy the key immediately (starts with `gsk_...`)
   - It will only be shown once!
   - Store it somewhere safe temporarily (you'll paste it in Vercel soon)
8. **Bonus**: Groq is 100% free with no credit card required! 🎉

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

### Step 3: Deploy to Vercel (Detailed)

#### 3.1: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"** in the top right
3. Choose **"Continue with GitHub"** (recommended - makes linking easier)
4. Authorize Vercel to access your GitHub account
5. You'll be redirected to the Vercel dashboard

#### 3.2: Import Your Project

1. On the Vercel dashboard, click the **"Add New..."** button (top right)
2. Select **"Project"** from the dropdown
3. You'll see a list of your GitHub repositories
4. Find `marcuspramborg.github.io` in the list
5. Click **"Import"** next to it

#### 3.3: Configure Project Settings

1. **Project Name**: Vercel auto-fills this (you can customize it)
   - Example: `focus` or keep the default
   
2. **Framework Preset**: Should auto-detect as "Other"
   - No need to change this
   
3. **Root Directory**: Leave as `./` (default)
   
4. **Build Settings**: 
   - Build Command: Leave empty (we don't need one)
   - Output Directory: Leave empty
   - Install Command: Leave empty
   
5. **Environment Variables**: 
   - **Skip for now** - we'll add the API key after deployment

6. Click the big **"Deploy"** button

#### 3.4: Wait for Deployment

1. You'll see a deployment progress screen with animated effects
2. Vercel will:
   - Clone your repository
   - Build your project (takes 20-60 seconds)
   - Deploy to their global CDN
3. When complete, you'll see: **"Congratulations! Your project has been successfully deployed."**
4. You'll get a URL like: `focus-abc123.vercel.app`
5. Click **"Continue to Dashboard"**

#### 3.5: Test Initial Deployment

1. Click the URL or **"Visit"** button to open your site
2. You should see your Focus app working!
3. **Note**: AI chat won't work yet (we need to add the API key next)

### Step 4: Add Environment Variable (Your API Key)

#### 4.1: Navigate to Settings

1. In your Vercel project dashboard, look at the top navigation
2. Click the **"Settings"** tab (between "Deployments" and "Analytics")

#### 4.2: Open Environment Variables

1. In the left sidebar, scroll down to find **"Environment Variables"**
2. Click it - you'll see an empty list (or any existing variables)

#### 4.3: Add Your Groq API Key

1. You'll see three input fields:
   
   **Key (Name):**
   - Type exactly: `GROQ_API_KEY`
   - Must be exact - no spaces, correct capitalization!
   
   **Value:**
   - Paste your Groq API key (the `gsk_...` key you copied earlier)
   - Make sure there are no extra spaces before/after
   
   **Environments:**
   - You'll see three checkboxes: Production, Preview, Development
   - **Check all three boxes** ✅
   - This ensures the key works in all deployment types

2. Click **"Save"** button

#### 4.4: Verify It Was Added

1. You should now see `GROQ_API_KEY` in the list
2. The value will be hidden (shows as `••••••••` for security)
3. You'll see badges for: Production, Preview, Development

### Step 5: Redeploy with New Environment Variable

#### 5.1: Why Redeploy?

Environment variables are only loaded during deployment. Your running site doesn't know about the API key yet!

#### 5.2: Trigger a Redeployment

1. Go back to the **"Deployments"** tab at the top
2. You'll see a list of all deployments
3. Find the most recent one (should be at the top)
4. On the right side of that deployment row, click the **"..."** (three dots) button
5. A dropdown menu appears - select **"Redeploy"**

#### 5.3: Redeploy Options

1. A modal dialog appears with options:
   - **"Use existing Build Cache"** - ✅ Check this (faster deployment)
   - You can leave other settings default
2. Click the **"Redeploy"** button in the modal

#### 5.4: Wait for Redeployment

1. You'll see the deployment progress screen again
2. This time it's faster (usually 15-30 seconds) because of the cache
3. Watch for the success message
4. Your site now has access to the `GROQ_API_KEY`!

### Step 6: Test Your AI

#### 6.1: Open Your Deployed Site

1. Go back to your Vercel project dashboard
2. At the top, you'll see a "Visit" button with your site URL
3. Click it to open your live Focus app
4. Alternatively, visit the URL directly (e.g., `focus-abc123.vercel.app`)

#### 6.2: Navigate to AI Helper

1. Once your site loads, look at the left sidebar
2. Click on **"AI Helper"** (the robot icon 🤖)
3. You should see the chat interface

#### 6.3: Send a Test Message

Try one of these example messages:

- "I'm feeling overwhelmed with studying"
- "How do I stay focused with ADHD?"
- "Break down my essay into small steps"
- "I keep procrastinating, help!"

#### 6.4: What to Expect

**If Everything Works:** 
- You'll see a typing indicator (three animated dots)
- Within 1-3 seconds, the AI responds
- Response should be helpful, ADHD-focused advice
- Uses emojis and friendly tone

**If Something's Wrong:**
- See the Troubleshooting section below
- Check browser console (F12) for error messages
- Verify the API key was added correctly in Vercel

#### 6.5: Test Conversation Memory

1. Ask a follow-up question: "Can you give me more details?"
2. The AI should remember your previous message
3. Responses build on earlier context

**Success!** Your AI is now live and working! 🎉

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

Your Focus app now has real AI capabilities! The AI will:
- Remember conversation context
- Provide ADHD-friendly advice
- Break down complex tasks
- Offer encouragement and motivation

Enjoy your AI-powered study assistant! 🧠✨
