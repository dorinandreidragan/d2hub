---
title: "development with vscode remote tunnels"
date: 2024-02-04
category:
  - devops
order: 1
tag:
  - vscode
  - devops
  - wsl
  - docker
  - remote
summary: "Use VSCode Remote Tunnels to develop on remote machines, WSL2, or Docker from anywhere."
---

<ArticleStatusBadge />

# development with vscode remote tunnels

Discover the flexibility of [VSCode Remote Tunnels][remote-tunnels], enabling work on remote
machines, WSL2 instances, or Docker containers, not just through VSCode Desktop but also via web
browsers.

Let's delve into two scenarios:

**Scenario 1**: Quantum Leap 🌌

Ever faced the frustration of working on a machine seemingly light-years away? The hassle of
installing a VPN client and navigating an RDP disrupts your workflow. With [VSCode Remote
Tunnels][remote-tunnels], you can run VSCode Desktop on that distant machine without cluttering your
own.

**Scenario 2**: Mobile Marvels 📲

Imagine being far from your laptop when an urgent task arises that demands your machine. Stress
levels rising? No worries! Utilize [VSCode Remote Tunnels][remote-tunnels] to efficiently handle
tasks from your tablet or smartphone.

To embark on this journey, ensure you have a Microsoft or GitHub account. Follow the steps to work
remotely on:

- Remote machine 🌐
- WSL2 Instance 🚧
- Docker container 🐋

## remote machine 🌐

### step 1 - install code cli

Ensure the code CLI is installed. If VSCode is absent on the remote machine or lacks a UI, perform a
[standalone install].

### step 2 - enable remote tunnel access

Preferably through the command line, log in to your Microsoft account:

```bash
code tunnel user login --provider microsoft
```

Initiate the tunnel:

```bash
code tunnel service install --accept-server-license-terms --name "remote-tunnel"
```

### Step 3 - Connect to Remote Machine

#### Step 3a - Browser Connection

- Open [vscode.dev] in your browser.
- Press `Ctrl+Shift+P` and select `Remote-Tunnels: Connect to Tunnel...`.
- Choose Microsoft Account and log in.
- Select the desired code tunnel created in [Step 2](#step-2---enable-remote-tunnel-access)

Enjoy seamless operation on your remote machine through the browser, including terminal access and
running various commands like vim, tmux, or screen.

#### Step 3b - VSCode Desktop Connection

- Install the Remote Tunnels extension in VSCode Desktop.
- Open VSCode Desktop.
- Press `Ctrl+Shift+P` and select `Remote-Tunnels: Connect to Tunnel...`.
- Choose Microsoft Account and log in.
- Select the code tunnel created in [Step 2](#step-2---enable-remote-tunnel-access).

Now, run applications on your remote machine directly from VSCode Desktop.

## WSL2 Instance 🚧

For a WSL2 instance, follow these steps:

### Step 1 - Enable systemd

Edit `/etc/wsl.conf` and add:

```bash
[boot]
systemd=true
```

Refer to [Systemd support is now available in WSL][systemd-in-wsl] for details.

### Step 2 - Install code CLI on WSL2

Same as [Step 1 from Remote Machine](#step-1---install-code-cli).

### Step 3 - Enable Remote Tunnel Access on WSL2

Same as [Step 2 from Remote Machine](#step-2---enable-remote-tunnel-access).

### Step 4 - Connect to WSL2 Instance

Connect to the remote WSL2 instance through your browser or VSCode Desktop as you would with a
regular remote machine.

## Docker Container 🐋

[VSCode Remote Tunnels][remote-tunnels] also support containers with a slightly different setup.

### Step 1 - Build Docker Image

To connect to a remote tunnel from a Docker container, create a Docker image with the code CLI.
Below is a Dockerfile example:

```dockerfile
FROM ubuntu:22.04

# Install git and curl
RUN apt-get update && \
    apt-get install -y git curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Download and extract the code cli program
RUN curl -sL "https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-x64" \
      --output /tmp/vscode-cli.tar.gz && \
      tar -xf /tmp/vscode-cli.tar.gz -C /usr/bin && \
      rm /tmp/vscode-cli.tar.gz

# Keep the container running
CMD [ "tail", "-f", "/dev/null" ]
```

Build the image:

```bash
docker build -t vscode-remote-tunnel .
```

### Step 2 - Enable Remote Tunnel Access

Start the container:

```bash
docker run -d \
    -v $(pwd):/home/workspace \
    -w /home/workspace \
    --name vscode-remote-tunnel \
    vscode-remote-tunnel
```

Log in to your Microsoft account:

```bash
docker exec vscode-remote-tunnel code tunnel user login --provider microsoft
```

Start the tunnel:

```bash
docker exec -d vscode-remote-tunnel code tunnel --accept-server-license-terms --name "docker-tunnel"
```

### Step 3 - Connect to Docker Container

Connect to the remote Docker container through a browser or VSCode Desktop, similar to connecting to
a remote machine.

## Terminate the Tunnel

Ensure to stop the server for the tunnel and log out from your Microsoft account when done. For the
Docker container:

```bash
docker exec vscode-remote-tunnel code tunnel kill
docker exec vscode-remote-tunnel code tunnel user logout
```

Follow a similar process for remote machines or WSL2 instances:

```bash
code tunnel kill
code tunnel user logout
```

## References

- [Developing with Remote Tunnels][remote-tunnels]

[remote-tunnels]: https://code.visualstudio.com/docs/remote/tunnels
[standalone install]: https://code.visualstudio.com/#alt-downloads
[systemd-in-wsl]: https://devblogs.microsoft.com/commandline/systemd-support-is-now-available-in-wsl/
[usage-limits]: https://code.visualstudio.com/docs/remote/tunnels#_are-there-usage-limits-for-the-tunneling-service
[vscode.dev]: https://vscode.dev
