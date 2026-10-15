# CupidAgent — Autonomous Agentic Dating Platform

> **Overall Explanation (194 / 200 characters):**  
> `CupidAgent is an ethical dating platform where autonomous AI agents represent real people, analyzing their LinkedIn and Instagram to go on simulated dates and generate personalized compatibility ranks.`

> **Technical Section: Scraping Stack (442 / 500 characters):**  
> **Question:** *What tech stack did you use to scrape the person's Instagram and LinkedIn?*  
> `We use an ethical, rate-bounded ingestion pipeline built on Node.js/TypeScript with Cheerio and Playwright for public OpenGraph and schema.org metadata extraction, supplemented by an authenticated questionnaire fallback when platforms enforce CAPTCHAs or login walls. Raw profile text, public posts, and career milestones are structured via Zod schemas and normalized into evidence-backed embeddings for agent persona synthesis without unauthorized API bypass.`

---

## The Core Concept

Each person is represented by an AI agent that dates on their behalf. The agents date each other.

For every person, there are exactly two sources of information:
1. **LinkedIn public profile**
2. **Instagram public profile**

```
LinkedIn public profile
          +
Instagram public profile
          ↓
     The Agent
 reads both, analyzes the person
          ↓
    Profile Page
needs · hobbies · interests
          ↓
   The Agents Date
each agent dates on that person's behalf
          ↓
       Ranking
 who fits each person best
```

---

## YouTube Demo Video Storyboard (3 Minutes Max)

| Timestamp | Screen | Voiceover / Demo Flow |
| :--- | :--- | :--- |
| **0:00 – 0:50** | **Profile Pages First:** Open `/participants` and inspect Maya Chen's profile (`/participants/synth_01`). | *"Here are the 25 people, each found through their official LinkedIn and public Instagram. The agent reads both sources and produces a structured analysis: her core **Needs**, her **Hobbies**, and her creative **Interests**, with every claim verified back to the source."* |
| **0:50 – 1:55** | **The Agents Actually Dating:** Open `/dates` and open the date transcript between Maya & Julian. | *"Now we watch the agents actually go out and date on their behalf. This isn't just a score — both agents engage in a 6-turn date conversation, asking follow-up questions, discovering common passions (sustainable design and acoustics), and testing mutual life boundaries."* |
| **1:55 – 2:35** | **The Rankings:** Open `/rankings` for Maya. | *"Based on the date and profile analyses, the agent produces a directional compatibility ranking across all candidates from #1 to #24. Notice the transparent factor breakdown (interests 35%, goals 25%, date dialogue 20%, lifestyle 20%), and how explicit dealbreakers automatically reset scores to 0 with clear reasoning."* |
| **2:35 – 3:00** | **Live Website & Demo Link:** Open `/demo` and test `/participants/new`. | *"The `/demo` route opens the completed 25-person experiment with all 300 pairwise dates pre-seeded, and the site allows adding any new consenting person with their public links."* |

---

## Tech Stack & Architecture

- **Frontend & App Framework:** Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide Icons
- **Visual Design:** Instagram & Hinge styling (Story bar with gradient rings, prompt cards, DM-style date transcripts)
- **Validation:** Zod schemas
- **Database:** Durable file-backed atomic JSON store (`data/db.json`), persisting 25 participants, 300 simulated dates, and 600 rankings across server restarts
- **Dual Simulation Engine:**
  - Rule-based deterministic simulator (instant, zero-cost, reproducible)
  - Google Gemini LLM API adapter (server-side, bounded concurrency)
- **Virtual Environment:** Python 3.12 `.venv` with `pytest` suite testing the compatibility math

---

## Compatibility Formula (0–100)

$$\text{Raw Score} = 0.35 \times S_{\text{interests}} + 0.25 \times S_{\text{goals}} + 0.20 \times S_{\text{dialogue}} + 0.20 \times S_{\text{lifestyle}}$$

- **Shared Interests (35%):** Keyword & category overlap from Instagram hobbies and LinkedIn topics.
- **Stated Needs & Goals (25%):** Alignment of relationship objectives (commitment, marriage, creative partnership).
- **Date Dialogue (20%):** Conversational chemistry and turn quality extracted from the simulated date.
- **Lifestyle (20%):** Complementary pacing, humor, and daily habits.
- **Dealbreaker Override:** If candidate violates target's dealbreaker, score is penalized to **0**.

---

## Setup & Run Instructions

```powershell
# 1. Activate Python virtual environment
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Install Node dependencies & seed 25 people + 300 dates + 600 rankings
npm install
npm run seed

# 3. Build & start application
npm run build
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** (or preloaded demo at **[http://localhost:3000/demo](http://localhost:3000/demo)**).

---

## Test Commands

```powershell
# TypeScript unit tests (Vitest)
npm test

# Python compatibility tests (Pytest in .venv)
npm run test:python

# TypeScript type check
npm run typecheck

# Live E2E smoke tests against running server
npm run test:e2e
```
