import { CreateMetadataAccountArgsV2 } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@solana/web3.js";

export type CreateCanvasModelAccountsProps = {
  canvasModelName: string;
};

export type FindSlotIncrementorProps = {
  canvasModelAddress: PublicKey;
};

export type FindCanvasModelProps = {
  canvasModelName: string;
  collectionMint: PublicKey;
};

export type CreateIncrementorProps = {
  canvasModelName: string;
  collectionMint: PublicKey;
};

export type FindCanvasModelSlotProps = {
  slotName: string;
  slotNumber: number;
  canvasModelAddress: PublicKey;
};

export type CreateSlotProps = {
  canvasModelName: string;
  slotName: string;
  collectionMint: PublicKey;
  slotNumber: number;
};

export type CreateCanvasModelProps = {
  canvasModelName: string;
  collectionMint: PublicKey;
};

export type CreateNftCanvasProps = {
  canvasModelName: string;
};

export type AssignNftToCanvasSlotProps = {
  createMetadataAccountArgsV2: CreateMetadataAccountArgsV2;
  canvasModelName: string;
  canvasName: string;
};
