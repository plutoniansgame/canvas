import * as anchor from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor";
import {
  MintLayout,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import {
  Transaction,
  Keypair,
  SystemProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { Canvas } from "../../target/types/canvas";

/**
 * @TODO parameterize all functions, remove test values
 */

export class CanvasSdkClient {
  private connection: Connection = null as any;
  private wallet: Wallet = null as any;
  private program = anchor.workspace.Canvas as anchor.Program<Canvas>;

  constructor({
    wallet,
    connection,
  }: {
    wallet: Wallet;
    connection: Connection;
  }) {
    this.wallet = wallet;
    this.connection = connection;
  }

  async createCanvasModels({ canvasModelName }: { canvasModelName: string }) {
    const ixs: TransactionInstruction[] = [];

    const collectionMint = Keypair.generate();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: collectionMint.publicKey,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    ixs.push(createAccountInstruction);

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      collectionMint.publicKey,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    ixs.push(createMintIx);

    const canvasModelAddress = await this.findCanvasModel({
      canvasModelName,
      collectionMint: collectionMint.publicKey,
    });

    const createCanvasModelIx = await this.program.methods
      .createCanvasModel(canvasModelName, canvasModelAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        collectionMint: collectionMint.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([collectionMint])
      .instruction();

    ixs.push(createCanvasModelIx);

    return {
      instructions: ixs,
      transaction: new Transaction().add(...ixs),
    };
  }

  findSlotIncrementor({
    canvasModelAddress,
  }: {
    canvasModelAddress: PublicKey;
  }) {
    return PublicKey.findProgramAddress(
      [
        Buffer.from("incrementor"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress.toBuffer(),
        Buffer.from("canvas_model_slot"),
      ],
      this.program.programId
    );
  }

  findCanvasModel({
    canvasModelName,
    collectionMint,
  }: {
    canvasModelName: string;
    collectionMint: PublicKey;
  }) {
    return PublicKey.findProgramAddress(
      [
        Buffer.from("canvas_model"),
        this.wallet.publicKey.toBuffer(),
        Buffer.from(canvasModelName),
        collectionMint.toBuffer(),
      ],
      this.program.programId
    );
  }

  async createIncrementor({
    canvasModelName,
    collectionMint,
  }: {
    canvasModelName: string;
    collectionMint: PublicKey;
  }) {
    const canvasModelAddress = await this.findCanvasModel({
      canvasModelName,
      collectionMint,
    });

    const canvasModelSlotIncrementorAddress = await this.findSlotIncrementor({
      canvasModelAddress: canvasModelAddress[0],
    });

    const createCanvasModelSlotIncrementorIx = await this.program.methods
      .createCanvasModelSlotIncrementor(
        canvasModelSlotIncrementorAddress[1]
      )
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    return {
      transaction: new Transaction().add(
        ...[createCanvasModelSlotIncrementorIx]
      ),
      instructions: [createCanvasModelSlotIncrementorIx],
    };
  }

  async findCanvasModelSlot({
    slotName,
    slotNumber,
    canvasModelAddress,
  }: {
    slotName: string;
    slotNumber: number;
    canvasModelAddress: PublicKey;
  }) {
    return await PublicKey.findProgramAddress(
      [
        Buffer.from("canvas_model_slot"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress.toBuffer(),
        Buffer.from(slotName),
        new anchor.BN(slotNumber).toBuffer(),
      ],
      this.program.programId
    );
  }

  async createSlot({
    canvasModelName,
    slotName,
    collectionMint,
    slotNumber,
  }: {
    canvasModelName: string;
    slotName: string;
    collectionMint: PublicKey;
    slotNumber: number;
  }) {
    const canvasModelAddress = await this.findCanvasModel({
      canvasModelName,
      collectionMint,
    });

    const canvasModelSlotIncrementorAddress = await this.findSlotIncrementor({
      canvasModelAddress: canvasModelAddress[0],
    });

    const canvasModelSlotAddress1 = await this.findCanvasModelSlot({
      slotName,
      slotNumber,
      canvasModelAddress: canvasModelAddress[0],
    });

    const createSlotIx = await this.program.methods
      .createCanvasModelSlot(slotName, 1, canvasModelSlotAddress1[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress1[0],
        collectionMint: collectionMint,
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    return {
      instructions: [createSlotIx],
      transactions: new Transaction().add(...[createSlotIx]),
    };
  }

  async createCanvasModel({
    canvasModelName,
    collectionMint,
  }: {
    canvasModelName: string;
    collectionMint: PublicKey;
  }) {
    const canvasModelAddress = await this.findCanvasModel({
      canvasModelName,
      collectionMint,
    });

    const createCanvasModelIx = await this.program.methods
      .createCanvasModel(canvasModelName, canvasModelAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        collectionMint: collectionMint,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    return {
      instructions: [createCanvasModelIx],
      transaction: new Transaction().add(...[createCanvasModelIx]),
    };
  }

  async createNftCanvas({ canvasModelName }: { canvasModelName: string }) {
    const collectionMint = Keypair.generate();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: collectionMint.publicKey,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      collectionMint.publicKey,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    const createCanvasModelIx = (
      await this.createCanvasModel({
        canvasModelName,
        collectionMint: collectionMint.publicKey,
      })
    ).instructions;

    const createCanvasModelSlotIncrementorIx = (
      await this.createIncrementor({
        canvasModelName,
        collectionMint: collectionMint.publicKey,
      })
    ).instructions;

    return {
      instructions: [
        createAccountInstruction,
        createMintIx,
        ...createCanvasModelIx,
        ...createCanvasModelSlotIncrementorIx,
      ],
      transaction: new Transaction().add(
        createAccountInstruction,
        createMintIx,
        ...createCanvasModelIx,
        ...createCanvasModelSlotIncrementorIx
      ),
    };
  }
}
