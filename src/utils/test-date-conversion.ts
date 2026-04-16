// Test utility for date conversion
import { adToBS, bsToAD } from "./dateConverter";

/**
 * Test the bidirectional date conversion
 */
export function testDateConversion() {
  console.log("Testing bidirectional date conversion...");

  // Test AD to BS conversion
  const testAdDate = new Date("2024-01-15");
  const bsResult = adToBS(testAdDate);

  console.log(
    `AD ${testAdDate.toISOString().split("T")[0]} -> BS ${bsResult.formatted}`,
  );

  // Test BS to AD conversion
  const testBsDate = "2081-10-01";
  const adResult = bsToAD(testBsDate);

  console.log(`BS ${testBsDate} -> AD ${adResult.toISOString().split("T")[0]}`);

  // Test round-trip conversion
  const originalAd = new Date("2024-06-15");
  const toBs = adToBS(originalAd);
  const backToAd = bsToAD(toBs.formatted);

  console.log("Round-trip test:");
  console.log(`Original AD: ${originalAd.toISOString().split("T")[0]}`);
  console.log(`Converted to BS: ${toBs.formatted}`);
  console.log(`Back to AD: ${backToAd.toISOString().split("T")[0]}`);

  // Calculate difference in days
  const diffMs = Math.abs(originalAd.getTime() - backToAd.getTime());
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  console.log(`Difference: ${diffDays} days`);
}
