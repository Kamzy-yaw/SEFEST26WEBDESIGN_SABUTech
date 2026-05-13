"use client";

type ProductGalleryProps = {
  images: string[];
  selectedImage: string;
  onSelectImage: (imageUrl: string) => void;
};

export function ProductGallery({ images, selectedImage, onSelectImage }: ProductGalleryProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5">
      <div
        className="aspect-[4/3] bg-[radial-gradient(circle_at_20%_20%,#bbf7d0_0,#ecfdf5_32%,#f8fafc_70%)] bg-cover bg-center"
        style={{ backgroundImage: `url(${selectedImage})` }}
      />
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-3 p-4">
          {images.map((imageUrl, index) => (
            <button
              key={`${index}-${imageUrl.length}`}
              type="button"
              onClick={() => onSelectImage(imageUrl)}
              className={`aspect-square overflow-hidden rounded-2xl border bg-emerald-50 ${
                selectedImage === imageUrl ? "border-emerald-500" : "border-emerald-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Foto produk ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
