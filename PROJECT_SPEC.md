# Tim Burton Docuseries Streaming Platform - Project Specification

## Project Overview
A streaming platform for a Tim Burton docuseries that allows users to rent or purchase episodes with region-based availability and anti-piracy measures.

## Core Features

### User Authentication & Management
- User account creation and sign-in
- **Google Sign-In integration**
- Modal-based authentication system
- **No social features** (no sharing, reviews, comments)
- **User dashboard with:**
  - Edit name and last name
  - Change email and password
  - Purchase history
  - Download Stripe receipts
  - **GDPR privacy controls** (data export, deletion)
- **Overview page shows rental countdown timer**

### Content Access Models
- **Rental**: $14.99 USD - 4-day access to all 4 episodes after purchase
- **Regular Purchase**: $24.99 USD - Permanent access to 4 episodes
- **Box Set Purchase**: $74.99 USD - 4 episodes + 40 hours of extras

### Content Structure
- 4 main docuseries episodes
- 40 hours of bonus/extras content (box set only)
- Episode detail pages with descriptions
- Extras tab for box set purchasers

### Regional Availability
- Region-locked content based on theatrical release schedule
- Some regions get theater release first, then streaming access
- Cloudflare-based region detection and blocking
- **Admin-configurable region management system** for easy updates
- **Known restrictions**: LATAM will not be available on first release (duration TBD)
- **Flexible system** to accommodate changing release schedules

### Content Management
- **Content updates**: Add to Mux → Update Webflow CMS collections
- **No user notifications** for content updates
- **Content scheduling**: Use Webflow scheduling when possible
- **Regional release scheduling**: Managed through corresponding services

## Technical Stack

### Frontend
- **Webflow**: Primary site design and structure
- Custom JavaScript for dynamic functionality
- Responsive design for all devices
- **English language only**
- **Legal pages**: Terms of service, privacy policy, disclaimers (separate Webflow pages)

### Backend & Services
- **Firebase/Firestore**: User management and data storage
- **Firebase Authentication**: Google Sign-In integration
- **Mux**: Video streaming and delivery (built-in analytics)
- **Stripe**: Payment processing (built-in analytics)
- **SendGrid**: Transactional emails (built-in analytics)
- **Cloudflare**: Region locking and security (built-in analytics)
- **Google Analytics**: Integrated through Webflow
- **Management**: Through individual service dashboards (no custom admin panel)

### Security & Anti-Piracy
- Cloudflare-based region detection
- **Signed URLs for video access** (time-limited, user-specific)
- User authentication required for all purchases
- Secure video streaming through Mux
- **Rental expiration enforcement** (content access disabled after 4 days)

### GDPR Compliance
- Cookie consent banners
- Data export functionality
- Right to be forgotten (data deletion)
- Data processing consent
- Privacy controls in user dashboard
- **Standard data retention practices** for streaming platforms

## User Flow

### Homepage
- Three primary buttons: Sign In, Rent, Buy
- **YouTube trailer embed** for preview content
- Clean, focused design
- Minimal free content (trailer only)

### Authentication Flow
- Sign In button opens modal
- **Google Sign-In button** in modal
- Sign Up option within modal
- Authentication required for all purchases

### Purchase Flow
- **Buy Button** → Shows two options:
  - Regular Purchase (4 episodes)
  - Box Set (4 episodes + 40 hours extras)
- **Rent Button** → Direct to rental purchase
- All purchases require authentication

### Content Viewing
- **Single overview page** with tab component:
  - **Episodes tab**: All 4 episodes with rental countdown timer
  - **Extras tab**: 40 hours of bonus content (box set purchasers only)
- Individual episode players with **resume functionality**
- **Progress indicators** showing viewing status
- User dashboard for account management

## Technical Requirements

### Video Streaming
- Mux integration for secure video delivery
- **1080p maximum quality** (720p, 480p adaptive)
- Adaptive bitrate streaming
- Mobile-optimized playback
- **Resume watching functionality** - track viewing progress
- **Subtitles support through Mux**
- **Signed URLs for video access** (enhanced security)
- DRM protection (if available through Mux)

### Payment Processing
- Stripe integration for secure payments
- USD currency only
- **Payment verification required** before content access
- Receipt generation and email delivery
- **Receipt download links** in user dashboard

### Email Communications
- SendGrid integration
- Welcome emails
- Purchase confirmations
- **Rental expiration notifications** (content access disabled)
- Password reset functionality

