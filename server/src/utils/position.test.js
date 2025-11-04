const { calculatePosition } = require('./position');

describe('Position Calculation', () => {
  it('should calculate middle position', () => {
    const result = calculatePosition(1.0, 2.0);
    expect(result).toBe(1.5);
  });

  it('should handle first position when nextPosition exists', () => {
    const result = calculatePosition(null, 1.0);
    expect(result).toBe(0);
  });

  it('should handle last position when prevPosition exists', () => {
    const result = calculatePosition(1.0, null);
    expect(result).toBe(2.0);
  });

  it('should return 1.0 for first item when both are null', () => {
    const result = calculatePosition(null, null);
    expect(result).toBe(1.0);
  });

  it('should calculate fractional positions correctly', () => {
    // Insert between 1.0 and 1.5
    const result1 = calculatePosition(1.0, 1.5);
    expect(result1).toBe(1.25);

    // Insert between 1.25 and 1.5
    const result2 = calculatePosition(1.25, 1.5);
    expect(result2).toBe(1.375);

    // Insert between 1.375 and 1.5
    const result3 = calculatePosition(1.375, 1.5);
    expect(result3).toBe(1.4375);
  });

  it('should handle multiple insertions without reindexing', () => {
    // Simulate multiple insertions: [1.0, 2.0, 3.0]
    // Insert between 1 and 2: [1.0, 1.5, 2.0, 3.0]
    const pos1 = calculatePosition(1.0, 2.0);
    expect(pos1).toBe(1.5);

    // Insert between 1 and 1.5: [1.0, 1.25, 1.5, 2.0, 3.0]
    const pos2 = calculatePosition(1.0, 1.5);
    expect(pos2).toBe(1.25);

    // Insert between 1.25 and 1.5: [1.0, 1.25, 1.375, 1.5, 2.0, 3.0]
    const pos3 = calculatePosition(1.25, 1.5);
    expect(pos3).toBe(1.375);
  });

  it('should handle edge cases with zero positions', () => {
    // When nextPosition is 0, it's treated as falsy, so returns prevPosition + 1
    const result = calculatePosition(-1.0, 0);
    expect(result).toBe(0);
  });

  it('should handle negative positions', () => {
    const result = calculatePosition(-2.0, -1.0);
    expect(result).toBe(-1.5);
  });

  it('should handle very small fractional differences', () => {
    const result = calculatePosition(1.0, 1.0000001);
    expect(result).toBeCloseTo(1.00000005);
  });
});
