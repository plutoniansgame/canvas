import * as anchor from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import {
  MintLayout,
  TOKEN_PROGRAM_ID,
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Transaction,
  Keypair,
  SystemProgram,
  Connection,
  PublicKey,
} from "@solana/web3.js";
import {
  createCreateMetadataAccountV2Instruction,
  CreateMetadataAccountArgsV2,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
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

  async createCanvasModelTransaction({
    canvasModelName,
  }: {
    canvasModelName: string;
  }) {
    const tx = new Transaction();

    const mintKeypair = Keypair.generate();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    tx.add(createAccountInstruction);

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    tx.add(createMintIx);

    const canvasModelAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model"),
        this.wallet.publicKey.toBuffer(),
        Buffer.from(canvasModelName),
        mintKeypair.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    const createCanvasModelIx = await this.program.methods
      .createCanvasModel(canvasModelName, canvasModelAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        collectionMint: mintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([mintKeypair])
      .instruction();

    tx.add(createCanvasModelIx);

    return tx;
  }

  async initCanvasModelTransaction({
    canvasModelName,
  }: {
    canvasModelName: string;
  }) {
    const tx = new Transaction();

    let collectionMint = Keypair.generate();

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

    const canvasModelAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model"),
        this.wallet.publicKey.toBuffer(),
        Buffer.from(canvasModelName),
        collectionMint.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    const createCanvasModelIx = await this.program.methods
      .createCanvasModel(canvasModelName, canvasModelAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        collectionMint: collectionMint.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(createAccountInstruction).add(createMintIx).add(createCanvasModelIx);
    return tx;
  }

  findSlotIncrementorAddress({
    canvasModelAddress,
  }: {
    canvasModelAddress: PublicKey;
  }) {
    return findProgramAddressSync(
      [
        Buffer.from("incrementor"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress.toBuffer(),
        Buffer.from("canvas_model_slot"),
      ],
      this.program.programId
    );
  }

  getCanvasModelAddress({
    canvasModelName,
    collectionMint,
  }: {
    canvasModelName: string;
    collectionMint: PublicKey;
  }) {
    return findProgramAddressSync(
      [
        Buffer.from("canvas_model"),
        this.wallet.publicKey.toBuffer(),
        Buffer.from(canvasModelName),
        collectionMint.toBuffer(),
      ],
      this.program.programId
    );
  }

  async createIncrementorInstructions({
    canvasModelName,
    collectionMint,
  }: {
    canvasModelName: string;
    collectionMint: PublicKey;
  }) {
    const canvasModelAddress = this.getCanvasModelAddress({
      canvasModelName,
      collectionMint,
    });

    const canvasModelSlotIncrementorAddress = this.findSlotIncrementorAddress({
      canvasModelAddress: canvasModelAddress[0],
    });

    const createCanvasModelSlotIncrementorIx = await this.program.methods
      .createCanvasModelSlotIncrementor(
        "canvas_model_slot",
        canvasModelSlotIncrementorAddress[1]
      )
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    return createCanvasModelSlotIncrementorIx;
  }

  async createSlotInstructions({
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
    const canvasModelAddress = this.getCanvasModelAddress({
      canvasModelName,
      collectionMint,
    });

    const canvasModelSlotIncrementorAddress = this.findSlotIncrementorAddress({
      canvasModelAddress: canvasModelAddress[0],
    });

    const canvasModelSlotAddress1 = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from(slotName),
        new anchor.BN(slotNumber).toBuffer(),
      ],
      this.program.programId
    );

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

    return createSlotIx;
  }

  /**
   * @todo remove test data
   * @returns
   */
  async associateMintWithSlots({
    canvasModelName,
    collectionMint,
  }: {
    canvasModelName: string;
    collectionMint: PublicKey;
  }) {
    const tx = new Transaction();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: collectionMint,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      collectionMint,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    const canvasModelAddress = this.getCanvasModelAddress({
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

    const canvasModelSlotIncrementorAddress = this.findSlotIncrementorAddress({
      canvasModelAddress: canvasModelAddress[0],
    });

    const createCanvasModelSlotIncrementorIx = await this.program.methods
      .createCanvasModelSlotIncrementor(
        "canvas_model_slot",
        canvasModelSlotIncrementorAddress[1]
      )
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(createAccountInstruction)
      .add(createMintIx)
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx);

    return tx;
  }

  async createCanvasModelInstruction({
    canvasModelName,
    collectionMint,
  }: {
    canvasModelName: string;
    collectionMint: PublicKey;
  }) {
    const canvasModelAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model"),
        this.wallet.publicKey.toBuffer(),
        Buffer.from(canvasModelName),
        collectionMint.toBuffer(),
      ],
      this.program.programId
    );

    const createCanvasModelIx = await this.program.methods
      .createCanvasModel(canvasModelName, canvasModelAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        collectionMint: collectionMint,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    return createCanvasModelIx;
  }

  async createNftCanvasTransaction({
    canvasModelName,
  }: {
    canvasModelName: string;
  }) {
    const tx = new Transaction();

    let collectionMint = Keypair.generate();

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

    const canvasModelAddress = this.getCanvasModelAddress({
      collectionMint: collectionMint.publicKey,
      canvasModelName,
    });

    const createCanvasModelIx = await this.createCanvasModelInstruction({
      canvasModelName,
      collectionMint: collectionMint.publicKey,
    });

    const canvasModelSlotIncrementorAddress = this.findSlotIncrementorAddress({
      canvasModelAddress: canvasModelAddress[0],
    });

    const createCanvasModelSlotIncrementorIx = await this.program.methods
      .createCanvasModelSlotIncrementor(
        "canvas_model_slot",
        canvasModelSlotIncrementorAddress[1]
      )
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(createAccountInstruction)
      .add(createMintIx)
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx);

    return tx;
  }

  /**
   * @todo remove test data
   * @returns
   */
  async assignNftToCanvas({
    metadataArgs,
    canvasModelName,
    canvasName,
    canvasModelCollectionMint,
  }: {
    metadataArgs: CreateMetadataAccountArgsV2;
    canvasModelName: string;
    canvasName: string;
    canvasModelCollectionMint: PublicKey;
  }) {
    const tx = new Transaction();

    const attributeMintKeypair = Keypair.generate();

    // create account for attribute mint
    const createAccountIx = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: attributeMintKeypair.publicKey,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });
    // init attribute mint
    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      attributeMintKeypair.publicKey,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );
    // create account for canvas collection mint
    const createAccountIIx = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: canvasModelCollectionMint,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });
    // init canvas collection mint
    const createMintIIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      canvasModelCollectionMint,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    const attributeMetadataAddress = findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        attributeMintKeypair.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    const createMetadataIx = createCreateMetadataAccountV2Instruction(
      {
        metadata: attributeMetadataAddress[0],
        mint: attributeMintKeypair.publicKey,
        mintAuthority: this.wallet.publicKey,
        payer: this.wallet.publicKey,
        updateAuthority: this.wallet.publicKey,
      },
      {
        createMetadataAccountArgsV2: metadataArgs,
      }
    );

    const associatedTokenAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      attributeMintKeypair.publicKey,
      this.wallet.publicKey,
      false
    );
    const createUserTokenAccountIx =
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        attributeMintKeypair.publicKey,
        associatedTokenAccountAddress,
        this.wallet.publicKey,
        this.wallet.publicKey
      );
    const mintIx = Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      attributeMintKeypair.publicKey,
      associatedTokenAccountAddress,
      this.wallet.publicKey,
      [],
      1
    );
    const canvasModelAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model"),
        this.wallet.publicKey.toBuffer(),
        Buffer.from(canvasModelName),
        canvasModelCollectionMint.toBuffer(),
      ],
      this.program.programId
    );
    let createCanvasModelIx = await this.createCanvasModelInstruction({
      canvasModelName,
      collectionMint: canvasModelCollectionMint,
    });

    // create incrementor
    let canvasModelSlotIncrementorAddress = this.findSlotIncrementorAddress({
      canvasModelAddress: canvasModelAddress[0],
    });

    const createCanvasModelSlotIncrementorIx = await this.program.methods
      .createCanvasModelSlotIncrementor(
        "canvas_model_slot",
        canvasModelSlotIncrementorAddress[1]
      )
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        incrementor: canvasModelSlotIncrementorAddress[0],
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // create slots
    const canvasModelSlot1Props = {
      name: "head",
      index: 1,
    };

    let canvasModelSlot1Address = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from(canvasModelSlot1Props.name),
        new anchor.BN(canvasModelSlot1Props.index).toBuffer(),
      ],
      this.program.programId
    );

    const createCanvasModelSlotIx = await this.program.methods
      .createCanvasModelSlot(
        canvasModelSlot1Props.name,
        canvasModelSlot1Props.index,
        canvasModelSlot1Address[1]
      )
      .accounts({
        canvasModel: canvasModelAddress[0],
        canvasModelSlot: canvasModelSlot1Address[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        collectionMint: canvasModelCollectionMint,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    // associate nft mints with slots
    // create canvas
    tx.add(createAccountIx)
      .add(createMintIx)
      .add(createMetadataIx)
      .add(createAccountIIx)
      .add(createMintIIx)
      .add(createUserTokenAccountIx)
      .add(mintIx);

    const tx2 = new Transaction();

    const canvasModelSlotMintAssociationAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot_mint"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        canvasModelSlot1Address[0].toBuffer(),
        attributeMintKeypair.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    const createSlotMintAssociationIx = await this.program.methods
      .createCanvasModelSlotMintAssociation(
        canvasModelSlot1Props.index,
        false,
        canvasModelSlotMintAssociationAddress[1]
      )
      .accounts({
        canvasModel: canvasModelAddress[0],
        canvasModelSlot: canvasModelSlot1Address[0],
        canvasModelSlotMintAssociation:
          canvasModelSlotMintAssociationAddress[0],
        associatedMint: attributeMintKeypair.publicKey,
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx2
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx)
      .add(createCanvasModelSlotIx)
      .add(createSlotMintAssociationIx);

    const tx3 = new Transaction();
    const canvasAddress = findProgramAddressSync(
      [
        Buffer.from("canvas"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from(canvasName),
      ],
      this.program.programId
    );
    const createCanvasIx = await this.program.methods
      .createCanvas(canvasName, canvasAddress[1])
      .accounts({
        canvas: canvasAddress[0],
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const canvasSlotTokenAccountAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_token_account"),
        this.wallet.publicKey.toBuffer(),
        canvasAddress[0].toBuffer(),
        canvasModelAddress[0].toBuffer(),
        canvasModelSlot1Address[0].toBuffer(),
        attributeMintKeypair.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    const transferTokenToCanvasIx = await this.program.methods
      .transferTokenToCanvas(canvasModelAddress[0])
      .accounts({
        canvas: canvasAddress[0],
        canvasModelSlot: canvasModelSlot1Address[0],
        tokenAccount: associatedTokenAccountAddress,
        mint: attributeMintKeypair.publicKey,
        canvasModelSlotMintAssociation:
          canvasModelSlotMintAssociationAddress[0],
        canvasSlotTokenAccount: canvasSlotTokenAccountAddress[0],
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        creator: this.wallet.publicKey,
      })
      .instruction();

    tx3.add(createCanvasIx).add(transferTokenToCanvasIx);

    return [tx, tx2, tx3];
  }
}
