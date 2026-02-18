#!/bin/bash
set -e

echo "Building..."
npx vite build

echo "Copying dist to temp..."
TEMP_DIR=$(mktemp -d)
cp -r dist/* "$TEMP_DIR"

echo "Switching to dist branch..."
git checkout dist

echo "Replacing contents..."
# Remove everything except .git
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

# Copy build output in
cp -r "$TEMP_DIR"/* .
rm -rf "$TEMP_DIR"

echo "Committing and pushing..."
git add -A
git commit -m "Deploy $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin dist

echo "Switching back to main..."
git checkout main

echo "Done! Deployed to dist branch."
