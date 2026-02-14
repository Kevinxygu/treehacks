We are building an agentic AI app for eldery people. Our app has a mobile app for the elderly, a web app for caretakers (family, doctors), a backend on vercel serverless compute.

We have four main features:
Feature 1: DATA CAPTURE + PREDICTION: We will capture health data from weareables like Whoop as well as audio data (see feature three for how we will capture some audio data) to provide real-time health data and insights (like deterioration in memory, speech performance) to the caretakers of the elders. We will use Vital Audio (startup) to get biometrics from audio samples.

Feature 2 -> INTERVENTION: Based on the health data, we will provide science-bakced interventions to prevent that decline. For example, through a mix of cognitive activities, suggested physical activity, suggested social activity. We will track adherence to plan and track specific cognitive metrics over time.

Feature 3 -> DAILY SUPPORT: Handle tasks via voice commands (e.g. help me view my vaccine history, help me order a new round of medicine, help me order groceries via Instacart etc.). We plan on using Vercel AI for the chatbot

Feature 4 -> COMPANIONSHIP: Personalized reminiscence therapy [Paul]
We will provide a weekly report (based on how Famileo does it).
This report will have four main regions

1. Elder previously

- Integration with photos (from phone)
- On device vision model to produce text/video descriptions
- Integration with youtube likes/watch history
- https://github.com/zvodd/Youtube-Watch-History-Scraper
- Integration with facebook likes/events
- Emails (eg. an email from a loved one)

2. Family previously

- Photos/videos w/ descriptions from family members (famileo style)

3. Elder currently (this week)
4. Family this week
5. Stretch feature: daily digest
