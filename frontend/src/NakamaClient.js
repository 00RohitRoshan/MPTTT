import { Client } from "@heroiclabs/nakama-js";
import { v4 as uuidv4 } from "uuid";

class NakamaClient {
  constructor() {
    this.client = new Client("defaultkey", "localhost", "7350");
    this.client.useSecure = false;
    this.session = null;
    this.socket = null;
    this.matchId = null;
  }

  async authenticate() {
    let deviceId = sessionStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("deviceId", deviceId);
    }

    this.session = await this.client.authenticateDevice(deviceId, true);
    console.log("Authenticated as", this.session.user_id);

    if (this.socket) {
      return this.session;
    }

    this.socket = this.client.createSocket();
    await this.socket.connect(this.session, true);
    return this.session;
  }

  async findMatch(onMatchState) {
    this.onMatchState = onMatchState;
    console.log("Starting matchmaking...");
    
    return new Promise(async (resolve) => {
      this.socket.onmatchmakermatched = async (matched) => {
        console.log("[Nakama] Matchmaker matched! Joining match...", matched.match_id || matched.token);
        const match = await this.socket.joinMatch(matched.match_id || matched.token);
        this.matchId = match.match_id || match.id;
        console.log("[Nakama] Joined match successfully. ID:", this.matchId);
        
        this.socket.onmatchdata = (result) => {
          const data = JSON.parse(new TextDecoder().decode(result.data));
          console.log("[Nakama] Received state update:", data);
          onMatchState(data);
        };

        resolve(match);
      };

      const query = "*";
      const minPlayers = 2;
      const maxPlayers = 2;
      const matchmakerTicket = await this.socket.addMatchmaker(query, minPlayers, maxPlayers);
      console.log("Added to matchmaker, ticket:", matchmakerTicket.ticket);
    });
  }

  async createMatch(onMatchState) {
    this.onMatchState = onMatchState;
    const response = await this.client.rpc(this.session, "create_match", {});
    this.matchId = response.payload.matchId;
    console.log("[Nakama] RPC created match:", this.matchId);
    
    this.socket.onmatchdata = (result) => {
      const data = JSON.parse(new TextDecoder().decode(result.data));
      onMatchState(data);
    };

    const match = await this.socket.joinMatch(this.matchId);
    return match;
  }

  async joinMatchById(matchId, onMatchState) {
    this.onMatchState = onMatchState;
    this.matchId = matchId;
    
    this.socket.onmatchdata = (result) => {
      const data = JSON.parse(new TextDecoder().decode(result.data));
      onMatchState(data);
    };

    const match = await this.socket.joinMatch(this.matchId);
    return match;
  }

  async makeMove(index) {
    if (!this.matchId) {
      console.error("[Nakama] Cannot move: Match ID is missing!");
      return;
    }
    const data = JSON.stringify({ index });
    console.log(`[Nakama] Sending move to match ${this.matchId}:`, data);
    await this.socket.sendMatchState(this.matchId, 1, data);
  }

  async leaveMatch() {
    if (this.matchId && this.socket) {
      console.log("[Nakama] Leaving match:", this.matchId);
      await this.socket.leaveMatch(this.matchId);
      this.matchId = null;
    }
  }
}

export const nakamaManager = new NakamaClient();
