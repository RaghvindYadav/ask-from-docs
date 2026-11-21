#!/usr/bin/env bash
# Downloads only the /docs folder of two Next.js releases into data/.
# Change the tags if you want different versions (check https://github.com/vercel/next.js/tags).
set -euo pipefail

V14_TAG="v14.2.15"
V15_TAG="v15.1.0"

mkdir -p data
fetch() {
  local tag=$1 dir=$2
  if [ -d "data/$dir" ]; then echo "data/$dir exists, skipping"; return; fi
  git clone --depth 1 --branch "$tag" --filter=blob:none --sparse \
    https://github.com/vercel/next.js "data/$dir"
  git -C "data/$dir" sparse-checkout set docs
  echo "Fetched $tag -> data/$dir/docs ($(find "data/$dir/docs" -name '*.mdx' | wc -l) .mdx files)"
}

fetch "$V14_TAG" nextjs-v14
fetch "$V15_TAG" nextjs-v15
