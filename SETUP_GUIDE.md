# 🚀 Complete Setup Guide for Beginners

This is a simplified, step-by-step guide for anyone who has never run a Node.js project before.

## Prerequisites Check

Before starting, make sure you have:
- ✅ A computer (Windows, Mac, or Linux)
- ✅ Internet connection
- ✅ Node.js installed (see below)

## Part 1: Installing Node.js

### Step 1: Check if Node.js is Already Installed

1. **Open Command Prompt (Windows) or Terminal (Mac/Linux):**
   - **Windows:** Press `Win + R`, type `cmd`, press Enter
   - **Mac:** Press `Cmd + Space`, type `Terminal`, press Enter
   - **Linux:** Press `Ctrl + Alt + T`

2. **Type this command and press Enter:**
   ```bash
   node --version
   ```

3. **What you should see:**
   - ✅ If you see something like `v18.17.0` or `v20.10.0` → You have Node.js! Skip to Part 2.
   - ❌ If you see "command not found" or an error → Continue to Step 2.

### Step 2: Download Node.js

1. **Open your web browser**
2. **Go to:** https://nodejs.org/
3. **Click the big green button** that says "Download Node.js (LTS)"
   - LTS = Long Term Support (more stable)
4. **The download should start automatically**
   - On Windows, it downloads a `.msi` file
   - On Mac, it downloads a `.pkg` file
   - On Linux, you may get a `.tar.xz` file

### Step 3: Install Node.js

**On Windows:**
1. Double-click the downloaded `.msi` file
2. Click "Next" through the installation wizard
3. ✅ Check "Automatically install the necessary tools" if asked
4. Click "Install" (you may need to enter your password)
5. Click "Finish"
6. **Restart your computer** (important!)

**On Mac:**
1. Double-click the downloaded `.pkg` file
2. Follow the installation wizard
3. Enter your Mac password when asked
4. Click "Install Software"
5. Click "Close"

**On Linux:**
1. Extract the `.tar.xz` file
2. Follow instructions at: https://nodejs.org/en/download/package-manager/

### Step 4: Verify Installation

1. **Close and reopen your terminal/command prompt**
2. **Type these commands one by one:**
   ```bash
   node --version
   npm --version
   ```
3. **Both should show version numbers** (like `v18.17.0` and `9.6.7`)
4. ✅ If both work, you're ready! Continue to Part 2.

## Part 2: Setting Up the Project

### Step 1: Find Your Project Folder

The project should be located at:
- `C:\collaborative-playlist` (Windows)
- Or wherever you saved/unzipped the project

### Step 2: Open Terminal in Project Folder

**On Windows:**
1. Open File Explorer
2. Navigate to the `collaborative-playlist` folder
3. Click in the address bar, type `powershell`, press Enter
   - OR right-click in the folder → "Open in Terminal"

**On Mac/Linux:**
1. Open Terminal
2. Type: `cd /path/to/collaborative-playlist`
   - Replace `/path/to/` with your actual folder path
   - Tip: You can drag the folder into Terminal to auto-fill the path
3. Press Enter

### Step 3: Install Dependencies (First Time Only)

1. **Make sure you're in the project root folder** (you should see files like `package.json`, `README.md`)

2. **Type this command:**
   ```bash
   npm run install:all
   ```

3. **Press Enter and wait** (this takes 2-5 minutes)
   - You'll see lots of text scrolling - this is normal!
   - It's downloading all the code libraries the project needs
   - Wait until it says "up to date" or finishes

4. **Also install root dependencies:**
   ```bash
   npm install
   ```
   This should be quick.

### Step 4: Create Environment Files

**On Windows PowerShell:**
```powershell
Copy-Item .env.example .env
Copy-Item .env.example server\.env
```

**On Mac/Linux:**
```bash
cp .env.example .env
cp .env.example server/.env
```

These files store configuration settings.

### Step 5: Set Up the Database

1. **Go to the server folder:**
   ```bash
   cd server
   ```

2. **Generate database tools:**
   ```bash
   npm run db:generate
   ```
   Wait for "Generated Prisma Client"

