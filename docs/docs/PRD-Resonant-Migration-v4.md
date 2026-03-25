# Product Requirements Document
## Resonant Migration v4.0 - AI-Powered Audio Art Platform

**Document Owner:** Oscar Mejía
**Last Updated:** February 4, 2026
**Status:** Draft
**Target Release:** Q2 2026

---

## Executive Summary

Resonant Migration v4 transforms our audio-reactive generative art experiment into a full platform where users can create, share, and discover unique audio-visual experiences. Building on v3's success with session-based randomization and mobile-first design, v4 introduces user accounts, a community gallery, and AI-powered art generation.

**Key Impact:** Enable creators to build and monetize audio-visual NFTs while growing our user base from 5K monthly visitors to 50K+.

---

## Problem Statement

### Current State (v3)
- ✅ Beautiful audio-reactive art
- ✅ Mobile-optimized UI
- ✅ Session-based randomization
- ❌ No way to save/share creations
- ❌ No community discovery
- ❌ Limited customization options
- ❌ No monetization for creators

### User Pain Points
1. **Creators:** "I made something beautiful but can't save it or share it permanently"
2. **Collectors:** "I want to discover and collect unique pieces but there's no marketplace"
3. **Musicians:** "I want my music visualized uniquely but can't customize parameters"

---

## Goals & Success Metrics

### Primary Goals
1. **User Retention:** Enable users to return and build collections
2. **Community Growth:** Create a discoverable gallery of user creations
3. **Creator Revenue:** Enable monetization through NFT sales

### Success Metrics
| Metric | Current (v3) | Target (v4) | Timeline |
|--------|--------------|-------------|----------|
| Monthly Active Users | 5K | 50K | 6 months |
| Avg. Session Duration | 2m 30s | 8m | 3 months |
| User Accounts Created | 0 | 10K | 6 months |
| Artworks Created | N/A | 100K | 6 months |
| NFTs Minted | 0 | 500 | 6 months |

---

## Target Audience

### Primary Personas

**1. The Creator (60% of users)**
- Age: 25-40
- Background: Digital artists, musicians, creative coders
- Motivation: Express creativity, build portfolio, earn from art
- Pain: Lack of tools to create audio-visual art without coding

**2. The Collector (30% of users)**
- Age: 28-45
- Background: NFT collectors, music lovers, art enthusiasts
- Motivation: Discover unique pieces, support artists
- Pain: Hard to find quality generative art platforms

**3. The Explorer (10% of users)**
- Age: 18-65
- Background: Casual users discovering through social media
- Motivation: Fun, experimentation, sharing on social
- Pain: Most generative art is too complex or boring

---

## Core Features (v4)

### Feature 1: User Accounts & Profiles
**Priority:** P0 (Must Have)

**User Story:** As a creator, I want to save my creations and build a portfolio so others can discover my work.

**Functionality:**
- OAuth login (Google, Twitter, Wallet Connect)
- User profile with bio, avatar, social links
- Personal gallery of created artworks
- Follow/follower system
- Activity feed

**Technical Requirements:**
- Supabase for auth & database
- Profile pages: `/user/[username]`
- Real-time follow counts
- Image CDN for avatars (Cloudflare)

**Acceptance Criteria:**
- [ ] Users can sign up in <30 seconds
- [ ] Profiles load in <1 second
- [ ] Users can edit profile without page reload
- [ ] OAuth works on mobile browsers

---

### Feature 2: Save & Share Artworks
**Priority:** P0 (Must Have)

**User Story:** As a creator, I want to save the exact state of my artwork so I can share it or mint it as an NFT.

**Functionality:**
- "Save Artwork" button captures:
  - Audio file (or Spotify link)
  - Visual parameters (seed, colors, patterns)
  - Timestamp of creation
  - Device info (for reproducibility)
- Generate shareable link: `resonant-migration.vercel.app/art/[id]`
- Artwork detail page with:
  - Live playback of saved state
  - Creator attribution
  - Creation metadata
  - Like/comment functionality

