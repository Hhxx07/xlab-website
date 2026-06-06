# Backend Dockerfile.
#
# dev  - hot-reload development image used by docker-compose.
# prod - static production-style API image.

FROM golang:1.25-alpine AS dev

RUN apk add --no-cache git
RUN go install github.com/air-verse/air@latest

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]

FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /api ./cmd/api

FROM alpine:3.21 AS prod

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /api /usr/local/bin/api
COPY --from=builder /app/migrations /migrations

EXPOSE 8080

CMD ["/usr/local/bin/api"]
