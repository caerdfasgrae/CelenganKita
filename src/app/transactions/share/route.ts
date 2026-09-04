import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Tangkap file gambar yang dibagikan dari share sheet Android/iOS
    const file = (formData.get("receipt") as File) || (formData.get("image") as File) || (formData.get("file") as File);
    const text = (formData.get("text") as string) || "";
    const title = (formData.get("title") as string) || "";

    let base64Image: string | null = null;
    if (file && file.size > 0) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = file.type || "image/jpeg";
      base64Image = `data:${mimeType};base64,${base64}`;
    }

    const payload = {
      image: base64Image,
      text: (text || title).trim(),
    };

    // Render jembatan HTML yang menyimpan data ke sessionStorage klien lalu redirect ke form transaksi
    const scriptPayload = JSON.stringify(payload).replace(/</g, "\\u003c");

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Menerima Bukti Bayar - CelenganKita</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FFFDF8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #1C1917;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid #F3EDE2;
      border-top-color: #FFA259;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 6px 0;
      color: #292524;
    }
    p {
      font-size: 13px;
      color: #78716C;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>Membuka CelenganKita...</h2>
  <p>Menyiapkan bukti transaksi untuk dipindai</p>
  <script>
    try {
      const data = ${scriptPayload};
      if (data.image) {
        sessionStorage.setItem("shared_receipt_image", data.image);
      }
      if (data.text) {
        sessionStorage.setItem("shared_receipt_text", data.text);
      }
    } catch (e) {
      console.error("Gagal menyimpan shared receipt:", e);
    }
    window.location.replace("/transactions/new?mode=ocr&shared=1");
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Gagal memproses share target:", error);
    return NextResponse.redirect(new URL("/transactions/new?mode=ocr", request.url));
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/transactions/new", request.url));
}
