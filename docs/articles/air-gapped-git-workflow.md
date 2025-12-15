---
title: "air gapped git workflow"
date: 2025-11-15
category: devops
series: "offline workflows"
tag: [git, security, airgap, devops, linux]
summary: "how to use git to keep code flowing between air-gapped machines without internet access"
cover: /images/airgap-cover.png
---

<ArticleStatusBadge />

<img class="cover-image" src="../.assets/air-gapped-git-workflow/cover-01.png"/>

# air gapped git workflow

You’ve got two Linux boxes. They don’t talk to the internet. They don’t talk to each other. Welcome to the air‑gapped world. Sounds painful? It doesn’t have to be. Let’s break down how to keep your repos in sync and your workflow sane.

## the pain point

You want to code on machine A today, machine B tomorrow. No GitHub. No SSH. No fancy CI/CD pipelines. Just you, your code, and maybe a USB stick. If you don’t solve this, you’ll end up with diverging repos and merge hell.

## the minimal solution: git bundles

Start simple. Git has a built‑in way to package commits into a single file. That file can travel by email, USB, sneaker‑net — whatever works.

```bash
# on machine A
cd ~/brs
git bundle create brs.bundle --all   # pack the entire repo

# move brs.bundle to machine B

# on machine B
git clone brs.bundle brs             # first time setup
```

✅ Now both machines share the same history. No server required.

## incremental sync

Once you’ve got both sides initialized, you don’t want to resend the whole repo every time. Instead, bundle just the branch updates.

```bash
# on machine B, after making commits
cd ~/brs
git bundle create brs_update.bundle main   # bundle only the main branch

# transfer to machine A
cd ~/brs
git pull ../brs_update.bundle main         # import changes
```

⚠️ If you commit on both machines before syncing, expect merge conflicts. That’s normal. Resolve them once, and you’re back in business.

## the usb remote trick

Bundles work, but they feel clunky. Want something closer to `git push`/`git pull`? Use a bare repo on your USB stick as the “remote.”

**On Machine A (with the existing repo):**

```bash
# 1. Create a bare repo on your USB stick
cd /media/usb
git init --bare brs.git

# 2. Add the USB as a remote to your local repo
cd ~/brs
git remote add usb /media/usb/brs.git

# 3. Push your code to the USB remote
git push usb main
```

**On Machine B (the new machine):**

Now, take the USB to machine B. Instead of adding a remote to an existing repo, you'll clone it directly from the USB.

```bash
# 1. Clone the repo from the USB
cd ~
git clone /media/usb/brs.git brs

# 2. (Optional) Check the remote
cd brs
git remote -v
# origin  /media/usb/brs.git (fetch)
# origin  /media/usb/brs.git (push)
```

Now your USB stick acts like GitHub in your pocket. You can `git pull` and `git push` to `origin` from machine B, and to `usb` from machine A.

## tradeoffs

- **Bundles**: single file, easy to email, but manual.
- **Bare repo on USB**: smoother workflow, but requires physical media.
- **Conflicts**: unavoidable if you develop in parallel. Git handles it, you just need to resolve.

Some systems need strict consistency. Others are fine with eventual.

## validation

Don’t trust blindly. Always verify after syncing:

```bash
git log --oneline --graph --decorate
```

If both machines show the same commit graph, you’re synced. If not, you missed a step.

## takeaway

Air‑gapped doesn’t mean stuck. With bundles or a USB remote, you can keep two isolated machines in lockstep.
