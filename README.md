# MessApp – Frontend

Giao diện người dùng (frontend) cho ứng dụng nhắn tin thời gian thực **MessApp**, được xây dựng bằng **React 19** và **Vite 8**.

---

## Tính năng

- Nhắn tin thời gian thực giữa các người dùng thông qua **Socket.IO**.
- Tải và hiển thị lịch sử tin nhắn của một cuộc hội thoại.
- Tự động tạo và tham gia phòng chat khi bắt đầu cuộc trò chuyện.
- Giao diện thử nghiệm (`TestChat`) hỗ trợ kiểm thử nhanh giữa hai người dùng.

---

## Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| [React](https://react.dev/) | 19 | Xây dựng giao diện người dùng |
| [Vite](https://vitejs.dev/) | 8 | Công cụ build & máy chủ phát triển |
| [Socket.IO Client](https://socket.io/) | 4 | Giao tiếp thời gian thực với máy chủ |
| [Axios](https://axios-http.com/) | 1 | Gọi REST API |
| [React Router DOM](https://reactrouter.com/) | 7 | Điều hướng trang |
| [ESLint](https://eslint.org/) | 9 | Kiểm tra chất lượng mã nguồn |

---

## Yêu cầu hệ thống

- **Node.js** >= 18
- **npm** >= 9
- Backend **MessApp** đang chạy tại `http://localhost:8000`

---

## Cài đặt và khởi chạy

### 1. Sao chép mã nguồn

```bash
git clone https://github.com/MinhTriTech/MessApp-frontend.git
cd MessApp-frontend
```

### 2. Cài đặt thư viện

```bash
npm install
```

### 3. Chạy ở chế độ phát triển

```bash
npm run dev
```

Ứng dụng sẽ khởi động tại `http://localhost:5173`.

### 4. Build sản phẩm

```bash
npm run build
```

### 5. Xem trước bản build

```bash
npm run preview
```

---

## Cấu trúc thư mục

```
MessApp-frontend/
├── public/                 # Tài nguyên tĩnh
├── src/
│   ├── assets/             # Hình ảnh, font chữ, ...
│   ├── pages/
│   │   ├── Chat.jsx        # Hiển thị tin nhắn của một cuộc hội thoại
│   │   └── TestChat.jsx    # Giao diện kiểm thử chat giữa 2 người dùng
│   ├── services/
│   │   ├── api.js          # Cấu hình Axios (baseURL: http://localhost:8000)
│   │   ├── messageService.js  # Lấy lịch sử tin nhắn qua REST API
│   │   └── socket.js       # Khởi tạo kết nối Socket.IO
│   ├── App.jsx             # Component gốc của ứng dụng
│   ├── App.css             # Style cho App
│   ├── index.css           # Style toàn cục
│   └── main.jsx            # Điểm khởi đầu của ứng dụng
├── index.html
├── vite.config.js
├── eslint.config.js
└── package.json
```

---

## Kiểm tra mã nguồn (Lint)

```bash
npm run lint
```

---

## Kết nối Backend

Ứng dụng kết nối đến backend qua địa chỉ mặc định `http://localhost:8000`.  
Để thay đổi địa chỉ này, cập nhật các tệp sau:

- `src/services/api.js` – cấu hình `baseURL` cho Axios
- `src/services/socket.js` – địa chỉ máy chủ Socket.IO
- `src/services/messageService.js` – URL gọi API tin nhắn

---

## Giấy phép

Dự án này được phát hành theo giấy phép [MIT](LICENSE).
