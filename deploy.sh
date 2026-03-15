sh commit.sh
ng build
gcloud config set account lsouzaus@gmail.com
gcloud config set project lsdevelopers
gcloud app deploy app.yaml --quiet