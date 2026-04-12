package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"github.com/heroiclabs/nakama-common/runtime"
)

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	if err := initializer.RegisterMatch("tictactoe", func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
		return &MatchHandler{}, nil
	}); err != nil {
		return err
	}

	if err := initializer.RegisterMatchmakerMatched(MatchmakerMatched); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("create_match", rpcCreateMatch); err != nil {
		return err
	}

	logger.Info("Go module loaded successfully.")
	return nil
}

func MatchmakerMatched(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, entries []runtime.MatchmakerEntry) (string, error) {
	matchId, err := nk.MatchCreate(ctx, "tictactoe", nil)
	if err != nil {
		return "", err
	}
	return matchId, nil
}

func rpcCreateMatch(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	matchId, err := nk.MatchCreate(ctx, "tictactoe", nil)
	if err != nil {
		return "", err
	}
	
	res := map[string]string{"matchId": matchId}
	data, err := json.Marshal(res)
	if err != nil {
		return "", err
	}

	return string(data), nil
}
