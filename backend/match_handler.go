package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"github.com/heroiclabs/nakama-common/runtime"
)

type MatchState struct {
	Board     []string                    `json:"board"`
	Marks     map[string]string           `json:"marks"`
	Presences map[string]runtime.Presence `json:"presences"`
	Turn      string                      `json:"turn"`
	Winner    string                      `json:"winner"`
	Draw      bool                        `json:"draw"`
}

type MatchHandler struct{}

func (m *MatchHandler) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
	state := &MatchState{
		Board:     make([]string, 9),
		Marks:     make(map[string]string),
		Presences: make(map[string]runtime.Presence),
	}
	tickRate := 1 // 1 tick per second is enough for TTT
	label := "tictactoe-match"

	return state, tickRate, label
}

func (m *MatchHandler) MatchJoinAttempt(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presence runtime.Presence, metadata map[string]string) (interface{}, bool, string) {
	s := state.(*MatchState)
	if len(s.Presences) >= 2 {
		return s, false, "Match is full"
	}
	return s, true, ""
}

func (m *MatchHandler) MatchJoin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	s := state.(*MatchState)
	for _, p := range presences {
		s.Presences[p.GetUserId()] = p
		if len(s.Marks) == 0 {
			s.Marks[p.GetUserId()] = "X"
			s.Turn = p.GetUserId()
		} else if len(s.Marks) == 1 {
			s.Marks[p.GetUserId()] = "O"
		}
	}

	if len(s.Presences) == 2 {
		// Game starts
		m.broadcastState(dispatcher, s)
	}

	return s
}

func (m *MatchHandler) MatchLeave(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	s := state.(*MatchState)
	for _, p := range presences {
		delete(s.Presences, p.GetUserId())
	}
	// If a player leaves, the other wins or match ends
	return s
}

func (m *MatchHandler) MatchLoop(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, messages []runtime.MatchData) interface{} {
	s := state.(*MatchState)

	for _, msg := range messages {
		if msg.GetOpCode() == 1 { // MOVE
			if msg.GetUserId() != s.Turn {
				continue
			}
			var data struct {
				Index int `json:"index"`
			}
			if err := json.Unmarshal(msg.GetData(), &data); err != nil {
				logger.Error("Failed to unmarshal move: %v", err)
				continue
			}

			if data.Index < 0 || data.Index > 8 || s.Board[data.Index] != "" {
				continue
			}

			s.Board[data.Index] = s.Marks[msg.GetUserId()]
			
			if m.checkWin(s) {
				s.Winner = msg.GetUserId()
			} else if m.checkDraw(s) {
				s.Draw = true
			} else {
				// Switch turn
				for uid := range s.Presences {
					if uid != s.Turn {
						s.Turn = uid
						break
					}
				}
			}
			m.broadcastState(dispatcher, s)
		}
	}

	return s
}

func (m *MatchHandler) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{} {
	return state
}

func (m *MatchHandler) MatchSignal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, data string) (interface{}, string) {
	return state, ""
}

func (m *MatchHandler) broadcastState(dispatcher runtime.MatchDispatcher, s *MatchState) {
	data, _ := json.Marshal(s)
	dispatcher.BroadcastMessage(3, data, nil, nil, true)
}

func (m *MatchHandler) checkWin(s *MatchState) bool {
	wins := [][]int{
		{0, 1, 2}, {3, 4, 5}, {6, 7, 8}, // Rows
		{0, 3, 6}, {1, 4, 7}, {2, 5, 8}, // Cols
		{0, 4, 8}, {2, 4, 6},          // Diagonals
	}
	for _, w := range wins {
		if s.Board[w[0]] != "" && s.Board[w[0]] == s.Board[w[1]] && s.Board[w[0]] == s.Board[w[2]] {
			return true
		}
	}
	return false
}

func (m *MatchHandler) checkDraw(s *MatchState) bool {
	for _, v := range s.Board {
		if v == "" {
			return false
		}
	}
	return true
}
