from typing import Any, Dict, Optional

import openfoodfacts
from fastapi.concurrency import run_in_threadpool
from fastapi import HTTPException

api = openfoodfacts.API(user_agent="ElPrecioJusto/1.0 (destructomax1@gmail.com)")


def validate_gtin(gtin: str) -> bool:
    """
    Validates a GTIN (EAN/UPC) barcode by checking its length and check digit.
    Supports 8, 12, 13, and 14 digit formats.
    """
    if not gtin or not gtin.isdigit() or not (8 <= len(gtin) <= 14):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid barcode. 8, 12, 13, or 14 digits expected, got {len(gtin) if gtin else 0} digits.",
        )

    if not is_valid_check_digit(gtin):
        raise HTTPException(
            status_code=400, detail=f"Invalid check digit for barcode: {gtin}"
        )

    return True


def is_valid_check_digit(gtin: str) -> bool:
    """
    Validates the check digit of a GTIN barcode.
    Uses the standard algorithm for GTIN-8, GTIN-12, GTIN-13, and GTIN-14.
    """
    if not gtin or not gtin.isdigit():
        return False

    # Get the target check digit (last digit)
    target_check_digit = int(gtin[-1])

    # Calculate the check digit using the standard algorithm
    # Sum of odd-positioned digits + 3 * sum of even-positioned digits
    total = 0
    for i in range(len(gtin) - 1):  # Exclude the check digit
        digit = int(gtin[len(gtin) - 2 - i])  # Process from right to left
        if i % 2 == 0:  # Even position (0-indexed from right, odd position from left)
            total += digit * 3
        else:  # Odd position (0-indexed from right, even position from left)
            total += digit

    # The check digit is the number that, when added to the total, makes it a multiple of 10
    computed_check_digit = (10 - (total % 10)) % 10

    return target_check_digit == computed_check_digit


def normalize_to_gtin13(barcode: str) -> str:
    """
    Normalize any barcode format to GTIN-13 (EAN-13) format by padding with leading zeros.
    This ensures consistency in the database and prevents duplicates.
    """
    # Remove any non-digit characters
    clean_barcode = "".join(filter(str.isdigit, barcode))

    # Pad with leading zeros to make it 13 digits (GTIN-13)
    gtin13 = clean_barcode.zfill(13)

    # Ensure it's exactly 13 digits
    if len(gtin13) > 13:
        # If it's longer than 13, take the last 13 digits (for GTIN-14, etc.)
        gtin13 = gtin13[-13:]
    elif len(gtin13) < 13:
        # If it's shorter, pad with zeros to make 13
        gtin13 = gtin13.zfill(13)

    return gtin13


async def fetch_product_from_off(barcode: str) -> Optional[Dict[str, Any]]:
    """
    Fetches product metadata using the official openfoodfacts SDK.
    Validates and normalizes the barcode to GTIN-13 format before querying OpenFoodFacts.
    """
    # Validate the barcode first
    validate_gtin(barcode)

    # Normalize the barcode to GTIN-13 format for querying OpenFoodFacts
    gtin13_barcode = normalize_to_gtin13(barcode)

    try:
        fields_needed = [
            "code",
            "product_name",
            "brands",
            "categories",
            "image_url",
            "image_front_url",
        ]

        product_data = await run_in_threadpool(
            api.product.get, gtin13_barcode, fields=fields_needed
        )

        if not product_data:
            return None

        # Return with the normalized GTIN-13 barcode format
        return {
            "barcode": gtin13_barcode,  # Use the normalized GTIN-13 format
            "name": product_data.get("product_name", "Unknown Product"),
            "brand": product_data.get("brands", None),
            "image_url": product_data.get(
                "image_url", product_data.get("image_front_url")
            ),
            "category": product_data.get("categories", "").split(",")[0]
            if product_data.get("categories")
            else None,
            "data_source": "OFF",
        }

    except Exception:
        return None
