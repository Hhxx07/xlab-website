# Frontend development image for Vite + React.
#
# Source files are mounted by docker-compose during development. The anonymous
# /app/node_modules volume keeps container-installed dependencies from being
# overwritten by the bind mount.

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
