[Devpost](https://devpost.com/software/bloom-dvjpea)

## Inspiration
One in six people will be over the age of 65 by 2030, and this will double by 2050. ([UN source] (https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/wpp2022_summary_of_results.pdf))

If we don't act fast, our healthcare systems will simply not be able to keep up with our aging world.

And let's face it: everyone can think of a time where they had to assist their grandparents with basic technology. Creating intuitive technology that's actually helpful for seniors is hard.

This is why we built a platform for seniors with agentic AI at its core. A platform that can assist with everyday tasks through familiar conversational language, detect early signs of cognitive decline through vocal indicators, share key health metrics through wearables to caretakers, and combat loneliness through reminiscence therapy.

This is AI serving human potential: preserving dignity, independence, and connection for so many elderly aging at home.

## What it does

Bloom is an AI caretaker that transforms how elderly individuals manage their health and stay connected. 

It has four core functions working together:

**1. Voice-First Task Assistant with Web Automation**

Seniors can make requests like "Book me an Uber" or "When is my doctor appointment?" and Bloom's **multi-turn conversational agent** handles everything. We used **Browserbase's Stagehand, Claude, and ElevenLabs to automate web navigation** across pharmacy websites, insurance portals, Uber, and healthcare systems.

**2. Cognitive Monitoring & Interventions**

75% of people with dementia go undiagnosed globally, and by the time families notice symptoms, 12-18 months of cognitive decline have already passed. ([source](https://www.alzint.org/news-events/news/over-41-million-cases-of-dementia-go-undiagnosed-across-the-globe-world-alzheimer-report-reveals/)) 

This is only one example. Detecting symptoms early is crucial.

During live calls and daily check-ins, Bloom analyzes speech patterns for early warning signs of cognitive decline using science-backed linguistic and acoustic markers identified through **OpenEvidence**: reduced speech rate, increased pauses, decreased lexical diversity, grammatical difficulties, word-finding problems (anomia), speech disfluency, and circumlocution patterns. 

Caretakers receive **structured clinical summaries** including cognitive health scores, annotated conversation transcripts highlighting concerning patterns, trend analysis over 7/30/90 days, and exportable reports for doctors. Bloom suggests specific cognitive exercises backed by clinical research based on cognitive scores that caretakers (with a Doctor's review) can assign to seniors.

**3. Proactive Companionship**

Bloom helps combat loneliness by sending out a personalized weekly report. The first part of the report provides reminiscence therapy by finding photos and videos from the senior's camera roll for a customizable number of years in the past to help them relive their most cherished moments. The second part provides photo and video highlights from the seniors' family's week by automatically pulling from media sent that week in the family groupchat.

**4. Real-Time Physical Health Dashboard**

By integrating with wearables like WHOOP, Bloom provides caretakers with comprehensive health metrics to better monitor patients and catch abnormalities early.

## How we built it

Bloom consists of two main components (with four Vercel deployments total).

**1. Elderly-Facing Mobile App (React Native + Expo)**

- **Frontend**: Voice-first conversational interface built with React Native and ElevenLabs, using expo-av for audio recording, expo-speech for text-to-speech, and @react-native-voice/voice for speech recognition
- **Agent Server**: Powered by **Anthropic's Claude**, orchestrating **multi-turn conversations** with context retention. The agent dynamically reasons about user state and conversation history to complete complex, multi-step tasks like medication management. Deployed to Vercel.
- **Complex Conversational LLMs**: We used **Vercel AI Gateway** for caching, observability, and a fallback to direct Anthropic API:
  - **Browserbase Stagehand**: Automates anything on the web like pharmacy refills (CVS, Walgreens), appointment booking, vaccine history retrieval, Uber calls from patient portals
  - **Gmail API**: Sends medication reminders, appointment confirmations
  - **MongoDB**: Stores user conversation history, medication lists, preferences

**2. Web App (Next.js, FastAPI, Node.js)**

- **Frontend**: Next.js deployed to Vercel.
  - Weekly report (Canvas) feature was created with React Flow

- **Backend**: FastAPI deployed to Vercel.
  - Our cognitive exercise recommendations are obtained by querying Claude with a science-backed policy obtained from research found through OpenEvidence.
  - WHOOP data is pulled using the WHOOP API from a Vercel workflow deployed as a serverless function.
  - WhatsApp groupchat media is obtained via the Beeper local API.

## Challenges we ran into

**Building a Natural Conversational Assistant**: Required a lot of prompt engineering to build an effective conversational AI agent for the elderly instead of one that just takes orders. We had to spend a little money on getting a voice that actually sounds human...

**Fine-tuning the Problem**: We spent a good amount of time really honing in on the problem (barely any code until 15hrs in!) and understanding what our users' pain points were. We read multiple research papers, which we hadn't done at hackathons before.

**Integrating with WhatsApp**. Turns out WhatsApp doesn't have a public API to retrieve media from group chats. Thus, in a true hackathon spirit, we hacked together a workaround by using Beeper's local API! Thank you amazing team at Beeper!

## Accomplishments that we're proud of

**Built a Production-Ready Healthcare Solution in 36 Hours**: From a conversational agentic voice interface to real-time cognitive analysis to WHOOP integration to WhatsApp integration, we're really proud of shipping a complex technical project with both a mobile and web app that was interesting and innovative for all of us!

**Using Vercel Workflows to sync WHOOP Data**:  We used Vercel's Workflows (Beta) to pull the data from WHOOP to enhance how we evaluate an elderly person's health profile! The workflow consists of steps to sync sleep, sync recovery, sync strain, and upload to MongoDB, and we liked how lightweight it was.

## What we learned
- Fine-tuning an idea before we start developing so we're all aligned and understand what to build.
- Learning how to build features around user stories, real pain points, and agreeing on those before continuing
- Vibe-coding tools!

## What's next for Bloom
- Fine tuning our evaluation criteria to be more accurate to the real world
- Unifying our currently separate servers to run on one instance for code readability and maintainability
- Shipping this to our local communities and supporting those that we love!