3. **Create database tables:**
   ```bash
   npm run db:migrate
   ```
   - If asked for a name, type: `init` and press Enter
   - Wait for "Your database is now in sync"

4. **Add sample tracks:**
   ```bash
   npm run db:seed
   ```
   You should see "Created 34 tracks" and "Created 10 playlist tracks"

5. **Go back to root:**
   ```bash
   cd ..
   ```

## Part 3: Running the Project

### Method 1: Run Both Servers Together (Recommended)

1. **In the project root folder, type:**
   ```bash
   npm run dev
   ```

2. **Two things will happen:**
   - The backend server starts (you'll see "Server running on port 4000")
   - The frontend server starts (you'll see "Local: http://localhost:3000")

3. **Keep this terminal window open!** (Closing it stops the servers)

4. **Open your browser and go to:**
   ```
   http://localhost:3000
   ```

5. **You should see the playlist application!** 🎉

### Method 2: Run Servers Separately

If you want to see the logs separately:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Keep this open!

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Keep this open too!

Then open http://localhost:3000

## Part 4: Using the Application

### Basic Features:

1. **Browse Tracks:** Scroll through the track library
2. **Search:** Type in the search box to find tracks
3. **Filter by Genre:** Use the dropdown to filter
4. **Add Track:** Click "Add to Playlist" button
5. **Remove Track:** Click "Remove" button (if already in playlist)
6. **Reorder:** Drag tracks up/down in the playlist
7. **Vote:** Click up/down arrows on tracks
8. **Play Track:** Click "Play" button
9. **Realtime Sync:** Open a second browser window - changes sync automatically!

## Troubleshooting

### ❌ "npm is not recognized"
**Problem:** Node.js isn't installed or not in your system PATH.
**Solution:**
1. Reinstall Node.js from nodejs.org
2. During installation, make sure "Add to PATH" is checked
3. Restart your computer
4. Open a NEW terminal window and try again

### ❌ "Port 3000 already in use"
**Problem:** Another program is using port 3000.
**Solution:**
1. Close other applications that might use port 3000
2. Or stop any other Node.js servers running
3. Or change the port in `client/.env.local` (advanced)

### ❌ "Cannot connect to backend"
**Problem:** Backend server isn't running.
**Solution:**
1. Check that you ran `npm run dev` from the project root
2. Look for "Server running on port 4000" in the terminal
3. Make sure no errors are shown in the backend terminal

### ❌ "Database errors" or "Prisma errors"
**Problem:** Database isn't set up correctly.
**Solution:**
1. Delete the database file: `server/prisma/dev.db` (if it exists)
2. Run these commands again:
   ```bash
   cd server
   npm run db:migrate
   npm run db:seed
   cd ..
   ```

### ❌ "Module not found" errors
**Problem:** Dependencies aren't installed.
**Solution:**
```bash
npm run install:all
npm install
```

### ❌ Can't find the project folder
**Problem:** Don't know where the project is.
**Solution:**
1. The project should be at: `C:\collaborative-playlist` (Windows)
2. Or search your computer for "collaborative-playlist" folder
3. Make sure you're opening the terminal INSIDE that folder

## Stopping the Servers

**To stop the servers:**
1. Go to the terminal window where servers are running
2. Press `Ctrl + C` (Windows/Linux) or `Cmd + C` (Mac)
3. Press `Ctrl + C` again if it asks for confirmation
4. The servers will stop

**Or just close the terminal window** (same effect)

## Next Time You Run It

After the first setup, you only need:

1. Open terminal in project folder
2. Type: `npm run dev`
3. Open: http://localhost:3000

Much simpler! The database is already set up.

## Need Help?

If you're still stuck:
1. Check that all steps in Part 1 (Node.js installation) completed successfully
2. Make sure you're in the correct folder (should see `package.json` file)
3. Try running commands one at a time and read any error messages
4. Make sure both servers show "Ready" or "running" messages

---

**That's it! You should now have the Collaborative Playlist Manager running on your computer.** 🎵