**Technical Requirements:**
- Store artwork metadata in Supabase
- Audio files stored in Cloudflare R2
- Generate unique artwork IDs (nanoid)
- Render saved state deterministically
- OG meta tags for social sharing

**Acceptance Criteria:**
- [ ] Artworks save in <3 seconds
- [ ] Shared links load artwork exactly as saved
- [ ] Works with both uploaded audio and Spotify
- [ ] Mobile share sheet integration

---

### Feature 3: Community Gallery
**Priority:** P0 (Must Have)

**User Story:** As a collector, I want to discover amazing artworks created by the community.

**Functionality:**
- Gallery page: `/gallery`
- Filter by:
  - Trending (24h, 7d, all time)
  - Recent
  - Most liked
  - Genre (electronic, ambient, classical, etc.)
- Search by creator, title, audio source
- Infinite scroll loading
- Grid/list view toggle

**Technical Requirements:**
- Elasticsearch for search
- Redis for trending calculations
- Pagination (20 items per page)
- Lazy loading images
- Real-time like counts (WebSocket)

**Acceptance Criteria:**
- [ ] Gallery loads <2 seconds
- [ ] Trending updates every 15 minutes
- [ ] Search returns results in <500ms
- [ ] Supports 1M+ artworks

---

### Feature 4: AI-Powered Customization
**Priority:** P1 (Should Have)

**User Story:** As a creator, I want to describe my vision in natural language and have the AI generate matching visual parameters.

**Functionality:**
- "AI Prompt" input field
- Example prompts:
  - "Cosmic nebula with purple and blue swirls"
  - "Aggressive industrial with sharp edges"
  - "Peaceful ocean waves at sunset"
- AI generates:
  - Color palette
  - Pattern algorithm
  - Motion parameters
  - Particle density
- Preview before applying
- Save prompt with artwork

**Technical Requirements:**
- OpenAI GPT-4 for prompt understanding
- Mapping layer: prompt → p5.js parameters
- Parameter presets database
- A/B testing different prompt styles

**Acceptance Criteria:**
- [ ] AI responds in <3 seconds
- [ ] 80% of prompts generate visually coherent results
- [ ] Users can iterate on AI suggestions
- [ ] Works with both English and Spanish

---

### Feature 5: NFT Minting
**Priority:** P2 (Nice to Have)

**User Story:** As a creator, I want to mint my artwork as an NFT so I can sell it and prove ownership.

**Functionality:**
- "Mint as NFT" button on artwork page
- Blockchain: Solana (low fees, fast)
- NFT includes:
  - Artwork metadata (JSON)
  - Thumbnail image (PNG)
  - Link to live playback
  - Creator royalties (10%)
- Marketplace integration (Magic Eden)
- Wallet connection (Phantom, Solflare)

**Technical Requirements:**
- Metaplex NFT standard
- IPFS for metadata storage
- Smart contract for royalties
- Gas fee estimation
- Transaction status tracking

**Acceptance Criteria:**
- [ ] Minting costs <$0.50
- [ ] Minting completes in <30 seconds
- [ ] NFTs appear in wallet immediately
- [ ] Royalties work on secondary sales

---

## Technical Architecture

### Stack Changes from v3
| Component | v3 | v4 |
|-----------|-------|-------|
| Frontend | p5.js + Vanilla JS | Next.js 14 + p5.js |
| Backend | None | Supabase (PostgreSQL) |
| Auth | None | Supabase Auth + OAuth |
| Storage | None | Cloudflare R2 |
| Search | None | Elasticsearch |
| Blockchain | None | Solana |
| Hosting | Vercel | Vercel |

### Database Schema (Key Tables)

**users**
- id, username, email, avatar_url, bio, created_at

**artworks**
- id, user_id, title, audio_url, parameters (JSONB), likes_count, created_at

**likes**
- user_id, artwork_id, created_at

**follows**
- follower_id, following_id, created_at

