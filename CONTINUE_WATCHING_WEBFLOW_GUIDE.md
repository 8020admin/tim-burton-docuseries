# Continue Watching & Progress Bars - Webflow Integration Guide

## 🎯 **Overview**

This system automatically:
- ✅ Shows the current episode being watched in the hero section
- ✅ Shows next episode if previous was completed
- ✅ Updates progress bars for all episodes
- ✅ Changes button text dynamically ("Continue Watching" vs "Play")
- ✅ Calculates time remaining accurately
- ✅ Loops back to Episode 1 when all episodes are watched

---

## 📋 **Required Data Attributes for Hero Section**

Add these attributes to your existing hero section elements in Webflow:

### **1. Episode Title**
```html
<div class="hero_episode-title paragraph-xl" data-hero-title>
  Episode 1: Suburban Hell
</div>
```
**Attribute:** `data-hero-title`  
**Updates:** Episode number and title (e.g., "Episode 2: Misunderstood Monsters")

---

### **2. Episode Description**
```html
<div class="hero_episode-description subtitle" data-hero-description>
  A four-part journey into Tim Burton's world...
</div>
```
**Attribute:** `data-hero-description`  
**Updates:** Description based on current episode

---

### **3. Progress Bar Container**
```html
<div class="progress-bar_container" data-hero-progress-bar>
  <div class="progress-bar"></div>
</div>
```
**Attributes:**
- Parent: `data-hero-progress-bar`
- Child: (no attribute needed, direct child div)

**Updates:** Child div width to match progress percentage

---

### **4. Time Remaining - Hours**
```html
<div class="progress-bar_hours">
  <div class="progress-bar_time-lebal paragraph-sm" data-hero-time-hours>1</div>
  <div class="progress-bar_time-lebal paragraph-sm">h</div>
</div>
```
**Attribute:** `data-hero-time-hours`  
**Updates:** Hours remaining

---

### **5. Time Remaining - Minutes**
```html
<div class="progress-bar_mins">
  <div class="progress-bar_time-lebal paragraph-sm" data-hero-time-mins>50</div>
  <div class="progress-bar_time-lebal paragraph-sm">m</div>
</div>
```
**Attribute:** `data-hero-time-mins`  
**Updates:** Minutes remaining

---

### **6. Play Button**
```html
<div data-wf--button--variant="primary" class="button" 
     data-hero-play-button 
     data-video-id="episode-1">
  <div class="btn-icon">
    <span class="icon ph ph-play">​</span>
  </div>
  <div aria-hidden="true" data-hero-button-text>play</div>
  <a href="#" class="u-link-cover w-inline-block">
    <div class="u-sr-only">play</div>
  </a>
</div>
```
**Attributes:**
- Button: `data-hero-play-button` + `data-video-id` (auto-updated)
- Text: `data-hero-button-text`

**Updates:**
- `data-video-id` → Current/next episode ID
- Text → "Continue Watching" or "play"

---

## 📊 **Episode List Progress Bars**

For each episode in your episode list, add these attributes:

### **Episode Progress Bar**
```html
<!-- Episode 1 -->
<div class="progress-bar_container" 
     data-progress-bar 
     data-video-id="episode-1">
  <div class="progress-bar"></div>
</div>

<!-- Episode 2 -->
<div class="progress-bar_container" 
     data-progress-bar 
     data-video-id="episode-2">
  <div class="progress-bar"></div>
</div>

<!-- Episode 3 -->
<div class="progress-bar_container" 
     data-progress-bar 
     data-video-id="episode-3">
  <div class="progress-bar"></div>
</div>

<!-- Episode 4 -->
<div class="progress-bar_container" 
     data-progress-bar 
     data-video-id="episode-4">
  <div class="progress-bar"></div>
</div>

<!-- Bonus Content -->
<div class="progress-bar_container" 
     data-progress-bar 
     data-video-id="bonus-1">
  <div class="progress-bar"></div>
</div>
```

**Attributes:**
- Parent: `data-progress-bar` + `data-video-id`
- Child: (no attribute needed, direct child div)

**Video IDs:**
- Episodes: `episode-1`, `episode-2`, `episode-3`, `episode-4`
- Bonus: `bonus-1`

---

## 🎬 **Episode Video Thumbnails**

Make sure your episode thumbnails also have `data-video-id`:

