# Build APK release bằng EAS

Cấu hình được chuẩn bị ngày 13/11/2026. Chạy mọi lệnh dưới đây từ G:\uni\Do_an_tot_nghiep\project.

## 1. Cấu hình đã có

Profile **production-apk** trong eas.json dùng buildType=apk, developmentClient=false, distribution=internal và environment=production. Bản release đóng gói JavaScript vào app, không yêu cầu Expo Go hoặc Metro đang chạy. Profile development được giữ nguyên.

API origin: https://api-production-360b0645.up.railway.app

API base URL: https://api-production-360b0645.up.railway.app/api

Socket.IO dùng origin, không thêm /api. Các module API, refresh token, upload task, preview/download file và socket đã chuyển sang runtime-api.config.js. File api.config.js cũ được giữ nguyên nhưng không còn được app import. Cấu hình development mới lấy EXPO_PUBLIC_API_URL nếu có; nếu không, dùng Android emulator 10.0.2.2:3000. Máy thật khi phát triển cần đặt URL LAN qua biến môi trường, không sửa file được bảo vệ.

Profile release khai báo EXPO_PUBLIC_API_URL và EXPO_PUBLIC_APP_ENV=production trong eas.json. URL public không phải secret. Để đổi backend, sửa profile, kiểm tra health rồi build lại APK; không cần tạo Expo project mới. Nếu tài khoản EAS có biến cùng tên, đối chiếu cấu hình resolved trước build để tránh dùng nhầm môi trường. Không dùng NODE_ENV để chọn file .env.

Release và app.config.js sẽ từ chối URL thiếu, HTTP, IP/localhost, credentials, query/fragment hoặc path khác /api. Runtime cũng kiểm tra khi __DEV__=false, nên một bản release không có URL sẽ không tự chạy về emulator.

Giữ nguyên danh tính ứng dụng:

| Trường | Giá trị |
| --- | --- |
| Expo owner | yenle25404 |
| Slug | project |
| EAS projectId | d3d53646-5766-4186-93bb-618d05d1c5a4 |
| Android package | com.anonymous.project |

Firebase client trong google-services.json khớp package trên. File client này cần cho native build; không thay bằng Firebase Admin SDK/service-account JSON. FCM V1 service-account credential chỉ cấu hình trong EAS credentials khi thực sự dùng push, không đóng gói trong APK.

## 2. Kiểm tra trước khi build

    node --version
    npm run test:runtime-config
    npm run test:dashboard

Dùng Node tương thích Expo SDK 54; máy kiểm tra hiện dùng Node 22.13.1. Nếu chưa có node_modules, chạy npm ci theo lockfile. Không nâng Expo SDK hoặc dependencies hàng loạt chỉ để build APK.

Các secrets backend như MONGO_URL, JWT_SECRET, Cloudinary API secret, SMTP password không được đặt trong EXPO_PUBLIC_* hoặc app config. .easignore loại .env, native folders android/ios, reports/logs, tests, signing keys và Firebase Admin SDK. Vì native folders bị loại, EAS sẽ prebuild từ app.json/plugins; những chỉnh sửa chỉ có trong thư mục android local sẽ không đi lên build cloud.

google-services.json và assets được giữ trong archive. .env hiện đã được Git track từ trước; thêm ignore không tự gỡ file đã track. Trước commit/push, người sở hữu kiểm tra nội dung và xử lý riêng nếu chứa secret. EAS archive vẫn loại .env.

Kiểm tra bundle Android production mà không chạy EAS (PowerShell):

    $env:EXPO_PUBLIC_API_URL = 'https://api-production-360b0645.up.railway.app'
    $env:EXPO_PUBLIC_APP_ENV = 'production'
    $env:EXPO_NO_DOTENV = '1'
    npx expo export --platform android --output-dir dist/production-apk

Đây là JS/assets bundle, không phải APK. Sau kiểm tra, mở terminal mới hoặc bỏ các biến trên nếu quay lại phát triển local.

## 3. Đăng nhập và build cloud

AGENTS.md của frontend quy định “do not ... run EAS automatically”. Các lệnh EAS dưới đây để người vận hành chạy hoặc yêu cầu agent chạy rõ ràng; lần này người dùng đã chỉ thị chạy build và build đã hoàn tất (xem kết quả bên dưới).

    npx eas-cli@latest login
    npx eas-cli@latest whoami
    npx eas-cli@latest project:info
    npx eas-cli@latest config --platform android --profile production-apk

Đối chiếu owner/projectId/package ở phần 1. Nếu báo không có quyền, đăng nhập đúng tài khoản hoặc xin quyền project; không chạy eas init để tạo ID thay thế. Không đưa OTP hoặc access token vào báo cáo.

    npx eas-cli@latest build --platform android --profile production-apk

Nếu EAS hỏi keystore, ưu tiên dùng keystore Android đang có của project. Nếu đây là lần ký đầu tiên thì người sở hữu chọn cách quản lý credential. Không tạo keystore khác cho cùng ứng dụng đã phát hành chỉ để vượt lỗi build; APK khác chữ ký không cập nhật đè được bản cũ. Giữ keystore an toàn, không commit.

