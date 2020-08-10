---
id: developer
title: Developing erxes
sidebar_label: Developer
---

This document describes how to set up your development environment to develop and test Erxes. It also explains the basic mechanics of using `git`, `node`, and `yarn`.

- [Prerequisite Software](#prerequisite-software)
- [Using Docker-Compose](#using-docker-compose)
- [Configure Environments](#configure-environments)
- [Docker Compose Up](#docker-compose-up)
- [Setup API](#setup-api)
- [Setup Frontend](#setup-frontend)
- [Checkout running website](#checkout-running-website)

See the [contribution guidelines](contributing) if you'd like to contribute to erxes.

## Prerequisite Software

Before you can develop and test erxes, you must install and configure the following products on your development machine. You can also skip this section if you want to use a docker environment. See below.

- [Git](http://git-scm.com/) and/or the **GitHub app** (for [Mac](http://mac.github.com) or [Windows](http://windows.github.com)); [GitHub's Guide to Installing Git](https://help.github.com/articles/set-up-git) is a good source of information.
- [Node.js](http://nodejs.org), v10.x LTS which is used to run a development web server, run tests, and generate distributable files.
- [Yarn](https://yarnpkg.com) which is used to install dependencies.
- [MongoDB](https://www.mongodb.com) version 3.6.x
- [RabbitMQ](https://www.rabbitmq.com/download.html) version 3.8.x
- [Redis](https://redis.io) version 3.x +

## Using Docker-Compose
You can can develop Erxes inside of a docker environment (without having to install Mongo and the rest of the tools on your local computer).

First, you need to fork the [erxes](https://github.com/erxes/erxes) repo (frontend), and the the [erxes-api](https://github.com/erxes/erxes-api) repo (backend). 

Next go into the `erxes` folder and copy the following `docker-compose.yml` to the root:

```yml
version: "3"
services:
  mongo:
    image: mongo:3.6.13
    container_name: mongo
    restart: unless-stopped
    healthcheck:
      test: echo 'db.stats().ok' | mongo localhost:27017/test --quiet
      interval: 2s
      timeout: 2s
      retries: 200
    networks:
      - erxes-net
    # MongoDB data will be saved into ./mongo-data folder.
    volumes:
      - ./mongo-data:/data/db

  redis:
    image: "redis"
    container_name: redis
    networks:
      - erxes-net

  rabbitmq:
    image: rabbitmq:3.7.17-management
    container_name: rabbitmq
    restart: unless-stopped
    hostname: rabbitmq
    ports:
      - "127.0.0.1:15672:15672"
    networks:
      - erxes-net
    # RabbitMQ data will be saved into ./rabbitmq-data folder.
    volumes:
      - ./rabbitmq-data:/var/lib/rabbitmq

  elasticsearch:
    image: "docker.elastic.co/elasticsearch/elasticsearch:7.5.2"
    container_name: "elasticsearch"
    environment:
      - discovery.type=single-node
    ports:
      - "127.0.0.1:9200:9200"
    networks:
      - erxes-net
    volumes:
      - ./elasticsearchData:/usr/share/elasticsearch/data

  kibana:
    image: "docker.elastic.co/kibana/kibana:7.5.2"
    container_name: "kibana"
    ports:
      - "127.0.0.1:5601:5601"
    networks:
      - erxes-net

  elksyncer:
    image: "erxes/erxes-elksyncer:0.16.2"
    container_name: "elksyncer"
    env_file: ../erxes-api/elkSyncer/.env
    depends_on:
      - "mongo"
      - "elasticsearch"
    volumes:
      - ../erxes-api/elkSyncer:/elkSyncer
    command: bash -c "./wait-for.sh -t 60 mongo:27017 && ./wait-for.sh -t 60 elasticsearch:9200 && python main.py"
    networks:
      - erxes-net

  erxes-api:
    container_name: "erxes-api"
    build:
      dockerfile: ./Dockerfile.dev
      context: ../erxes-api
    volumes:
      - /erxes-api/node_modules
      - /erxes-api/.git
      - ../erxes-api/:/erxes-api
    env_file: ../erxes-api/.env
    depends_on:
      - "mongo"
      - "redis"
      - "rabbitmq"
      - "elasticsearch"
    ports:
      - "3300:3300"
    networks:
      - erxes-net

  erxes-ui:
    image: erxes/erxes:0.14.1
    container_name: erxes
    restart: unless-stopped
    build:
      dockerfile: ./Dockerfile.dev
      context: ../erxes/ui/
    ports:
      - "3000:80"
    networks:
      - erxes-net

  erxes-crons:
    image: erxes/erxes-api:0.14.1
    container_name: erxes-crons
    entrypoint: ["node", "--max_old_space_size=8192", "dist/cronJobs"]
    restart: unless-stopped
    environment:
      # erxes-crons
      PORT_CRONS: "3600"
      NODE_ENV: production
      PROCESS_NAME: crons
      DEBUG: "erxes-crons:*"
      # MongoDB
      MONGO_URL: mongodb://mongo/erxes
      # Redis
      REDIS_HOST: redis
      REDIS_PORT: "6379"
      REDIS_PASSWORD: ""
      # RabbitMQ
      RABBITMQ_HOST: "amqp://guest:guest@rabbitmq:5672/erxes"
    depends_on:
      mongo:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - erxes-net

  erxes-workers:
    image: erxes/erxes-api:0.14.1
    container_name: erxes-workers
    entrypoint:
      [
        "node",
        "--max_old_space_size=8192",
        "--experimental-worker",
        "dist/workers",
      ]
    restart: unless-stopped
    environment:
      # erxes-workers
      PORT_WORKERS: "3700"
      JWT_TOKEN_SECRET: token
      NODE_ENV: production
      DEBUG: "erxes-workers:*"
      # MongoDB
      MONGO_URL: mongodb://mongo/erxes
      # Redis
      REDIS_HOST: redis
      REDIS_PORT: "6379"
      REDIS_PASSWORD: ""
      # RabbitMQ
      RABBITMQ_HOST: "amqp://guest:guest@rabbitmq:5672/erxes"
    depends_on:
      mongo:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - erxes-net

  erxes-widgets:
    image: erxes/erxes-widgets:0.14.1
    container_name: erxes-widgets
    restart: unless-stopped
    environment:
      # erxes-widgets
      PORT: "3200"
      ROOT_URL: http://localhost:3200
      API_URL: http://localhost:3300
      API_SUBSCRIPTIONS_URL: ws://localhost:3300/subscriptions
    ports:
      - "3200:3200"
    networks:
      - erxes-net

  erxes-integrations:
    image: erxes/erxes-integrations:0.10.3
    container_name: erxes-integrations
    restart: unless-stopped
    environment:
      PORT: "3400"
      NODE_ENV: production
      DEBUG: "erxes-integrations:*"
      # public urls
      DOMAIN: http://localhost:3400
      MAIN_APP_DOMAIN: http://localhost:3000
      MAIN_API_DOMAIN: http://localhost:3300
      # non public urls
      # MongoDB
      MONGO_URL: mongodb://mongo/erxes_integrations
      # RabbitMQ
      RABBITMQ_HOST: "amqp://guest:guest@rabbitmq:5672/erxes"
      # Redis
      REDIS_HOST: redis
      REDIS_PORT: "6379"
      REDIS_PASSWORD: ""
    ports:
      - "3400:3400"
    depends_on:
      mongo:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - erxes-net

  erxes-logger:
    image: erxes/erxes-logger:0.10.0
    container_name: erxes-logger
    restart: unless-stopped
    environment:
      PORT: "3800"
      DEBUG: "erxes-logs:*"
      # MongoDB
      MONGO_URL: mongodb://mongo/erxes_logs
      # RabbitMQ
      RABBITMQ_HOST: "amqp://guest:guest@rabbitmq:5672/erxes"
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - erxes-net

  erxes-engages:
    image: erxes/erxes-engages-email-sender:0.10.0
    container_name: erxes-engages
    restart: unless-stopped
    environment:
      PORT: "3900"
      NODE_ENV: production
      DEBUG: "erxes-engages:*"
      # public urls
      MAIN_API_DOMAIN: http://localhost:3300
      # MongoDB
      MONGO_URL: mongodb://mongo/erxes_engages
      # RabbitMQ
      RABBITMQ_HOST: "amqp://guest:guest@rabbitmq:5672/erxes"
      # Redis
      REDIS_HOST: redis
      REDIS_PORT: "6379"
      REDIS_PASSWORD: ""
    depends_on:
      mongo:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - erxes-net
networks:
  erxes-net:
    driver: bridge
```

## Configure Environments

1. Go into the `erxes-api` folder and run

```sh
# Copy preconfigured environment variables:
cp .env.sample .env
```

2. Go into the `erxes/ui` folder and run 
```sh
# Copy preconfigured environment variables:
cp .env.sample .env
```

3. Go into  `erxes-api/elkSyncer` and run
```sh
# Copy preconfigured environment variables:
cp .env.sample .env
```

## Docker Compose Up
Go into `erxes` and run `docker-compose up`. This will take a while to pull and build all the images

## Setup API
Go into `erxes-api` and run

```bash
# Install deps
yarn install

# Create admin user & save the returned password
yarn initProject

# Load sample data
yarn loadInitialData

# Run
yarn dev
```

## Setup Frontend
Go into `erxes/ui` and run

```bash
# Install dependencies (package.json)
yarn install

# Run
yarn start
```

## Checkout running website

Visit http://localhost:3000 and login using following credentials

```
username: admin@erxes.io
password: the password generated during initProject
```
