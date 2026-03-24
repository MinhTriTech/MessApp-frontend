<div align="center">

<!-- Banner / Logo -->
<img src="docs/images/banner.png" alt="MessApp Banner" width="100%" />

# MessApp – Frontend

**Ứng dụng nhắn tin thời gian thực – Giao diện người dùng**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 📖 Giới thiệu

**MessApp Frontend** là giao diện người dùng của ứng dụng nhắn tin thời gian thực **MessApp**, được xây dựng bằng **React 19** và **Vite 8**. Ứng dụng hỗ trợ đăng ký / đăng nhập, chat trực tiếp qua **Socket.IO**, quản lý hồ sơ cá nhân và nhiều tính năng tiện ích khác.

---

## 🖼️ Giao diện

| Trang Đăng nhập | Trang Chat | Trang Hồ sơ |
|---|---|---|
| ![Login](docs/images/login.png) | ![Chat](docs/images/logo.png) | ![Profile](docs/images/profile.png) |

---

## ✨ Tính năng

- 🔐 **Xác thực người dùng** – Đăng ký, đăng nhập và xác thực email.
- 💬 **Nhắn tin thời gian thực** – Giao tiếp qua **Socket.IO**, gửi/nhận tin nhắn tức thì.
- 🖼️ **Gửi hình ảnh** – Đính kèm và xem trước ảnh trong cuộc hội thoại.
- 📋 **Danh sách hội thoại** – Xem và chọn các cuộc trò chuyện hiện có.
- 🔍 **Tìm kiếm người dùng** – Tìm kiếm và bắt đầu hội thoại mới.
- 👤 **Hồ sơ cá nhân** – Xem và cập nhật thông tin, ảnh đại diện.
- ✂️ **Cắt ảnh đại diện** – Chỉnh sửa ảnh trực tiếp trong trình duyệt.
- 🎨 **Bong bóng tin nhắn phong cách** – Hiệu ứng nét vẽ tay sử dụng **Rough.js**.
- 📱 **Điều hướng đầy đủ** – Routing với **React Router DOM v7**.

---

