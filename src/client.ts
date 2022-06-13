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
} from "@solana/web3.js";
import {
  createCreateMetadataAccountV2Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  UseMethod,
} from "@metaplex-foundation/mpl-token-metadata";


/**
 * @TODO parameterize all functions, remove test values
 */

export class CanvasSdkClient {
  private program: anchor.Program<any> = null as any;
  private connection: Connection = null as any;
  private wallet: Wallet = null as any;

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

  async createNftCanvasModelTransaction() {
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
        Buffer.from("nil_bearz"),
        mintKeypair.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    const createCanvasModelIx = await this.program.methods
      .createCanvasModel("nil_bearz", canvasModelAddress[1])
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

  async createComponentSlots({
    name,
    slotMappings: slots,
  }: {
    name: string;
    slotMappings: [string];
  }) {
    const tx = new Transaction();

    let mintKeypair = Keypair.generate();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    const canvasModelAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model"),
        this.wallet.publicKey.toBuffer(),
        Buffer.from(name),
        mintKeypair.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    const createCanvasModelIx = await this.program.methods
      .createCanvasModel(name, canvasModelAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        collectionMint: mintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const canvasModelSlotIncrementorAddress = findProgramAddressSync(
      [
        Buffer.from("incrementor"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("canvas_model_slot"),
      ],
      this.program.programId
    );

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

    const canvasModelSlotAddress1 = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("head"),
        new anchor.BN(1).toBuffer(),
      ],
      this.program.programId
    );

    const canvasModelSlotAddress2 = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("body"),
        new anchor.BN(2).toBuffer(),
      ],
      this.program.programId
    );

    const createSlotIx = await this.program.methods
      .createCanvasModelSlot("head", 1, canvasModelSlotAddress1[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress1[0],
        collectionMint: mintKeypair.publicKey,
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const createSlotIIx = await this.program.methods
      .createCanvasModelSlot("body", 2, canvasModelSlotAddress2[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress2[0],
        collectionMint: mintKeypair.publicKey,
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([])
      .instruction();

    tx.add(createAccountInstruction)
      .add(createMintIx)
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx)
      .add(createSlotIx)
      .add(createSlotIIx);

    return tx;
  }

  async associateMintWithSlots() {
    const tx = new Transaction();

    let mintKeypair = Keypair.generate();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    const canvasModelAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model"),
        this.wallet.publicKey.toBuffer(),
        Buffer.from("nil_bearz"),
        mintKeypair.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    const createCanvasModelIx = await this.program.methods
      .createCanvasModel("nil_bearz", canvasModelAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        collectionMint: mintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const canvasModelSlotIncrementorAddress = findProgramAddressSync(
      [
        Buffer.from("incrementor"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("canvas_model_slot"),
      ],
      this.program.programId
    );

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

    const canvasModelSlotAddress1 = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("head"),
        new anchor.BN(1).toBuffer(),
      ],
      this.program.programId
    );

    const createSlotIx = await this.program.methods
      .createCanvasModelSlot("head", 1, canvasModelSlotAddress1[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress1[0],
        collectionMint: mintKeypair.publicKey,
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const canvasModelSlotAddress2 = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("body"),
        new anchor.BN(2).toBuffer(),
      ],
      this.program.programId
    );

    const createSlotIIx = await this.program.methods
      .createCanvasModelSlot("body", 2, canvasModelSlotAddress2[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress2[0],
        collectionMint: mintKeypair.publicKey,
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([])
      .instruction();

    tx.add(createAccountInstruction)
      .add(createMintIx)
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx)
      .add(createSlotIx)
      .add(createSlotIIx);

    return tx;
  }

  async createNftCanvas() {
    const tx = new Transaction();

    let mintKeypair = Keypair.generate();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    const canvasModelAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model"),
        this.wallet.publicKey.toBuffer(),
        Buffer.from("nil_bearz"),
        mintKeypair.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    const createCanvasModelIx = await this.program.methods
      .createCanvasModel("nil_bearz", canvasModelAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        collectionMint: mintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const canvasModelSlotIncrementorAddress = findProgramAddressSync(
      [
        Buffer.from("incrementor"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("canvas_model_slot"),
      ],
      this.program.programId
    );

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

    const canvasModelSlotAddress1 = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("head"),
        new anchor.BN(1).toBuffer(),
      ],
      this.program.programId
    );

    const createSlotIx = await this.program.methods
      .createCanvasModelSlot("head", 1, canvasModelSlotAddress1[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress1[0],
        collectionMint: mintKeypair.publicKey,
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const canvasModelSlotAddress2 = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("body"),
        new anchor.BN(2).toBuffer(),
      ],
      this.program.programId
    );

    const createSlotIIx = await this.program.methods
      .createCanvasModelSlot("body", 2, canvasModelSlotAddress2[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress2[0],
        collectionMint: mintKeypair.publicKey,
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([])
      .instruction();

    tx.add(createAccountInstruction)
      .add(createMintIx)
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx)
      .add(createSlotIx)
      .add(createSlotIIx);

    return tx;
  }

  async assignNftToCanvas() {
    const tx = new Transaction();

    const attributeMintKeypair = Keypair.generate();

    // create account for attribute mint
    let createAccountIx = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: attributeMintKeypair.publicKey,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });
    // init attribute mint
    let createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      attributeMintKeypair.publicKey,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );
    // create account for canvas collection mint
    let canvasModelCollectionMintKeypair = Keypair.generate();
    let createAccountIIx = SystemProgram.createAccount({
      fromPubkey: this.wallet.publicKey,
      newAccountPubkey: canvasModelCollectionMintKeypair.publicKey,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });
    // init canvas collection mint
    let createMintIIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      canvasModelCollectionMintKeypair.publicKey,
      0,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    let attributeMetadataAddress = findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        attributeMintKeypair.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    let createMetadataIx = createCreateMetadataAccountV2Instruction(
      {
        metadata: attributeMetadataAddress[0],
        mint: attributeMintKeypair.publicKey,
        mintAuthority: this.wallet.publicKey,
        payer: this.wallet.publicKey,
        updateAuthority: this.wallet.publicKey,
      },
      {
        createMetadataAccountArgsV2: {
          data: {
            name: "Test From Devland",
            symbol: "DEVLAND",
            uri: "https://api.jsonbin.io/b/627e726138be29676103f1ae/1",
            sellerFeeBasisPoints: 0,
            creators: [
              {
                address: this.wallet.publicKey,
                share: 100,
                verified: false,
              },
            ],
            collection: {
              verified: false,
              key: Keypair.generate().publicKey,
            },
            uses: {
              useMethod: UseMethod.Burn,
              remaining: 0,
              total: 0,
            },
          },
          isMutable: true,
        },
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

    // const mintTokenIx = Token.createMintToInstruction(TOKEN_PROGRAM_ID, attributeMintKeypair.publicKey, );

    let canvasModelName = "nil_bearz";
    let canvasModelAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model"),
        this.wallet.publicKey.toBuffer(),
        Buffer.from(canvasModelName),
        canvasModelCollectionMintKeypair.publicKey.toBuffer(),
      ],
      this.program.programId
    );
    let createCanvasModelIx = await this.program.methods
      .createCanvasModel(canvasModelName, canvasModelAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        collectionMint: canvasModelCollectionMintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // create incrementor
    let canvasModelSlotIncrementorAddress = findProgramAddressSync(
      [
        Buffer.from("incrementor"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("canvas_model_slot"),
      ],
      this.program.programId
    );

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
        collectionMint: canvasModelCollectionMintKeypair.publicKey,
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

    const canvasName = "austin's nilbearz";
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
