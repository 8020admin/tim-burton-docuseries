# Mux Setup Guide - Tim Burton Docuseries

## 🎬 Step 1: Create Mux Account & Get Credentials

### **1.1 Sign Up for Mux**
1. Go to https://dashboard.mux.com/signup
2. Create an account (free tier available for testing)
3. Verify your email

### **1.2 Create an Environment**
1. In Mux Dashboard, you'll see "Development" environment by default
2. This is perfect for testing

### **1.3 Get API Credentials**

#### **Access Tokens (for API calls)**
1. Go to **Settings** (bottom left) → **Access Tokens**
2. Click **Generate new token**
3. Name it: "Tim Burton Backend"
4. Select permissions:
   - ✅ **Mux Video** - Full Access
   - ✅ **Mux Data** - Read
5. Click **Generate Token**
6. **SAVE THESE** (you'll only see them once):
   ```
   MUX_TOKEN_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   MUX_TOKEN_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```

#### **Signing Keys (for secure playback)**
1. Go to **Settings** → **Signing Keys**
2. Click **Generate new key**
3. Name it: "Tim Burton Playback"
4. Click **Generate**
5. **SAVE THESE** (the private key will be a base64-encoded string ending with `=`):
   ```
   MUX_SIGNING_KEY=zzzzzzzzzzzzzzzzzz
   MUX_PRIVATE_KEY=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789+/=
   ```

---

## 🎥 Step 2: Upload Test Videos

### **Option A: Upload via Dashboard (Easiest)**

1. Go to **Video** in the left sidebar
2. Click **Upload a video**
3. Choose your video file
4. Click **Start Upload**
5. Wait for processing (usually 1-5 minutes)
6. Once done, click on the video
7. **Copy the Playback ID** (e.g., `abc123def456789`)

### **Recommended Test Structure**

Upload at least:
- ✅ **1 Episode** (for testing regular/rental access)
- ✅ **1 Extra** (for testing box set access)

You can use the same video file twice with different names:
- `Episode 1 - Suburban Hell`
- `Box Set Extra - Behind the Scenes`

### **Option B: Upload via API (Advanced)**

If you prefer, I can create a script that uploads videos for you. Just let me know!

---

## 📋 Step 3: Organize Your Playback IDs

Create a spreadsheet or document with:

| Content Type | Title | Playback ID | Access Required |
|-------------|-------|-------------|-----------------|
| Episode | Suburban Hell | `abc123...` | rental/regular/boxset |
| Episode | Misunderstood Monsters | `def456...` | rental/regular/boxset |
| Episode | Rebel by Design | `ghi789...` | rental/regular/boxset |
| Episode | Coming Home | `jkl012...` | rental/regular/boxset |
| Extra | Behind the Scenes | `mno345...` | boxset only |
| Extra | Director's Commentary | `pqr678...` | boxset only |

---

## ⚙️ Step 4: Configure Backend

Once you have the credentials, add them to the backend:

1. Go to: `src/backend/functions/.env`
2. Add these lines:
   ```env
   # Mux Configuration
   MUX_TOKEN_ID=your_token_id_here
   MUX_TOKEN_SECRET=your_token_secret_here
   MUX_SIGNING_KEY=your_signing_key_id_here
   MUX_PRIVATE_KEY=your_base64_encoded_private_key_ending_with_equals=
   ```

3. Save the file

**Note:** The `MUX_PRIVATE_KEY` should be pasted as-is (it's a long base64 string ending with `=`)

---

## 🎯 What's Next?

Once you complete Steps 1-4 above:

1. ✅ Mux account created
2. ✅ API credentials saved
3. ✅ Test videos uploaded
4. ✅ Playback IDs documented
5. ✅ Backend configured

**Let me know when you're done, and I'll proceed to Step 2: Build Backend Integration!**

---

## 🆘 Troubleshooting

### **Can't upload videos?**
- Check file format (MP4, MOV, MKV, AVI supported)
- Check file size (max 500 GB per file)
- Try a smaller test file first (even a 30-second clip works)

### **Processing takes too long?**
- First upload usually takes 1-5 minutes
- HD videos (1080p) take longer than SD
- You can use the API to check status

### **Need test videos?**
If you don't have test videos yet, you can:
1. Use any MP4 file you have
2. Download free stock videos from pexels.com
3. Create a simple test video (even a screencap works)

---

## 📞 Need Help?

Just let me know if you get stuck on any step!

