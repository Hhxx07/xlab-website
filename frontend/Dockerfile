# ===========================================================================
# 前端 Dockerfile — Vite React 开发环境
# 
# 源码通过 docker-compose volumes 挂载，实现热模块替换（HMR）
# ===========================================================================

FROM node:22-alpine

WORKDIR /app

# 预复制 package.json 以利用缓存层
COPY package.json package-lock.json* ./
RUN npm install

# 源码通过 volume 挂载
# 默认命令由 docker-compose.yml 指定
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
