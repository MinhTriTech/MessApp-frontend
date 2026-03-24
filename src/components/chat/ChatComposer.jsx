import { useState } from "react";
import attachFileIcon from "../../assets/attach-file.png";
import attachFileHoverIcon from "../../assets/attach-file-hover.png";

export default function ChatComposer({
  input,
  onInputChange,
  onSend,
  fileInputRef,
  onFileChange,
  onPickFile,
}) {
  const [isFileButtonHovered, setIsFileButtonHovered] = useState(false);

  return (
    <div className="message-input-row">
      <input
        value={input}
        onChange={onInputChange}
        className="text-input"
        placeholder="Nhập tin nhắn..."
      />
      <input
        ref={fileInputRef}
        type="file"
        className="file-input-hidden"
        onChange={onFileChange}
      />
      <button
        onClick={onPickFile}
        className="btn btn-file"
        type="button"
        onMouseEnter={() => setIsFileButtonHovered(true)}
        onMouseLeave={() => setIsFileButtonHovered(false)}
      >
        <img
          src={isFileButtonHovered ? attachFileHoverIcon : attachFileIcon}
          alt="Đính kèm file"
        />
      </button>
      <button onClick={onSend} className="btn">
        Gửi
      </button>
    </div>
  );
}
