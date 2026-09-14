import { promises as fs, default as fsOrig } from "node:fs";
import path from "node:path";

import { Router, type Request, type Response } from "express";

const router = Router();

const GAMES_DIR = path.join(process.cwd(), "games");
fsOrig.mkdirSync(GAMES_DIR, { recursive: true });

interface ChessComGameResponse {
  game: {
    id: string;
    moveList: string;
    pgnHeaders: Record<string, string>;
  };
}

interface DecodedMove {
  from?: string;
  to: string;
  promotion?: string;
}

interface CachedGame {
  gameId: string;
  pgnHeaders: Record<string, string>;
  moves: DecodedMove[];
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Referer: "https://www.chess.com/",
  Origin: "https://www.chess.com",
  "Sec-Ch-Ua":
    '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?{~}(^)[_]@#$,./&-*++=";
const PROMO_PIECES = "qnrbkp";

function indexToSquare(index: number): string {
  const file = index % 8;
  const rank = Math.floor(index / 8) + 1;
  const fileChar = ALPHABET[file];
  if (fileChar === undefined) {
    return "";
  }
  return fileChar + rank;
}

function decodeTCN(tcnString: string): DecodedMove[] {
  const moves: DecodedMove[] = [];

  for (let i = 0; i < tcnString.length; i += 2) {
    const code1 = ALPHABET.indexOf(tcnString[i]!);
    let code2 = ALPHABET.indexOf(tcnString[i + 1]!);
    const move: DecodedMove = { to: "" } as any;

    if (code2 > 63) {
      const promoIndex = Math.floor((code2 - 64) / 3);
      move.promotion = PROMO_PIECES[promoIndex]!;

      const offset = ((code2 - 1) % 3) - 1;
      code2 = code1 + (code1 < 16 ? -8 : 8) + offset;
    }

    if (code1 > 75) {
      const dropIndex = code1 - 79;
      move.promotion = PROMO_PIECES[dropIndex]!;
    } else {
      move.from = indexToSquare(code1);
    }

    move.to = indexToSquare(code2);
    moves.push(move);
  }

  return moves;
}

async function getCachedGame(gameId: string): Promise<CachedGame | null> {
  try {
    const filePath = path.join(GAMES_DIR, `${gameId}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as CachedGame;
  } catch {
    return null;
  }
}

async function cacheGame(gameId: string, game: CachedGame): Promise<void> {
  try {
    const filePath = path.join(GAMES_DIR, `${gameId}.json`);
    await fs.writeFile(filePath, JSON.stringify(game), "utf-8");
  } catch (err) {
    console.error("Failed to cache game:", err);
  }
}

router.get("/:gameId", async (req: Request, res: Response) => {
  const { gameId } = req.params as any;

  if (!gameId || isNaN(Number(gameId))) {
    return res.status(400).json({ error: "Invalid game ID" });
  }

  // Check cache first
  const cachedGame = await getCachedGame(gameId);
  if (cachedGame) {
    return res.json(cachedGame);
  }

  try {
    const response = await fetch(
      `https://www.chess.com/callback/live/game/${gameId}`,
      {
        headers: BROWSER_HEADERS,
      },
    );
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Chess.com game not found" });
    }

    const data: ChessComGameResponse = (await response.json()) as any;

    const decodedMoves = decodeTCN(data.game.moveList);

    const gameData: CachedGame = {
      gameId: data.game.id,
      pgnHeaders: data.game.pgnHeaders,
      moves: decodedMoves,
    };

    // Cache the game for future requests
    await cacheGame(gameId, gameData);

    return res.json(gameData);
  } catch (err) {
    console.error("Failed to fetch chess.com game:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch game from chess.com" });
  }
});

export default router;