## 🛠️ Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| [React](https://react.dev/) | 19 | Xây dựng giao diện người dùng |
| [Vite](https://vitejs.dev/) | 8 | Công cụ build & máy chủ phát triển |
| [Socket.IO Client](https://socket.io/) | 4 | Giao tiếp thời gian thực với máy chủ |
| [Axios](https://axios-http.com/) | 1 | Gọi REST API |
| [React Router DOM](https://reactrouter.com/) | 7 | Điều hướng trang |
| [Rough.js](https://roughjs.com/) | 4 | Hiệu ứng đồ họa nét vẽ tay |
| [ESLint](https://eslint.org/) | 9 | Kiểm tra chất lượng mã nguồn |

---

## ⚙️ Yêu cầu hệ thống

- **Node.js** >= 18
- **npm** >= 9
- Backend **MessApp** đang chạy (mặc định tại `http://localhost:8000`)

---

## 🚀 Cài đặt và khởi chạy

### 1. Sao chép mã nguồn

```bash
git clone https://github.com/MinhTriTech/MessApp-frontend.git
cd MessApp-frontend
```

### 2. Cài đặt thư viện

```bash
npm install
```

### 3. Cấu hình kết nối Backend

Cập nhật địa chỉ backend trong các tệp sau (nếu backend không chạy ở `http://localhost:8000`):

| Tệp | Cấu hình |
|---|---|
| `src/services/api.js` | `baseURL` cho Axios |
| `src/services/socket.js` | Địa chỉ máy chủ Socket.IO |

### 4. Chạy ở chế độ phát triển

```bash
npm run dev
```

Ứng dụng sẽ khởi động tại `http://localhost:5173`.

### 5. Build sản phẩm

```bash
npm run build
```

### 6. Xem trước bản build

```bash
npm run preview
```

---

## 📁 Cấu trúc thư mục

```
MessApp-frontend/
├── public/                         # Tài nguyên tĩnh (favicon, ...)
├── src/
│   ├── assets/                     # Hình ảnh, font chữ, ...
│   ├── components/
│   │   ├── chat/
│   │   │   ├── AvatarCropModal.jsx     # Modal cắt ảnh đại diện
│   │   │   ├── ChatComposer.jsx        # Ô soạn tin nhắn
│   │   │   ├── ImagePreviewModal.jsx   # Modal xem trước hình ảnh (chat)
│   │   │   ├── ProfileContextMenu.jsx  # Menu ngữ cảnh hồ sơ
│   │   │   ├── ProfilePanel.jsx        # Panel thông tin hồ sơ
│   │   │   ├── RoughMessageBubble.jsx  # Bong bóng tin nhắn nét vẽ tay
│   │   │   └── SearchResultPanel.jsx   # Bảng kết quả tìm kiếm người dùng
│   │   ├── common/
│   │   │   └── ImagePreviewModal.jsx   # Modal xem trước hình ảnh (dùng chung)
│   │   ├── ChatWindow.jsx          # Cửa sổ chat chính
│   │   ├── ConversationList.jsx    # Danh sách hội thoại
│   │   ├── Login.jsx               # Form đăng nhập
│   │   ├── OnboardingGate.jsx      # Kiểm tra hoàn thành onboarding
│   │   ├── OnboardingModal.jsx     # Modal nhập thông tin lần đầu
│   │   └── Register.jsx            # Form đăng ký
│   ├── context/
│   │   ├── AuthContext.jsx         # Quản lý trạng thái xác thực (JWT)
│   │   └── ChatContext.jsx         # Quản lý trạng thái chat toàn cục
│   ├── pages/
│   │   ├── ChatPage.jsx            # Trang chat chính
│   │   ├── ProfilePage.jsx         # Trang hồ sơ cá nhân
│   │   └── VerifySuccessPage.jsx   # Trang xác nhận email thành công
│   ├── services/
│   │   ├── api.js                  # Cấu hình Axios (baseURL)
│   │   ├── messageService.js       # Lấy lịch sử tin nhắn qua REST API
│   │   └── socket.js               # Khởi tạo kết nối Socket.IO
│   ├── App.jsx                     # Component gốc & định nghĩa routes
│   ├── App.css                     # Style cho App
│   ├── index.css                   # Style toàn cục
│   └── main.jsx                    # Điểm khởi đầu của ứng dụng
├── index.html
├── vite.config.js
├── eslint.config.js
└── package.json
```

---

## 🗺️ Các Route

| Route | Mô tả | Yêu cầu đăng nhập |
|---|---|---|
| `/login` | Trang đăng nhập | ❌ |
| `/register` | Trang đăng ký | ❌ |
| `/verify-success` | Xác nhận email thành công | ❌ |
| `/chat` | Trang chat (danh sách hội thoại) | ✅ |
| `/chat/:conversationId` | Trang chat với hội thoại cụ thể | ✅ |
| `/profile` | Trang hồ sơ cá nhân | ✅ |
| `/profile/:id` | Trang hồ sơ người dùng khác | ✅ |

---

## 🔧 Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Khởi chạy máy chủ phát triển (hot reload) |
| `npm run build` | Build ứng dụng cho môi trường production |
| `npm run preview` | Xem trước bản build production |
| `npm run lint` | Kiểm tra chất lượng mã nguồn với ESLint |

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng làm theo các bước sau:

1. **Fork** repository này.
2. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
3. Commit thay đổi: `git commit -m "feat: thêm tính năng ..."`
4. Push branch: `git push origin feature/ten-tinh-nang`
5. Tạo **Pull Request** và mô tả chi tiết thay đổi của bạn.

---

## 📄 Giấy phép

Dự án này được phát hành theo giấy phép [MIT](LICENSE).
