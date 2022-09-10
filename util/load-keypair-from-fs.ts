import { Keypair } from "@solana/web3.js";
export const loadKeyPairFromFs = (path: String) =>
  Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(
        require("fs").readFileSync(path, {
          encoding: "utf-8",
        }),
      ),
    ),
  );
