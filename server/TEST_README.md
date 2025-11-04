# Test Suite for Collaborative Playlist

This test suite covers all requirements from the assignment (lines 276-328 of `playlist-assignment.md`).

## Test Files

### 1. `server/src/utils/position.test.js`
Tests for the position calculation algorithm:
- ✅ Calculate middle position
- ✅ Handle first position (when nextPosition exists)
- ✅ Handle last position (when prevPosition exists)
- ✅ Handle empty playlist (both null)
- ✅ Calculate fractional positions correctly
- ✅ Handle multiple insertions without reindexing
- ✅ Edge cases (zero, negative positions, very small differences)

### 2. `server/src/playlist-operations.test.js`
Tests for playlist operations:
- ✅ **Adding Tracks**: Add tracks, prevent duplicates, allow same track in different playlists
- ✅ **Reordering**: Update positions, maintain order, support fractional positioning
- ✅ **Vote Counting**: Increment/decrement votes, allow negative votes, persist votes across playlists
- ✅ **Now Playing Exclusivity**: Only one track playing at a time, enforce exclusivity per playlist

### 3. `server/src/realtime.test.js`
Tests for realtime WebSocket communication:
- ✅ **Event Broadcasting**: Broadcast track.added, track.moved, track.voted, track.playing, track.removed, user presence
- ✅ **Reconnection Logic**: Handle disconnection gracefully, allow reconnection, process queued messages
- ✅ **Client Message Handling**: Handle user.setName, validate and sanitize user input

## Running Tests

```bash
# Run all tests
cd server
npm test

# Run specific test file
npm test position.test.js
npm test playlist-operations.test.js
npm test realtime.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Test Requirements Met

Based on `playlist-assignment.md` lines 276-328:

### Position Algorithm ✅
- [x] Calculate middle position (1.0, 2.0) → 1.5
- [x] Handle first position (null, 1.0) → 0
- [x] Additional edge cases covered

### Playlist Operations ✅
- [x] Test adding tracks
- [x] Test reordering via position update
- [x] Test vote counting
- [x] Test "Now Playing" exclusivity

### Realtime ✅
- [x] Test event broadcasting
- [x] Test reconnection logic

## Notes

- Tests use a test database (you may need to configure a separate test database)
- WebSocket tests use port 4001 to avoid conflicts with the main server
- Some tests require proper database setup and cleanup between runs

