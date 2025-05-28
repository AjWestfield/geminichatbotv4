#!/bin/bash

# Script to add nvm to shell configuration

echo "Adding nvm to your shell configuration..."

# Add to .zshrc if using zsh
if [ "$SHELL" = "/bin/zsh" ]; then
    echo "" >> ~/.zshrc
    echo "# NVM Configuration" >> ~/.zshrc
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm' >> ~/.zshrc
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion' >> ~/.zshrc
    echo "✓ Added nvm configuration to ~/.zshrc"
    echo "Run 'source ~/.zshrc' to apply changes"
fi

# Add to .bash_profile if using bash
if [ "$SHELL" = "/bin/bash" ]; then
    echo "" >> ~/.bash_profile
    echo "# NVM Configuration" >> ~/.bash_profile
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bash_profile
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm' >> ~/.bash_profile
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion' >> ~/.bash_profile
    echo "✓ Added nvm configuration to ~/.bash_profile"
    echo "Run 'source ~/.bash_profile' to apply changes"
fi
