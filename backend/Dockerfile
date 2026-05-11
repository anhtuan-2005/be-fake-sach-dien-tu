# Sử dụng Node.js LTS
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn (đã được volume map trong docker-compose nên copy này chủ yếu để build image ban đầu)
COPY . .

# Mở cổng 5000 cho backend
EXPOSE 5000

# Lệnh khởi chạy ứng dụng
CMD ["npm", "start"]
