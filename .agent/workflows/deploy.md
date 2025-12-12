---
description: Build, Deploy to GAS, and Push to GitHub
---

1. Build the frontend to ensure no errors
   `npm run build --workspace=frontend`

2. Push the backend code to Google Apps Script
   // turbo
   `cd backend && clasp push`

3. Update the existing deployment to Google Apps Script (Web App)
   // turbo
   `cd backend && clasp deploy -i AKfycbxdqZBzJm-TscH3ed7HsG9jBqK1hBQzCKqgJ1qngz42TERjOqju2jQqu3m1KRw49avX5Q -d "Update application"`

4. Stage all changes for git
   // turbo
   `git add .`

5. Commit changes (ask user for message if not provided, else default)
   `git commit -m "Update application"`

6. Push to GitHub (Triggers GitHub Pages deploy)
   // turbo
   `git push`
