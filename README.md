# MessApp 💬

**MessApp** là một ứng dụng nhắn tin thời gian thực được xây dựng bằng React và Node.js, hỗ trợ giao tiếp tức thì qua WebSocket cùng với hệ thống xác thực người dùng an toàn.

---

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Cấu hình môi trường](#-cấu-hình-môi-trường)
- [Khởi chạy ứng dụng](#-khởi-chạy-ứng-dụng)
- [API & Sự kiện WebSocket](#-api--sự-kiện-websocket)

---

## ✨ Tính năng

- 💬 **Nhắn tin thời gian thực** – Gửi và nhận tin nhắn tức thì qua WebSocket (Socket.io)
- 🔐 **Xác thực người dùng** – Đăng ký và đăng nhập bằng JWT
- 🔒 **Bảo mật mật khẩu** – Mật khẩu được mã hoá bằng bcrypt
- 🏠 **Quản lý cuộc trò chuyện** – Hỗ trợ nhiều phòng chat riêng biệt
- ⚡ **Phát triển nhanh** – Frontend sử dụng Vite với tính năng Hot Module Replacement (HMR)

---

## 🛠 Công nghệ sử dụng

### Frontend (`chat-frontend`)

| Công nghệ | Phiên bản |
|---|---|
| React | 19.2.4 |
| Vite | 8.0.0 |
| Socket.io-client | 4.8.3 |
| React Router DOM | 7.13.1 |
| Axios | 1.13.6 |

### Backend (`chat-backend`)

| Công nghệ | Phiên bản |
|---|---|
| Node.js | – |
| Express | 5.2.1 |
| Socket.io | 4.8.3 |
| PostgreSQL (pg) | 8.20.0 |
| JSON Web Token | 9.0.3 |
| bcrypt | 6.0.0 |

---

## 📁 Cấu trúc dự án

```
MessApp/
├── chat-frontend/                  # Ứng dụng React (giao diện người dùng)
│   ├── public/                     # Tài nguyên tĩnh
│   └── src/
│       ├── assets/                 # Hình ảnh, icon
│       ├── pages/
│       │   └── TestChat.jsx        # Trang giao diện chat
│       ├── services/
│       │   ├── api.js              # Cấu hình Axios (HTTP client)
│       │   └── socket.js           # Kết nối Socket.io client
│       ├── App.jsx                 # Component gốc
│       └── main.jsx                # Điểm khởi đầu ứng dụng
│
└── chat-backend/                   # Máy chủ Node.js
    └── src/
        ├── config/
        │   └── db.js               # Cấu hình kết nối PostgreSQL
        ├── controllers/
        │   └── authController.js   # Xử lý đăng ký / đăng nhập
        ├── sockets/
        │   └── socket.js           # Xử lý sự kiện WebSocket
        └── index.js                # Điểm khởi đầu máy chủ
```

---

## 💻 Yêu cầu hệ thống

- [Node.js](https://nodejs.org/) (phiên bản LTS khuyến nghị)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/)

---

## 🚀 Cài đặt

### 1. Clone dự án

```bash
git clone https://github.com/MinhTriTech/MessApp.git
cd MessApp
```

### 2. Cài đặt dependencies cho Frontend

```bash
cd chat-frontend
npm install
```

### 3. Cài đặt dependencies cho Backend

```bash
cd chat-backend
npm install
```

### 4. Tạo cơ sở dữ liệu

Khởi động PostgreSQL và chạy câu lệnh SQL sau để tạo bảng người dùng:

```sql
CREATE TABLE users (
    id       SERIAL PRIMARY KEY,
    email    VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name     VARCHAR(255) NOT NULL
);
```

---

## ⚙️ Cấu hình môi trường

Tạo file `.env` trong thư mục `chat-backend/` với nội dung sau:

```env
PORT=8000

DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432

JWT_SECRET=your_jwt_secret_key
```

> **Lưu ý:** Thay thế các giá trị trên bằng thông tin thực tế của bạn. Không chia sẻ file `.env` công khai.

---

## ▶️ Khởi chạy ứng dụng

### Khởi chạy Backend

```bash
cd chat-backend
npm run dev
```

Máy chủ sẽ chạy tại: `http://localhost:8000`

### Khởi chạy Frontend

```bash
cd chat-frontend
npm run dev
```

Giao diện sẽ chạy tại: `http://localhost:5173`

### Các lệnh khác (Frontend)

```bash
npm run build    # Build cho môi trường production
npm run preview  # Xem trước bản build production
npm run lint     # Kiểm tra lỗi code với ESLint
```

---

## 📡 API & Sự kiện WebSocket

### Xác thực (REST API)

| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/auth/register` | Đăng ký tài khoản mới |
| `POST` | `/auth/login` | Đăng nhập và nhận JWT token |

### Sự kiện Socket.io

| Sự kiện | Chiều | Mô tả |
|---|---|---|
| `join_conversation` | Client → Server | Tham gia vào một phòng chat |
| `send_message` | Client → Server | Gửi tin nhắn đến phòng chat |
| `receive_message` | Server → Client | Nhận tin nhắn từ phòng chat |

---

## 📄 Giấy phép

Dự án này được phân phối theo giấy phép [MIT](LICENSE).
