import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException
import httpx
from src.core.config import settings

router = APIRouter()


@router.post("/", response_model=dict)
async def upload_file(file: UploadFile = File(...)):
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")

    # Generate a unique filename
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{file_ext}"

    # Supabase Storage URL
    # Bucket: "pictures"
    upload_url = f"{settings.SUPABASE_URL}/storage/v1/object/pictures/{filename}"

    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type": file.content_type or "image/jpeg",
    }

    try:
        content = await file.read()
        async with httpx.AsyncClient() as client:
            response = await client.post(upload_url, content=content, headers=headers)

            if response.status_code not in [200, 201]:
                print("Supabase Upload Error:", response.text)
                raise HTTPException(
                    status_code=500, detail="Failed to upload image to storage"
                )

        # Return the public URL
        # Assumption: Bucket is public. URL format: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{filename}
        public_url = (
            f"{settings.SUPABASE_URL}/storage/v1/object/public/pictures/{filename}"
        )

        return {"url": public_url}

    except Exception as e:
        print("Upload Exception:", str(e))
        raise HTTPException(status_code=500, detail="Internal upload error")
