FROM heroiclabs/nakama-pluginbuilder:3.25.0 AS builder

ENV GO111MODULE=on
ENV CGO_ENABLED=1

WORKDIR /app
COPY backend/ .

RUN go build --trimpath --mod=vendor --buildmode=plugin -o ./backend.so

FROM heroiclabs/nakama:3.25.0

COPY --from=builder /app/backend.so /nakama/data/modules/
COPY local.yml /nakama/data/
