import { Connection, PublicKey } from "@solana/web3.js";
import { MintLayout } from "@solana/spl-token";
import {
  Metadata,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { BN } from "bn.js";

export const isNFT = async (
  address: PublicKey,
  allowMintAuthority = false,
  connection: Connection,
) => {
  // get the mint layout
  // if the circulating supply is 1, then it is an NFT
  // if the mint authority is null, then it is an NFT
  const [metadataAddress] = PublicKey.findProgramAddressSync([
    Buffer.from("metadata"),
    address.toBuffer(),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
  ], TOKEN_METADATA_PROGRAM_ID);
  const metadataAccountInfo = await connection.getAccountInfo(metadataAddress);

  if (!metadataAccountInfo) {
    console.log("metadata not found");
    return false;
  }

  const metadata = Metadata.fromAccountInfo(metadataAccountInfo);
  const mintAccountInfo = await connection.getAccountInfo(address);

  if (!mintAccountInfo) {
    console.log("mint account not found");
    return false;
  }

  const mint = MintLayout.decode(mintAccountInfo.data);

  if (!mint.supply.eq(new BN(1))) {
    console.log("mint supply is not 1");
    return false;
  }

  if (!allowMintAuthority && mint.mintAuthority) {
    console.log("mint authority is not null");
    return false;
  }

  return metadata;
};
