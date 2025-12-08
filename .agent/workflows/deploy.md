---
description: Build, Deploy to GAS, and Push to GitHub
---

1. Build the frontend to ensure no starts
   `npm run build --workspace=frontend`

2. Push the backend code to Google Apps Script
   // turbo
   `cd backend && clasp push`

3. Deploy a new version to Google Apps Script (Web App)
   // turbo
   `cd backend && clasp deploy`

4. Stage all changes for git
   // turbo
   `git add .`

5. Commit changes (ask user for message if not provided, else default)
   `git commit -m "Update application"`

6. Push to GitHub (Triggers GitHub Pages deploy)
   // turbo
   `git push`
