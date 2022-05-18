FROM alpine:latest

RUN apk add --no-cache python3 openjdk11 sed git

WORKDIR /app
ADD . .

RUN sh build.sh

ENTRYPOINT ["python3", "serve.py"]
EXPOSE 8000
