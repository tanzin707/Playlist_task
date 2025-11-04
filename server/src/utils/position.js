/**
 * Position calculation algorithm for playlist ordering
 * Allows infinite insertions without reindexing by using fractional positions
 */

/**
 * Calculate position between two tracks
 * @param {number|null} prevPosition - Position of previous track (null if inserting at start)
 * @param {number|null} nextPosition - Position of next track (null if inserting at end)
 * @returns {number} Calculated position
 */
function calculatePosition(prevPosition, nextPosition) {
  if (!prevPosition && !nextPosition) return 1.0;
  if (!prevPosition) return nextPosition - 1;
  if (!nextPosition) return prevPosition + 1;
  return (prevPosition + nextPosition) / 2;
}

module.exports = { calculatePosition };

