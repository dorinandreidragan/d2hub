---
title: "remote tunnel to a web server"
date: 2024-02-04
category:
  - devops
order: 2
tag:
  - vscode
  - devops
  - wsl
  - docker
  - remote
summary: "Connect to a remote web server using Microsoft Dev Tunnels for secure development access."
---

<ArticleStatusBadge />

# remote tunnel to a web server

This document describes how to use [Microsoft Dev tunnels][dev-tunnels] to connect to a web server
running on a remote machine.

Imagine this scenario: you are working on a web application that is running on your local
machine, and you want to show it to a friend or a colleague. You can use this feature to share your
local web server with them.

In order to do that, you first need to have a Microsoft or a GitHub account. In this document, I am
using a Microsoft account.

Let's get started!

## step 1 - Install devtunnel CLI

Run the following command to install the `devtunnel` CLI:

```bash
curl -sL https://aka.ms/DevTunnelCliInstall | bash
```

See [Install the DevTunnel CLI][install-devtunnel-cli] for more information.

## step 2 - Start a web server on your local machine

In this example, I am using a simple web server that serves a static HTML page. You can use any web
server you want.

```bash
# Create a simple HTML page that says "Hello World"
echo "Hello World" > index.html

# Start a simple web server that serves the index.html file
python3 -m http.server 8080
```

## step 3 - Create a devtunnel to the web server

- Login to your Microsoft account using device code authentication:

  ```bash
  devtunnel user login -d
  ```

- Create a temporary devtunnel to the web server on port 8080, and allow anonymous access:

  ```bash
  devtunnel host -p 8080 --allow-anonymous
  ```

## Step 4 - Access the web server from the browser

- Open your browser and navigate to the URL that was printed in the previous step.
- You should see the "Hello World" page.

[dev-tunnels]: https://aka.ms/devtunnels
[install-devtunnel-cli]: https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started?tabs=linux#install
