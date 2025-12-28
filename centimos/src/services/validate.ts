/**
 * Validates a GTIN (EAN/UPC) barcode by checking its length and check digit.
 * Supports 8, 12, 13, and 14 digit formats.
 * Returns true if valid, false if invalid (with console logging).
 */
export function validateGtin(gtin: string): boolean {
  if (!gtin || !/^\d{8}$|^\d{12,14}$/.test(gtin)) {
    //console.error(`Invalid barcode. 8, 12, 13, or 14 digits expected, got ${gtin ? gtin.length : 0} digits.`);
    return false;
  }

  if (!isValidCheckDigit(gtin)) {
    //console.error(`Invalid check digit for barcode: ${gtin}`);
    return false;
  }

  return true;
}

/**
 * Validates the check digit of a GTIN barcode.
 * Uses the standard algorithm for GTIN-8, GTIN-12, GTIN-13, and GTIN-14.
 */
export function isValidCheckDigit(gtin: string): boolean {
  if (!gtin || !/^\d+$/.test(gtin)) {
    return false;
  }

  // Get the target check digit (last digit)
  const targetCheckDigit = parseInt(gtin.charAt(gtin.length - 1), 10);

  let sum = 0;
  const len = gtin.length;

  // Calculate the check digit using the standard algorithm
  // Sum of odd-positioned digits + 3 * sum of even-positioned digits
  for (let i = 0; i < len - 1; i++) {
    const digit = parseInt(gtin.charAt(len - 2 - i), 10); // Process from right to left
    if (i % 2 === 0) { // Even position (0-indexed from right, odd position from left)
      sum += digit * 3;
    } else { // Odd position (0-indexed from right, even position from left)
      sum += digit;
    }
  }

  // The check digit is the number that, when added to the total, makes it a multiple of 10
  const computedCheckDigit = (10 - (sum % 10)) % 10;
  return targetCheckDigit === computedCheckDigit;
}

/**
 * Normalizes any barcode format to GTIN-13 (EAN-13) format by padding with leading zeros.
 * This ensures consistency in the database and prevents duplicates.
 */
export function normalizeToGtin13(barcode: string): string {
  // Remove any non-digit characters
  const cleanBarcode = barcode.replace(/\D/g, '');
  
  // Pad with leading zeros to make it 13 digits (GTIN-13)
  let gtin13 = cleanBarcode.padStart(13, '0');
  
  // Ensure it's exactly 13 digits
  if (gtin13.length > 13) {
    // If it's longer than 13, take the last 13 digits (for GTIN-14, etc.)
    gtin13 = gtin13.slice(-13);
  } else if (gtin13.length < 13) {
    // If it's shorter, pad with zeros to make 13
    gtin13 = gtin13.padStart(13, '0');
  }
  
  return gtin13;
}