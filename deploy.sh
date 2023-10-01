#!/bin/bash

read -p "Digite a mensagem de commit: " commit_message

# Automatização de deploy
zola build && \
git add . && \
git commit -m "$commit_message" && \
git push origin main
