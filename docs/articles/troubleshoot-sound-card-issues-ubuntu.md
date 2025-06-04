---
title: "troubleshooting sound card issues on ubuntu desktop"
date: 2024-11-27
category:
  - linux
order: 5
tag:
  - linux
  - sound
  - troubleshoot
summary: "Step-by-step guide to fixing common sound card issues on Ubuntu Desktop."
---

<ArticleStatusBadge />

# 🎧 troubleshooting sound card issues on ubuntu desktop

Hey everyone,

I recently ran into some sound issues on my Ubuntu Desktop, and I thought I'd share how I managed to fix them. If you're having trouble with your sound card, this guide might help you out.

## step 1: check for alsa and pulseaudio 🔍

First things first, let's see if ALSA and PulseAudio are installed on your system. Open a terminal and run these commands:

```bash
dpkg -l | grep alsa
dpkg -l | grep pulseaudio
```

If nothing shows up, it means you need to install them.

## step 2: install alsa and pulseaudio 🛠️

Here's how you can install ALSA and PulseAudio:

1. **Update Your Package List**:

   ```bash
   sudo apt update
   ```

2. **Install ALSA**:

   ```bash
   sudo apt install alsa-base alsa-utils
   ```

3. **Install PulseAudio**:
   ```bash
   sudo apt install pulseaudio
   ```

## step 3: restart your system 🔄

After installing these packages, restart your system. This helps to make sure all changes take effect.

## step 4: check audio settings 🎛️

Once your system is back up, check your audio settings:

- Click on the sound icon in your system tray.
- Make sure the correct output device is selected.
- Ensure the volume is not muted and is turned up.

## step 5: test your sound 🔊

Now, it's time to test your sound. You can play some audio using a media player or run this command:

```bash
speaker-test -c 2
```

This will play a test sound through your speakers.

## additional troubleshooting 🛠️

If you're still having issues, try these additional steps:

- **Restart Audio Services**:

  ```bash
  sudo systemctl restart alsa
  sudo systemctl restart pulseaudio
  ```

- **Check ALSA Mixer**:
  Open a terminal and type `alsamixer`. Use the arrow keys to navigate and make sure all channels are unmuted and turned up.

By following these steps, I was able to get my sound working again. Hopefully, this helps you too! If you still have problems, it might be a hardware issue, and you might need to look into it further.

Happy troubleshooting! 🎉
