import * as anchor from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor";
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
  TransactionInstruction,
} from "@solana/web3.js";
import { Canvas } from "../../target/types/canvas";
import {
  createCreateMetadataAccountV2Instruction,
  CreateMetadataAccountArgsV2,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
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
      .createCanvasModelSlotIncrementor(canvasModelSlotIncrementorAddress[1])
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

  async assignNftToCanvasSlot({
    createMetadataAccountArgsV2,
    canvasModelName,
    canvasName
  }: {
    createMetadataAccountArgsV2: CreateMetadataAccountArgsV2;
    canvasModelName: string;
    canvasName: string
  }) {
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

    let attributeMetadataAddress = await PublicKey.findProgramAddress(
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
        createMetadataAccountArgsV2,
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

    let canvasModelAddress = await PublicKey.findProgramAddress(
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
    let canvasModelSlotIncrementorAddress = await PublicKey.findProgramAddress(
      [
        Buffer.from("incrementor"),
        this.wallet.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("canvas_model_slot"),
      ],
      this.program.programId
    );

    const createCanvasModelSlotIncrementorIx = await this.program.methods
      .createCanvasModelSlotIncrementor(canvasModelSlotIncrementorAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: this.wallet.publicKey,
        incrementor: canvasModelSlotIncrementorAddress[0],
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // create slots
    // @TODO: parameterize
    const canvasModelSlot1Props = {
      name: "head",
      index: 1,
    };

    let canvasModelSlot1Address = await PublicKey.findProgramAddress(
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

    await this.wallet.signTransaction(tx);

    try {
      let initAccountsSig = await this.connection.sendTransaction(tx, [
        attributeMintKeypair,
        canvasModelCollectionMintKeypair,
      ]);

      let { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash();

      let confirmation = await this.connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: initAccountsSig,
      });
      if (confirmation.value.err) {
        console.error(confirmation.value.err);
      }
    } catch (e) {
      console.error(e);
    }

    let tx2 = new Transaction();

    const canvasModelSlotMintAssociationAddress =
      await PublicKey.findProgramAddress(
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
    await this.wallet.signTransaction(tx2);

    try {
      let setupCanvasSig = await this.connection.sendTransaction(tx2, []);
      let { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash();

      let confirmation = await this.connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: setupCanvasSig,
      });

      if (confirmation.value.err) {
        console.log(confirmation.value.err);
      }
    } catch (e) {
      console.log(e);
    }

    const tx3 = new Transaction();

    const canvasAddress = await PublicKey.findProgramAddress(
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

    const canvasSlotTokenAccountAddress = await PublicKey.findProgramAddress(
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

    try {
      await this.wallet.signTransaction(tx3);
      let createCanvasSig = await this.connection.sendTransaction(tx3, []);
      let { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash();
      let confirmation = await this.connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: createCanvasSig,
      });

      if (confirmation.value.err) {
        console.log(confirmation.value.err);
      }
    } catch (e) {
      console.log(e);
    }

    const attributeNFTMint = new Token(
      this.connection,
      attributeMintKeypair.publicKey,
      TOKEN_PROGRAM_ID,
      this.wallet.payer
    );
    const accountInfo = await attributeNFTMint.getAccountInfo(
      associatedTokenAccountAddress
    );

    const tx4 = new Transaction();
    const transferTokenFromCanvasToAccountIx = await this.program.methods
      .transferTokenFromCanvasToAccount()
      .accounts({
        canvas: canvasAddress[0],
        canvasSlotTokenAccount: canvasSlotTokenAccountAddress[0],
        tokenAccount: associatedTokenAccountAddress,
        mint: attributeMintKeypair.publicKey,
        authority: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx4.add(transferTokenFromCanvasToAccountIx);

    await this.wallet.signTransaction(tx4);

    let transferTokenFromCanvasToAccountSig =
      await this.connection.sendTransaction(tx4, [], { skipPreflight: true });

    let { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash();
    let confirmation = await this.connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: transferTokenFromCanvasToAccountSig,
    });
    if (confirmation.value.err) {
      console.error(confirmation.value.err);
    }

    const accountInfoAfter = await attributeNFTMint.getAccountInfo(
      associatedTokenAccountAddress
    );
  }
}
