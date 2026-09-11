# 🚀 Guide: Publishing RylixManager to GitHub

This guide details how to publish your rebranded **RylixManager** codebase to a new GitHub repository and make the one-line install command live.

---

## Step 1: Initialize Git in your Workspace

Open your terminal in `g:\Linux Hostble thing\dokploy-canary` and run:

```bash
# 1. Initialize git
git init -b main

# 2. Add all files
git add .

# 3. Create your initial rebranded commit
git commit -m "feat: Initial release of RylixManager with unlocked enterprise features"
```

---

## Step 2: Create a New Repository on GitHub

1. Go to [github.com/new](https://github.com/new).
2. Name your repository: `RylixManager` (or `rylix-manager`).
3. Set the repository to **Public** (so that `curl -sSL https://raw.githubusercontent.com/.../install.sh | sh` can download `install.sh` without requiring an auth token).
4. Do **not** initialize with a README, .gitignore, or license (they are already included in this project).
5. Click **Create repository**.

---

## Step 3: Link and Push to GitHub

Link your local repository to your new GitHub repository:

```bash
# Replace YOUR_GITHUB_USERNAME with your actual GitHub account name
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/RylixManager.git

# Push the code
git push -u origin main
```

---

## Step 4: Your Live One-Line Install Command

Once pushed, your installer is instantly accessible across any Linux VPS:

```bash
curl -sSL https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/RylixManager/main/install.sh | sh
```

*(Remember to update `YOUR_GITHUB_USERNAME` in `install.sh` and `README.md` if you want the default URL to point directly to your repo).*

---

## Step 5: (Optional) Building & Publishing Docker Images

To publish your own Docker image under your Docker Hub or GitHub Container Registry (GHCR):

```bash
# Build the Docker image
docker build -t YOUR_DOCKER_USERNAME/rylix-manager:latest .

# Push to Docker Hub
docker push YOUR_DOCKER_USERNAME/rylix-manager:latest
```

Then in `install.sh`, set `RYLIX_IMAGE="YOUR_DOCKER_USERNAME/rylix-manager:latest"`.
