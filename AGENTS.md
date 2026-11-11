# Application rules

- Lesson queries must render terminal errors and progression-lock recovery separately from pending state, and must not automatically retry generation; this prevents endless loading and duplicate AI requests.
