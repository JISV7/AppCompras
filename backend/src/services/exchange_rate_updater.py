import logging
from decimal import Decimal

import httpx
from bs4 import BeautifulSoup
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.exchange_rate import ExchangeRate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BCV_URL = "https://www.bcv.org.ve/"
DOLARAPI_URL = "https://ve.dolarapi.com/v1/dolares/oficial"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
HEADERS = {"User-Agent": USER_AGENT}


async def _scrape_bcv() -> Decimal | None:
    """Scrapes the BCV website to get the USD exchange rate."""
    try:
        logger.info("Attempting to scrape BCV website...")
        # Create a specific client with SSL verification disabled for BCV.
        async with httpx.AsyncClient(verify=False) as client:
            response = await client.get(BCV_URL, headers=HEADERS, timeout=15.0)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        dolar_div = soup.find("div", id="dolar")
        if not dolar_div:
            logger.warning("Could not find the 'dolar' div on BCV page.")
            return None

        rate_str = dolar_div.find("strong").text.strip()
        # Convert comma decimal separator to dot
        rate_str = rate_str.replace(",", ".")
        rate = Decimal(rate_str)
        logger.info(f"Successfully scraped BCV rate: {rate}")
        return rate
    except httpx.RequestError as e:
        logger.error(f"Error requesting BCV page: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred during BCV scraping: {e}")
    return None


async def _fetch_dolarapi() -> Decimal | None:
    """Fetches the official exchange rate from DolarAPI as a fallback."""
    try:
        logger.info("Attempting to fetch rate from DolarAPI...")
        async with httpx.AsyncClient() as client:
            response = await client.get(DOLARAPI_URL, timeout=15.0)
            response.raise_for_status()
        
        data = response.json()
        rate = Decimal(data["promedio"])
        logger.info(f"Successfully fetched DolarAPI rate: {rate}")
        return rate
    except httpx.RequestError as e:
        logger.error(f"Error requesting DolarAPI: {e}")
    except (KeyError, TypeError, ValueError) as e:
        logger.error(f"Error parsing DolarAPI response: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred during DolarAPI fetch: {e}")
    return None


async def update_exchange_rate(db: AsyncSession):
    """
    Fetches the latest USD to VES exchange rate and saves it to the database.
    It tries the BCV website first, then a fallback API.
    """
    rate = None
    source = None

    # Try primary source (BCV)
    rate = await _scrape_bcv()
    if rate:
        source = "BCV"
    else:
        # If primary fails, try fallback source (DolarAPI)
        logger.warning("BCV scraping failed, trying DolarAPI fallback.")
        rate = await _fetch_dolarapi()
        if rate:
            source = "DolarAPI"

    if rate and source:
        logger.info(f"Saving exchange rate {rate} from source {source} to database.")
        new_rate = ExchangeRate(
            currency_code="USD",
            rate_to_ves=rate,
            source=source,
        )
        db.add(new_rate)
        await db.commit()
        await db.refresh(new_rate)
        logger.info(f"Successfully saved new rate with ID {new_rate.rate_id}.")
        return new_rate
    else:
        logger.error("Failed to fetch exchange rate from all sources.")
        return None