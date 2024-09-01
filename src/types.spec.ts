import { FileMetrics } from "./types";

describe("FileMetrics", () => {
  it("should have the correct properties", () => {
    const fileMetrics: FileMetrics = {
      wordCount: 100,
      wordsAdded: 50,
      wordsDeleted: 20,
    };

    expect(fileMetrics.wordCount).toBe(100);
    expect(fileMetrics.wordsAdded).toBe(50);
    expect(fileMetrics.wordsDeleted).toBe(20);
  });
});
