# PhishGuard AI

Build a modern PWA called PhishGuard Lite on Bubble.io.

Purpose: Help users detect phishing links and learn cybersecurity through AI.

Features:

OTP-based one-time sign-up/login via email or phone.

Responsive, fast, mobile-friendly UI with Dark/Light mode.

Dashboard showing user activity, quiz scores, saved notes, recent analyses, and learning progress.

Phishing Analyzer

User pastes a URL and clicks Analyze.

AI checks SSL, domain reputation, redirects, typosquatting, suspicious keywords, shortened links, impersonation attempts, and URL structure.

Return:

Safe / Suspicious / Dangerous

Risk score (0–100)

Detailed explanation

Recommended action

Cybersecurity AI Tutor

OpenAI-powered chatbot.

Answers cybersecurity questions from beginner to advanced level.

Explains concepts, attacks, tools, certifications, networking, ethical hacking, phishing, malware, cloud security, and best practices.

Supports chat history and suggested follow-up questions.

Notes

Built-in notepad.

Create, edit, delete, search, and auto-save notes.

Organize notes by category.

Quiz System

Difficulty levels: Beginner, Intermediate, Advanced, Expert.

Multiple choice, True/False, and fill-in-the-blank questions.

Instant scoring, explanations, progress tracking, and leaderboard.

Users can select topic and difficulty.

Resources

Cybersecurity articles, tutorials, tips, and learning materials.

Search and filter options.

Database:

Users

Phishing Analyses

AI Chats

Notes

Quiz Questions

Quiz Results

Security:

HTTPS

OTP verification

Rate limiting

Encrypted data

Input validation

Secure API handling

Session management

UI/UX:

Clean cyber-themed design.

Interactive charts and statistics.

Fast loading (<2 seconds).

Smooth navigation.

Modern cards and dashboards.

Goal: Create a smart, lightweight cybersecurity platform that combines phishing detection, AI learning, note-taking, and adaptive quizzes in one secure and user-friendly application.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://phishguard-lite.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0c7e790e-7857-4cf3-8ef7-a9008faf0865).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
