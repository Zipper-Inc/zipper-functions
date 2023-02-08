#!/bin/sh

# the master env file should be in the root as .env.local

echo "🔗 Linking .env files"

ENV_FILE=".env.local"

if [ -f ./$ENV_FILE ]
then
    ln -sf ../../$ENV_FILE ./apps/zipper.works/.env
    ln -sf ../../$ENV_FILE ./apps/zipper.works/.env.local
    echo "🎉 .env files linked for zipper.works"

    ln -sf ../../$ENV_FILE ./apps/zipper.run/.env.local
    echo "🎉 .env file linked for zipper.run"
    
else
    echo "🙈 Missing $ENV_FILE"
    exit 1
fi
