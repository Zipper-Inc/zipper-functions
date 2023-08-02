echo \
"-v NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST=$(dotenv -p RENDER_ZIPPER_DOT_DEV_HOST| cut -b 20-).zpr.dev" \
"-v NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST=$(dotenv -p RENDER_ZIPPER_DOT_RUN_HOST| cut -b 20-).zpr.run" \
"-v PUBLICLY_ACCESSIBLE_RPC_HOST=$(dotenv -p RENDER_DOT_DEV_HOST).onrender.com" \
"-v NEXTAUTH_URL=https://$(dotenv -p RENDER_ZIPPER_DOT_DEV_HOST| cut -b 20-).zpr.dev" \
"-v NODE_ENV=production"