```html
<!-- Episode clickable thumbnail/poster -->
<div data-video-id="episode-1" style="cursor: pointer;">
  <img src="episode-1-poster.jpg" alt="Episode 1">
</div>
```

---

## 🔧 **How to Add Attributes in Webflow**

1. **Select the element** in Webflow Designer
2. Click **Settings** gear icon (⚙️)
3. Scroll to **Custom Attributes**
4. Click **+ Add Custom Attribute**
5. **Name:** Enter attribute name (e.g., `data-hero-title`)
6. **Value:** Leave empty (JavaScript will populate it)
7. Click **Add** and **Save**

---

## ✅ **Webflow Checklist**

### **Hero Section:**
- [ ] `data-hero-title` on episode title element
- [ ] `data-hero-description` on description element
- [ ] `data-hero-progress-bar` on progress bar container
- [ ] `data-hero-time-hours` on hours number
- [ ] `data-hero-time-mins` on minutes number
- [ ] `data-hero-play-button` on play button wrapper
- [ ] `data-hero-button-text` on button text element
- [ ] `data-video-id` on play button (optional, auto-updated)

### **Episode List:**
- [ ] `data-progress-bar` + `data-video-id="episode-1"` on Episode 1 progress container
- [ ] `data-progress-bar` + `data-video-id="episode-2"` on Episode 2 progress container
- [ ] `data-progress-bar` + `data-video-id="episode-3"` on Episode 3 progress container
- [ ] `data-progress-bar` + `data-video-id="episode-4"` on Episode 4 progress container
- [ ] `data-progress-bar` + `data-video-id="bonus-1"` on Bonus content progress container

### **Episode Thumbnails:**
- [ ] `data-video-id="episode-1"` on Episode 1 clickable area
- [ ] `data-video-id="episode-2"` on Episode 2 clickable area
- [ ] `data-video-id="episode-3"` on Episode 3 clickable area
- [ ] `data-video-id="episode-4"` on Episode 4 clickable area
- [ ] `data-video-id="bonus-1"` on Bonus content clickable area

---

## 🎯 **Episode Sequencing Logic**

The system follows this flow:

1. **No watch history** → Shows Episode 1 with "Play" button
2. **Watching Episode 1 (25% complete)** → Shows Episode 1 with "Continue Watching" button
3. **Completed Episode 1** → Shows Episode 2 with "Play" button
4. **Completed Episode 2** → Shows Episode 3 with "Play" button
5. **Completed Episode 3** → Shows Episode 4 with "Play" button
6. **Completed Episode 4** → Loops back to Episode 1 with "Play" button

**Bonus content** is NOT included in hero rotation (only in progress bars).

---

## 🧪 **Testing**

After adding all attributes and publishing your Webflow site:

1. **Sign in** with a user who has purchased
2. **Refresh** the page
3. **Check console** for:
   ```
   ✅ Hero section updated: episode-1 (0%)
   ✅ Updated 4 progress bars
   ```
4. **Verify** hero section shows Episode 1
5. **Watch** some of Episode 1
6. **Refresh** page
7. **Verify** progress bar and time remaining updated
8. **Complete** Episode 1 (watch to 95%+)
9. **Refresh** page
10. **Verify** hero now shows Episode 2 with "Play" button

---

## 🐛 **Troubleshooting**

### **Hero section not updating:**
- Check all `data-hero-*` attributes are correct
- Check browser console for errors
- Verify user is signed in and has purchased
- Check `window.contentManager` exists in console

### **Progress bars not updating:**
- Verify `data-progress-bar` attribute on container
- Verify `data-video-id` matches exactly (`episode-1`, not `Episode-1`)
- Check direct child div exists for width update

### **Button text not changing:**
- Verify `data-hero-button-text` attribute
- Check if element is the text element (not icon wrapper)

---

## 📚 **Backend Deployment**

After adding Webflow attributes, deploy the backend:

```bash
firebase login --reauth
cd src/backend/functions
npm run build
firebase deploy --only functions
```

---

## 🎉 **Result**

Once configured, the system will:
- ✅ Automatically show the right episode in hero
- ✅ Update all progress bars on page load
- ✅ Change button text based on state
- ✅ Track completion and sequence episodes
- ✅ Calculate accurate time remaining

**No manual updates needed!** The system handles everything automatically based on user watch progress.

