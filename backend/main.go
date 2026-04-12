package main

import (
	"context"
	"database/sql"
	"github.com/heroiclabs/nakama-common/runtime"
)

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	logger.Info("Tic-Tac-Toe Golang Module Loaded")

	if err := initializer.RegisterMatch("tictactoe", func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
		return &MatchHandler{}, nil
	}); err != nil {
		return err
	}

	if err := initializer.RegisterMatchmakerMatched(func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, entries []runtime.MatchmakerEntry) (string, error) {
		for _, e := range entries {
			logger.Info("Matched user: %v", e.GetPresence().GetUserId())
		}

		matchId, err := nk.MatchCreate(ctx, "tictactoe", nil)
		if err != nil {
			return "", err
		}

		return matchId, nil
	}); err != nil {
		return err
	}

	return nil
}
