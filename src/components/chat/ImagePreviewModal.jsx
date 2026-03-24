export default function ImagePreviewModal({ previewImage, onClose }) {
  if (!previewImage) {
    return null;
  }

  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <div className="image-preview-bubble" onClick={(e) => e.stopPropagation()}>
        <img src={previewImage.url} alt={previewImage.name} className="image-preview-image" />
      </div>
    </div>
  );
}