Lệnh có thể dùng quota/credit EAS; kiểm tra dashboard, queue và gói trước khi xác nhận nâng cấp trả phí. Ghi build ID và URL khi build bắt đầu; đợi trạng thái FINISHED, tải artifact có đuôi .apk. Không dùng .aab cho cài trực tiếp.

Hướng dẫn chính thức: [APK build](https://docs.expo.dev/build-reference/apk/), [EAS environment](https://docs.expo.dev/eas/environment-variables/usage/), [public env trong Expo](https://docs.expo.dev/guides/environment-variables/).

## 4. Cài và nghiệm thu trên Android thật

Tải APK từ trang build trên điện thoại hoặc dùng ADB với USB debugging đã được người dùng cho phép:

    adb devices -l
    adb -s SERIAL_DIEN_THOAI install -r DUONG_DAN_APK

Thay SERIAL_DIEN_THOAI và DUONG_DAN_APK bằng thông tin thực; thêm dấu nháy nếu đường dẫn có khoảng trắng. Chọn đúng thiết bị, không mặc định emulator. Nếu có lỗi chữ ký, không tự gỡ app vì sẽ mất dữ liệu local; xác định keystore/bản cũ trước.

Để chứng minh app độc lập: tắt Metro trên máy, đóng Expo Go, ngắt USB sau khi cài, mở app bằng icon. Chuyển sang 4G/5G hoặc Wi-Fi khác mạng máy phát triển. Khởi động lại app và thử:

- Login bằng tài khoản được cấp; sai mật khẩu trả thông báo phù hợp, không lưu password trong log.
- Giữ phiên qua lần mở lại; refresh token hoạt động khi access token hết hạn; logout xóa phiên local.
- HR/team lead/employee hiển thị đúng chức năng; tạo/sửa/xem task với dữ liệu nghiệm thu được cho phép.
- Upload ảnh/tài liệu và tải lại/preview sau khi đóng mở app; không dùng URL LAN. Kiểm tra download ở phiên bản Android mục tiêu và quyền media khi bị từ chối.
- Chấm công: quyền vị trí, trạng thái GPS, office/location thật; từ chối permission không làm app crash. Kiểm tra bản đồ native vì JS export không chứng minh cấu hình native/maps hoạt động.
- Hai người dùng ở hai thiết bị nhận chat realtime; mất mạng rồi bật lại phải reconnect. Handshake không xác thực trên backend không thay thế kiểm thử này.
- Notification: bật quyền bằng thao tác người dùng. Push khi app background/đóng cần thiết bị thật và FCM V1 credential đúng; có google-services.json chưa đủ chứng minh push hoạt động.
- Chế độ offline hiển thị lỗi hợp lý; khôi phục mạng gọi API lại thành công.

Không seed dữ liệu demo vào production. Dùng tài khoản/bản ghi nghiệm thu có phạm vi rõ ràng. Backend public hiện dùng Railway trial theo metadata kiểm tra, nên xác minh thời hạn/quota trước buổi demo.

## 5. Hồ sơ kết quả và xử lý lỗi

Lưu build ID, Git SHA mobile/backend, version/versionCode, ngày giờ, model máy/Android version, URL backend và kết quả từng mục ở report/. Log ở report/logs/, artifact APK ở nơi local được ignore. Tăng versionCode theo quy trình release khi phát hành bản cập nhật; không tự đổi package/projectId.

| Triệu chứng | Kiểm tra |
| --- | --- |
| App yêu cầu Metro/dev server | Có dùng nhầm profile development hoặc cài APK cũ không? |
| Lỗi EXPO_PUBLIC_API_URL | Xem env của profile và cấu hình EAS resolved, không bỏ guard để fallback localhost |
| Network request failed | URL HTTPS, health/ready, DNS, certificate và mạng điện thoại |
| File/socket URL sai | Phải dùng origin từ runtime config; không replace chuỗi /api trong hostname |
| Build không thấy google-services.json | Kiểm tra file client có sẵn trong archive, package Firebase khớp app.json |
| Push không tới | Quyền notification, Expo projectId, token đã đăng ký và FCM V1 credentials |
| Native build lỗi | Đọc log EAS/Gradle; export JS thành công không bảo đảm native dependencies build thành công |
| INSTALL_FAILED_UPDATE_INCOMPATIBLE | Khác chữ ký với app đã cài; xác định keystore trước khi gỡ/cài lại |


## Xác minh và build cloud ngày 13/11/2026

- Backend HTTPS: live/ready 200, API auth không token 401, Engine.IO handshake 200.
- 41/41 test runtime/dashboard đạt; Expo app config chặn release thiếu URL và giữ nguyên identity.
- Export Android production thành công, tạo Hermes bundle; đã kiểm tra endpoint HTTPS production có trong bundle. Đây chưa phải kiểm thử native APK.
- Các rule EAS ignore đã được kiểm tra: env/credentials/native folders/report bị loại, runtime config và Firebase client được giữ.
- Người dùng đã chỉ thị rõ “Chạy build EAS ngay”, cho phép thực hiện build lần này theo ngoại lệ được người dùng yêu cầu đối với AGENTS.md.
- Đã xác minh tài khoản Expo yenle25404, projectId hiện có; dùng remote Android keystore hiện có, không tạo mới.
- Build ID: 9c7d3243-9fd3-49d0-a4f4-6cf682fbf5b1; profile production-apk, app version 1.0.0, Android versionCode 1.
- Trang build: https://expo.dev/accounts/yenle25404/projects/project/builds/9c7d3243-9fd3-49d0-a4f4-6cf682fbf5b1
- Logs: report/logs/eas-runtime-tests.log, eas-android-export.log, eas-resolved-config.log, eas-production-apk-build.log.


## Artifact đã xác minh

- EAS build FINISHED: 9c7d3243-9fd3-49d0-a4f4-6cf682fbf5b1.
- APK local: dist/production-apk/taskflow-production-1.0.0.apk (127518811 bytes).
- SHA-256: f1ca05ddb672d3ea196cc9a4ace50a7996ab6244a20e2e690d0a94d23829c6b4.
- apksigner verify: thành công, APK signature v2 hợp lệ.
- Manifest: com.anonymous.project, versionName 1.0.0, versionCode 1, minSdk 24, targetSdk 36; không có cờ application-debuggable.
- APK có assets/index.android.bundle chứa origin HTTPS production; không cần tải JS từ Metro để khởi động release.
- Log xác minh: report/logs/eas-apk-signature.log, eas-apk-manifest.log, eas-apk-artifact.log.

## Kết quả cập nhật sau cài đặt và chuyển dữ liệu

APK đã cài thành công qua USB trên model 23049RAD8C, Android 15. App mở được; ADB reverse rỗng, không ghi nhận lỗi AndroidRuntime/ReactNativeJS trong lần kiểm tra. Bundle JS được đóng gói trong APK, không cần Metro để tải bundle.

Sau khi người dùng yêu cầu chuyển MongoDB local sang Atlas, đã chuyển và đọc lại xác minh 1.015 document, gồm 31 tài khoản. Railway ghi nhận POST /api/auth/login 200 lúc 2026-11-13T16:06:12.170373846Z. Người dùng xác nhận **“Đăng nhập thành công và thấy dữ liệu”** trên điện thoại thật.

Xem biên bản ở `../../server/report/atlas-migration-verification.md`. Có 3 URL đính kèm tin nhắn còn trỏ local và 28 tham chiếu file tương đối; file trên ổ đĩa chưa được chuyển cùng MongoDB.

Chưa nghiệm thu riêng refresh token, upload/download, GPS, chat hai thiết bị, push notification hoặc kết nối qua 4G/5G/Wi-Fi khác mạng máy phát triển.

## Bản sửa avatar 1.0.1 (14/11/2026)

- APK cập nhật: version 1.0.1, Android versionCode 2; giữ package và keystore để cài đè.
- Build: [EAS 1.0.1](https://expo.dev/accounts/yenle25404/projects/project/builds/20533040-dabd-439d-a884-f7331e6d1306).
- Personal Data upload JPG/PNG tối đa 5MB qua API trước khi lưu URL. Chọn ảnh xong cần bấm **Update Profile** để lưu vào tài khoản.
- Avatar chung tải ảnh riêng tư có xác thực; lấy profile hiện tại theo ID để đồng bộ Home, Profile, Comments, Tasks, Teams, Leaves, Chat và lịch họp.
- Lỗi ảnh có fallback. Lỗi validation hiển thị nội dung theo field.
- Regression frontend: 47 test đạt, lint không có error. Backend: 820 test đạt; bản sửa đã deploy Railway.
- Nghiệm thu: cài APK mới, chọn ảnh, Update Profile, kiểm tra avatar ở Home/Profile/Comments và mở lại app. Ghi kết quả thiết bị thật sau thao tác, không suy ra từ build/test.
- Chi tiết: `../../server/report/avatar-upload-fix.md`.

- Build 1.0.1 đã FINISHED. APK: `../dist/production-apk/taskflow-production-1.0.1.apk`, 127.520.975 bytes.
- SHA-256: `1ae0e399ddab827f07edf4b4aecf298540af6dc31de7fed048696a55bba78ada`; chữ ký v2 hợp lệ.
- Đã cài đè thành công lên điện thoại USB và mở app; xác minh versionName 1.0.1/versionCode 2. Không có ADB reverse hoặc lỗi AndroidRuntime/ReactNativeJS trong lần kiểm tra khởi động.
- Đang chờ người dùng xác nhận upload ảnh và đồng bộ Home/Comments thực tế.

- Nghiệm thu avatar ngày 14/11/2026: sau bản sửa backend PUBLIC_BASE_URL dùng HTTPS, người dùng xác nhận **“Ảnh đã hiện và đồng bộ”** khi thử chọn ảnh → Update Profile và kiểm tra Home/Comments. APK vẫn là 1.0.1, không cần cài lại. Backend regression cuối: 828 test đạt. Trạng thái này thay thế các ghi chú đang chờ nghiệm thu avatar phía trên.
