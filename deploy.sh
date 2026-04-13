#!/bin/bash

read -p "Digite a mensagem de commit: " commit_message

# Automatização de deploy
# npm run build = css:build (Tailwind) + zola build
npm run build && \
git add . && \
git commit -m "$commit_message" && \
git push origin main
