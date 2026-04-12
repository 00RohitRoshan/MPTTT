import { Client } from "@heroiclabs/nakama-js";
import { v4 as uuidv4 } from "uuid";

class NakamaClient {
  constructor() {
    this.client = new Client("defaultkey", "127.0.0.1", "7350");
    this.client.useSecure = false;
    this.session = null;
    this.socket = null;
    this.matchId = null;
  }

  async authenticate() {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }

    this.session = await this.client.authenticateDevice(deviceId, true);
    console.log("Authenticated as", this.session.user_id);

    this.socket = this.client.createSocket();
    await this.socket.connect(this.session, true);
    return this.session;
  }

  async findMatch(onMatchState) {
    // Add player to matchmaking
    const query = "*";
    const minPlayers = 2;
    const maxPlayers = 2;
    const matchmakerTicket = await this.socket.addMatchmaker(query, minPlayers, maxPlayers);

    return new Promise((resolve) => {
      this.socket.onmatchmakermatched = async (matched) => {
        const match = await this.socket.joinMatch(matched.match_id || matched.token);
        this.matchId = match.id;
        
        this.socket.onmatchdata = (result) => {
          const data = JSON.parse(new TextDecoder().decode(result.data));
          onMatchState(data);
        };

        resolve(match);
      };
    });
  }

  async makeMove(index) {
    if (!this.matchId) return;
    const data = JSON.stringify({ index });
    await this.socket.sendMatchState(this.matchId, 1, data);
  }
}

export const nakamaManager = new NakamaClient();
