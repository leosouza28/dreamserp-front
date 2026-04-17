sh commit.sh
ng build
gcloud config set account lsouzaus@gmail.com
gcloud config set project dreams-420512
gcloud app deploy app.yaml --quiet