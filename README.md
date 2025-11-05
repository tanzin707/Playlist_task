# Collaborative Playlist Manager

A realtime collaborative playlist application where multiple users can add, remove, reorder, and vote on songs in a shared playlist. All changes synchronize in realtime across multiple browser windows.

---

## Technology Stack

- **Frontend:** Next.js 14 (React)
- **Backend:** Node.js + Express
- **Database:** SQLite with Prisma ORM
- **Realtime:** WebSocket (via `ws` library)

## Quick Start

Choose one of the following options to run the application:

### Option 1: Docker (Recommended - Easiest)

**Prerequisites:**
- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop/))

**Quick Start:**

1. **Open terminal in the project folder:**
   ```bash
   cd collaborative-playlist
   ```

2. **Test Docker status (optional but recommended):**
   ```powershell
   .\test-docker.ps1
   ```
   This will verify Docker is running and show configuration status.

3. **Start all services with Docker Compose:**
   ```bash
   docker compose up --build
   ```
   
   Or use the helper script:
   ```powershell
   .\start-docker.ps1
   ```

4. **Wait for containers to start:**
   - The database will be automatically set up and seeded
   - Backend server starts on port 4000
   - Frontend server starts on port 3000
   - You'll see logs from all services

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

6. **To stop the application:**
   - Press `Ctrl + C` in the terminal
   - Or run: `docker compose down`

**That's it!** Docker handles all the setup automatically - no need to install Node.js, dependencies, or set up the database manually.

**Note:** First time build may take a few minutes as it downloads images and installs dependencies.

#### Docker Storage Configuration

The project is configured to store the database volume on **D: drive** at:
- `D:\docker-data\collaborative-playlist\db`

This ensures database data is stored on your D: drive to save space on your C: drive.

**To configure Docker Desktop to store ALL Docker data on D: drive:**
1. Run the configuration helper script:
   ```powershell
   .\configure-docker-d-drive.ps1
   ```
2. Follow the instructions in the script output
3. Docker Desktop will restart and move all data to D: drive

#### Helper Scripts

The project includes helpful PowerShell scripts for Docker management:

- **`test-docker.ps1`** - Check Docker status and configuration
- **`start-docker.ps1`** - Start the project with Docker (checks status first)
- **`cleanup-docker.ps1`** - Remove all containers, volumes, and images for this project
- **`configure-docker-d-drive.ps1`** - Guide to configure Docker Desktop to use D: drive

**Example usage:**
```powershell
# Test if Docker is ready
.\test-docker.ps1

# Start the project
.\start-docker.ps1

# Clean up everything
.\cleanup-docker.ps1
```

### Running Instructions

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **WebSocket:** ws://localhost:4000

---

### Option 2: Manual Setup

**This section is for those who prefer to run the application manually without Docker.**

### Step 1: Install Node.js (If You Don't Have It)

1. **Check if you have Node.js installed:**
   - Press `Win + R` (Windows) or open Terminal (Mac/Linux)
   - Type: `node --version`
   - If you see a version number (like `v18.x.x` or higher), you're good! Skip to Step 2.
   - If you see an error, continue below.

2. **Download and Install Node.js:**
   - Go to: https://nodejs.org/
   - Download the **LTS version** (recommended for most users)
   - Run the installer and follow the installation wizard
   - **Important:** Check the box that says "Automatically install necessary tools" if prompted
   - After installation, restart your computer (recommended)

3. **Verify Installation:**
   - Open a new terminal/PowerShell window
   - Type: `node --version` (should show version number)
   - Type: `npm --version` (should show version number)
   - If both work, you're ready!

### Step 2: Open the Project Folder

**On Windows:**
1. Open File Explorer
2. Navigate to: `C:\collaborative-playlist` (or wherever you saved the project)
3. Right-click in the folder
4. Select "Open in Terminal" or "Open PowerShell window here"

**On Mac/Linux:**
1. Open Terminal
2. Type: `cd /path/to/collaborative-playlist` (replace with your actual path)
3. Press Enter

### Step 3: Install Project Dependencies

This downloads all the code libraries the project needs to run.

1. **In the terminal, type this command:**
   ```bash
   npm run install:all
   ```
   Press Enter and wait (this takes 1-3 minutes)