### Regional Management
- Cloudflare-based region detection
- **Admin-configurable region allowlists/blocklists** (easy to modify)
- Graceful handling of blocked regions
- **Database-driven region settings** for quick updates without code changes
- **LATAM blocking** on initial release (configurable duration)

## Security Considerations
- Secure authentication flow
- Protected video streams
- Region-based access control
- User data protection
- Payment security through Stripe

## Questions for Clarification

### Content & Business Model
1. ~~What is the pricing structure for rental vs. regular purchase vs. box set?~~ **ANSWERED: $14.99 rental, $24.99 regular, $74.99 box set (USD only)**
2. ~~Are there any promotional pricing or discount codes planned?~~ **ANSWERED: No promotional pricing or discount codes**
3. ~~What regions will have theater releases first, and what's the typical window before streaming access?~~ **ANSWERED: Unknown full calendar, need flexible admin system. LATAM blocked initially (duration TBD)**
4. ~~Will there be any free preview content or trailers?~~ **ANSWERED: YouTube trailer embed on homepage only**

### Technical Implementation
5. ~~Should the site support multiple languages or just English?~~ **ANSWERED: English only**
6. ~~What video quality options should be available (720p, 1080p, 4K)?~~ **ANSWERED: 1080p maximum, with adaptive streaming down to 480p**
7. ~~Do you need analytics tracking for user behavior and content consumption?~~ **ANSWERED: Use built-in analytics from each service (Mux, Stripe, SendGrid, Cloudflare)**
8. ~~Should there be a user dashboard to manage purchases and view history?~~ **ANSWERED: Yes - edit profile, purchase history, download Stripe receipts. Rental timer on overview page**

### User Experience
9. ~~Should users be able to resume watching from where they left off?~~ **ANSWERED: Yes - resume functionality with progress indicators**
10. ~~Do you want any social features (sharing, reviews, etc.)?~~ **ANSWERED: No social features**
11. ~~Should there be any content warnings or age restrictions?~~ **ANSWERED: No content warnings or age restrictions**
12. ~~Do you need any accessibility features (closed captions, audio descriptions)?~~ **ANSWERED: Subtitles through Mux only, no additional accessibility features**

### Content Management
13. ~~Will you need an admin panel to manage content, users, and regions?~~ **ANSWERED: No custom admin panel - manage through individual service dashboards**
14. ~~How will you handle content updates or new episodes?~~ **ANSWERED: Add to Mux → Update Webflow CMS collections. No user notifications**
15. ~~Do you need any content scheduling features?~~ **ANSWERED: Use Webflow scheduling when possible, regional releases through corresponding services**

### Legal & Compliance
16. ~~What are the specific terms of service and privacy policy requirements?~~ **ANSWERED: Separate legal pages in Webflow (terms, privacy policy, disclaimers)**
17. ~~Do you need GDPR compliance features?~~ **ANSWERED: Yes - cookie consent, data export, right to be forgotten, privacy controls**
18. ~~Are there any specific data retention requirements?~~ **ANSWERED: Follow standard practices for streaming platforms**

### Marketing & Analytics
19. ~~Do you need integration with any marketing tools (Google Analytics, Facebook Pixel, etc.)?~~ **ANSWERED: Google Analytics through Webflow + built-in analytics from each service**
20. ~~Should there be any referral or affiliate program features?~~ **ANSWERED: No referral or affiliate programs**
21. ~~Do you need any A/B testing capabilities?~~ **ANSWERED: No A/B testing**

## Specification Complete ✅

All questions have been answered and the specification is now complete. The project is ready for development with the following key features:

### Summary of Key Decisions:
- **Pricing**: $14.99 rental, $24.99 regular, $74.99 box set (USD only)
- **No promotional pricing** or discount codes
- **Flexible regional management** with LATAM initially blocked
- **YouTube trailer** on homepage only
- **English only** language support
- **1080p max quality** with adaptive streaming
- **Google Sign-In integration** via Firebase Authentication
- **Single overview page** with tabbed interface (Episodes/Extras)
- **Signed URLs** for enhanced video security
- **Payment verification required** before content access
- **Rental expiration enforcement** (4-day limit)
- **Built-in analytics** from each service + Google Analytics through Webflow
- **User dashboard** with profile management and purchase history
- **Resume watching** functionality with progress indicators
- **No social features** or A/B testing
- **GDPR compliance** with standard data retention practices
- **Webflow-based legal pages** and content management
- **No custom admin panel** - manage through service dashboards