### API Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/user/[id]
POST   /api/artworks/create
GET    /api/artworks/[id]
GET    /api/gallery?filter=trending&limit=20
POST   /api/artworks/[id]/like
POST   /api/artworks/[id]/mint
```

---

## User Flow

### New User Journey
1. **Discovery:** User lands on homepage → sees featured artworks autoplay
2. **Exploration:** Clicks "Try It" → uploads audio or connects Spotify
3. **Creation:** Sees live audio-reactive art → tweaks parameters
4. **Engagement:** Loves result → prompted to sign up to save
5. **Retention:** Signs up → saves artwork → shares on Twitter → explores gallery

### Creator Journey
1. Sign in
2. Upload audio track
3. Optional: Use AI prompt to customize
4. Preview and adjust parameters
5. Save artwork
6. Share on social media
7. Optional: Mint as NFT
8. Track likes and views

---

## Design Guidelines

### Visual Style (v4 Refresh)
- **Color Palette:** Dark mode primary
  - Background: `#0a0a0f` (deep purple-black)
  - Primary: `#7c3aed` (vibrant purple)
  - Accent: `#06b6d4` (cyan)
  - Text: `#f8fafc` (off-white)

- **Typography:**
  - Headers: Inter, 700 weight
  - Body: Inter, 400 weight
  - Mono: JetBrains Mono (for metadata)

- **Components:**
  - Glassmorphism cards
  - Smooth animations (Framer Motion)
  - Micro-interactions on hover
  - Skeleton loaders for content

### Mobile-First Principles (Carried from v3)
- Touch targets ≥44px
- Single-column layout on mobile
- Bottom navigation bar
- Swipe gestures for gallery

---

## Timeline & Milestones

### Phase 1: Foundation (Weeks 1-4)
- ✅ Setup Next.js + Supabase
- ✅ User authentication
- ✅ Database schema
- ✅ Basic profile pages

### Phase 2: Core Features (Weeks 5-10)
- ⏳ Save/share artworks
- ⏳ Community gallery
- ⏳ Like/follow system
- ⏳ Search functionality

### Phase 3: AI & Polish (Weeks 11-14)
- ⏳ AI customization
- ⏳ UI refinements
- ⏳ Performance optimization
- ⏳ Mobile testing

### Phase 4: NFT Integration (Weeks 15-18)
- ⏳ Solana wallet connection
- ⏳ Minting functionality
- ⏳ Marketplace integration
- ⏳ Launch marketing

**Target Launch:** May 15, 2026

---

## Risks & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Audio processing on mobile crashes | High | Medium | Implement web workers, reduce sample rate |
| Supabase free tier limits | Medium | High | Plan for paid tier at 5K users |
| AI prompts generate ugly results | Medium | Medium | Build quality training dataset, A/B test |
| NFT gas fees too high | Low | Low | Use Solana (already cheap) |

### Business Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Low user adoption | High | Pre-launch waitlist, influencer partnerships |
| Creator churn | High | Implement creator rewards program |
| Copyright issues with audio | Medium | Clear ToS, DMCA process |

---

## Open Questions

1. **Monetization Model:**
   - Should we take a % of NFT sales?
   - Free tier limits? (e.g., 10 artworks/month)
   - Premium features? (AI prompts, HD exports)

2. **Content Moderation:**
   - How to handle inappropriate audio/titles?
   - Automated flagging system?
   - Community reporting?

3. **Audio Licensing:**
   - Partner with music platforms (Spotify, SoundCloud)?
   - DMCA compliance strategy?
   - License popular tracks directly?

---

## Appendix

### Competitive Analysis
- **Cimática (Web3 audio visualizer):** Less customization, no community
- **Artblocks (Generative NFTs):** No audio focus, higher barrier to entry
- **Butterchurn (Winamp visualizer):** Nostalgic but dated UX

### User Research Findings
- 78% of beta users want to save creations (n=50)
- 65% would pay for AI customization features
- 42% interested in minting NFTs
- Average willingness to pay: $3-5/month for premium

### Related Documents
- [v3 Launch Retrospective](link)
- [User Interview Notes](link)
- [Technical Spec - Supabase Integration](link)

---

**Questions or Feedback?** DM @oscarmexias or comment in this doc.