2. **What's happening?**
   - This installs packages for both the frontend and backend
   - You'll see lots of text scrolling - that's normal!
   - Wait until you see "up to date" or completion messages

3. **Install root dependencies (if needed):**
   ```bash
   npm install
   ```
   Press Enter (this should be quick)

### Step 4: Set Up Environment Variables

1. **Copy the example environment file:**
   - On Windows PowerShell:
     ```powershell
     Copy-Item .env.example .env
     ```
   - On Mac/Linux:
     ```bash
     cp .env.example .env
     ```

2. **Copy environment file for server:**
   - On Windows PowerShell:
     ```powershell
     Copy-Item .env.example server\.env
     ```
   - On Mac/Linux:
     ```bash
     cp .env.example server/.env
     ```

### Step 5: Set Up the Database

1. **Navigate to the server folder:**
   ```bash
   cd server
   ```

2. **Generate Prisma Client (database tools):**
   ```bash
   npm run db:generate
   ```
   Wait for it to finish (you'll see "Generated Prisma Client")

3. **Create the database tables:**
   ```bash
   npm run db:migrate
   ```
   - If it asks for a migration name, type: `init` and press Enter
   - Wait for "Your database is now in sync"

4. **Add initial track data:**
   ```bash
   npm run db:seed
   ```
   You should see:
   - "Created 34 tracks"
   - "Created 10 playlist tracks"
   - "Seeding completed!"

5. **Go back to the project root:**
   ```bash
   cd ..
   ```

### Step 6: Start the Servers

You need to run TWO servers at the same time (backend and frontend).

#### Option A: Run Both in One Command (Easier)

1. **From the project root folder, type:**
   ```bash
   npm run dev
   ```

2. **You'll see TWO terminals/windows:**
   - One showing backend logs (port 4000)
   - One showing frontend logs (port 3000)

3. **Wait for "Ready" messages:**
   - Backend: "Server running on port 4000"
   - Frontend: "Local: http://localhost:3000"

#### Option B: Run Separately (More Control)

**Terminal 1 - Backend Server:**
1. Open a terminal in the project folder
2. Type:
   ```bash
   cd server
   npm run dev
   ```
3. Keep this window open!

**Terminal 2 - Frontend Server:**
1. Open a **NEW** terminal in the project folder
2. Type:
   ```bash
   cd client
   npm run dev
   ```
3. Keep this window open too!

### Step 7: Open the Application

1. **Open your web browser** (Chrome, Firefox, Edge, etc.)

2. **Go to:**
   ```
   http://localhost:3000
   ```

3. **You should see:**
   - A dark-themed music playlist interface
   - Track library on top
   - Playlist queue below
   - Track cover images

### Step 8: Test It Out!

1. **Add a track:** Click "Add to Playlist" on any track in the library
2. **Reorder tracks:** Drag and drop tracks in the playlist
3. **Vote:** Click the up/down arrows on any track
4. **Test realtime sync:** Open `http://localhost:3000` in a second browser window - changes sync automatically!

### Troubleshooting

**Problem: "npm is not recognized"**
- Solution: Node.js isn't installed or not in PATH. Reinstall Node.js and restart your computer.

**Problem: "Port 3000 already in use"**
- Solution: Something else is using port 3000. Close other applications or change the port in `client/.env.local`

**Problem: "Cannot connect to backend"**
- Solution: Make sure the backend server (port 4000) is running. Check the terminal for errors.

**Problem: "Database errors"**
- Solution: Delete `server/prisma/dev.db` and run Steps 5.2-5.4 again
- Docker users: Stop containers, delete `D:\docker-data\collaborative-playlist\db`, then restart

**Problem: "Docker Desktop not running"**
- Solution: Start Docker Desktop and wait for it to fully initialize (whale icon should be stable)
- Run `.\test-docker.ps1` to verify Docker is ready

**Problem: "Port 3000/4000 already in use"**
- Solution: Stop other applications using these ports, or modify ports in `docker-compose.yml`

**Problem: Servers won't start**
- Solution: Make sure you're in the correct folder and ran `npm run install:all` successfully

### Stopping the Servers

1. **In each terminal window, press:**
   - `Ctrl + C` (Windows/Linux)
   - `Cmd + C` (Mac)

2. **Or close the terminal windows**

### Next Time You Want to Run It

After the first setup, you only need to:

1. Open terminal in project folder
2. Run: `npm run dev`
3. Open: http://localhost:3000

That's it! The database is already set up.

## Project Structure

```
collaborative-playlist/
├── client/                      # Next.js frontend
├── server/                      # Express backend
├── docker-compose.yml           # Docker Compose configuration
├── cleanup-docker.ps1           # Docker cleanup script
├── configure-docker-d-drive.ps1 # Docker D: drive configuration guide
├── start-docker.ps1            # Docker startup script
├── test-docker.ps1             # Docker status check script
└── README.md                    # This file
```

## Database Setup

### First Time Setup

1. Generate Prisma client:
```bash
cd server
npm run db:generate
```

2. Run migrations to create the database schema:
```bash
npm run db:migrate
```

3. Seed the database with initial data:
```bash
npm run db:seed
```

This will create:
- 35 tracks in the library (Rock, Pop, Electronic, Jazz, Classical genres)
- 10 tracks in the initial playlist with various vote counts (-2 to 10)
- One track marked as "Now Playing"

### Database Management

- View/edit data: `npm run db:studio` (opens Prisma Studio)
- Reset database: Delete `prisma/dev.db` and run migrations + seed again

**Docker Users:**
- Database volume is stored at: `D:\docker-data\collaborative-playlist\db`
- To reset database: Stop containers, delete the volume directory, then restart

## Testing

Run tests with:
```bash
npm test
```

## Features

### Core Functionality
- ✅ Add/remove tracks from playlist
- ✅ Drag-and-drop reordering with fractional position algorithm
- ✅ Upvote/downvote tracks with realtime sync
- ✅ "Now Playing" indicator with simulated playback
- ✅ Real-time synchronization across multiple browser windows
- ✅ Auto-reconnection with exponential backoff
- ✅ Search and filter track library by genre

### Position Algorithm
The playlist uses a fractional positioning system that allows infinite insertions without reindexing:
- Initial positions: 1.0, 2.0, 3.0
- Insert between 1.0 and 2.0: 1.5
- Insert between 1.0 and 1.5: 1.25
- And so on...

This prevents the need for bulk position updates when reordering.

## Technical Decisions

- **Position Algorithm:** Uses fractional positioning to allow infinite insertions without reindexing
- **WebSocket over SSE:** Chosen for bidirectional communication and lower latency
- **Optimistic Updates:** Frontend applies changes immediately, then reconciles with server response
- **Prisma:** Chosen for type safety and excellent SQLite support
- **React Beautiful DnD:** Provides smooth drag-and-drop experience
- **Tailwind CSS:** For rapid UI development with consistent styling

## API Endpoints

### Tracks
- `GET /api/tracks` - Get all available tracks from library

### Playlist
- `GET /api/playlist` - Get current playlist (ordered by position)
- `POST /api/playlist` - Add track to playlist
- `PATCH /api/playlist/:id` - Update track position or playing status
- `DELETE /api/playlist/:id` - Remove track from playlist
- `POST /api/playlist/:id/vote` - Vote on a track (up/down)

### WebSocket Events
- `track.added` - Track added to playlist
- `track.removed` - Track removed from playlist
- `track.moved` - Track position changed
- `track.voted` - Track vote count changed
- `track.playing` - Track playing status changed
- `ping` - Heartbeat message (every 30 seconds)

## Testing

Run tests with:
```bash
cd server
npm test
```

Test coverage includes:
- Position calculation algorithm tests
- Basic API endpoint structure tests

## Performance Considerations

- Playlist can handle 200+ tracks efficiently
- Drag operations are debounced to reduce server calls
- Optimistic updates provide immediate UI feedback
- WebSocket messages are lightweight JSON payloads

## If I Had 2 More Days...

- Implement user authentication and per-user voting (prevent duplicate votes)
- Add playlist export functionality (JSON/CSV)
- Implement undo/redo functionality with action history
- Add keyboard shortcuts for better UX (space for play/pause, arrows for navigation)
- Improve mobile responsiveness with touch gestures
- Add track history/recently played feature
- Implement auto-sort by votes option with animation
- Add more comprehensive error handling and retry logic
- User avatars/presence indicators
- Duplicate track prevention UI feedback

