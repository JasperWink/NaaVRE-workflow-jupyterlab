#!/bin/bash

set -e

cat << EOF > policy.json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Effect": "Allow",
        "Resource": [
          "arn:aws:s3:::$BUCKET_NAME",
          "arn:aws:s3:::$BUCKET_NAME/*"
        ]
      }
    ]
  }
EOF

mc alias set minio/ \
  "$MINIO_SERVER_URL" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc mb "minio/$BUCKET_NAME" || echo "continuing"
mc admin accesskey create minio/ "$MINIO_ROOT_USER" \
  --policy policy.json \
  --access-key "$BUCKET_ACCESS_KEY" \
  --secret-key "$BUCKET_SECRET_KEY" \
  || echo "continuing"
