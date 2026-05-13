export const MAX_PRODUCT_PHOTOS = 2;
export const MAX_COMPRESSED_IMAGE_BYTES = 500 * 1024;

type CompressOptions = {
  maxBytes?: number;
  targetBytes?: number;
  maxDimension?: number;
};

function getBase64ByteSize(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Gagal membaca foto. Coba pilih file lain."));
    };
    image.src = imageUrl;
  });
}

function getScaledSize(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function compressImageToBase64(
  file: File,
  options: CompressOptions = {},
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }

  const maxBytes = options.maxBytes ?? MAX_COMPRESSED_IMAGE_BYTES;
  const targetBytes = options.targetBytes ?? 450 * 1024;
  let maxDimension = options.maxDimension ?? 1200;
  const image = await loadImageFromFile(file);

  for (let resizeAttempt = 0; resizeAttempt < 5; resizeAttempt += 1) {
    const { width, height } = getScaledSize(image.naturalWidth, image.naturalHeight, maxDimension);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Browser tidak mendukung kompresi foto.");
    }

    context.drawImage(image, 0, 0, width, height);

    for (let quality = 0.82; quality >= 0.42; quality -= 0.08) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const byteSize = getBase64ByteSize(dataUrl);

      if (byteSize <= targetBytes || byteSize <= maxBytes) {
        return dataUrl;
      }
    }

    maxDimension = Math.round(maxDimension * 0.78);
  }

  throw new Error("Foto masih lebih dari 500KB setelah dikompres. Coba gunakan foto lain.");
}

export function isCompressedImageValid(dataUrl: string) {
  return getBase64ByteSize(dataUrl) <= MAX_COMPRESSED_IMAGE_BYTES;
}
