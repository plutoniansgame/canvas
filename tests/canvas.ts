import { assert } from "chai";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { Canvas } from "../target/types/canvas";
import { loadKeyPairFromFs } from "../util/load-keypair-from-fs";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  createCreateMetadataAccountV2Instruction,
  CreateMetadataAccountArgsV2,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  UseMethod,
} from "@metaplex-foundation/mpl-token-metadata";
import { BN } from "bn.js";

describe("nft canvas", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Canvas as anchor.Program<Canvas>;
  const account1 = loadKeyPairFromFs("dev_keys/account1.json");
  const account2 = loadKeyPairFromFs("dev_keys/account2.json");

  it("initialize and set authority", async () => {});
  it("create nft canvas model", async () => {
    const connection = anchor.getProvider().connection;

    // let account1Balance = await connection.getBalance(account1.publicKey);
    // let account2Balance = await connection.getBalance(account2.publicKey);

    // if (account1Balance < 1) {
    //   let account1AirdropRequestSig = await connection.requestAirdrop(
    //     account1.publicKey,
    //     1,
    //   );
    //   let { blockhash, lastValidBlockHeight } = await connection
    //     .getLatestBlockhash();
    //   await connection.confirmTransaction({
    //     signature: account1AirdropRequestSig,
    //     blockhash,
    //     lastValidBlockHeight,
    //   });
    // }
    // if (account2Balance < 1) {
    //   let account2AirdropRequestSig = await connection.requestAirdrop(
    //     account2.publicKey,
    //     1,
    //   );
    //   let { blockhash, lastValidBlockHeight } = await connection
    //     .getLatestBlockhash();
    //   let foo = await connection.confirmTransaction({
    //     signature: account2AirdropRequestSig,
    //     blockhash,
    //     lastValidBlockHeight,
    //   });
    // }

    // console.log({ account1Balance, account2Balance });
    // return;

    const tx = new Transaction();

    const mintKeypair = Keypair.generate();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: account1.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    tx.add(createAccountInstruction);

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      0,
      account1.publicKey,
      account1.publicKey,
    );

    tx.add(createMintIx);

    const canvasModelAddress = findProgramAddressSync([
      Buffer.from("canvas_model"),
      account1.publicKey.toBuffer(),
      Buffer.from("nil_bearz"),
      mintKeypair.publicKey.toBuffer(),
    ], program.programId);

    const createCanvasModelIx = await program.methods.createCanvasModel(
      "nil_bearz",
      canvasModelAddress[1],
    )
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: account1.publicKey,
        collectionMint: mintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      }).signers([account1, mintKeypair]).instruction();

    tx.add(createCanvasModelIx);

    try {
      const createCanvasModelSig = await connection.sendTransaction(tx, [
        account1,
        mintKeypair,
      ]);

      const { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();

      const result = await connection.confirmTransaction(
        {
          signature: createCanvasModelSig,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    let canvasModel = await program.account.canvasModel.fetch(
      canvasModelAddress[0],
    );

    assert.equal(
      mintKeypair.publicKey.toBase58(),
      canvasModel.collectionMint.toBase58(),
      "canvas model collection mint must match mint public key",
    );
  });

  it("create component slots", async () => {
    const connection = anchor.getProvider().connection;
    const tx = new Transaction();

    let mintKeypair = Keypair.generate();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: account1.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      0,
      account1.publicKey,
      account1.publicKey,
    );

    const canvasModelAddress = findProgramAddressSync([
      Buffer.from("canvas_model"),
      account1.publicKey.toBuffer(),
      Buffer.from("nil_bearz"),
      mintKeypair.publicKey.toBuffer(),
    ], program.programId);

    const createCanvasModelIx = await program.methods.createCanvasModel(
      "nil_bearz",
      canvasModelAddress[1],
    )
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: account1.publicKey,
        collectionMint: mintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();

    const canvasModelSlotIncrementorAddress = findProgramAddressSync([
      Buffer.from("incrementor"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from("canvas_model_slot"),
    ], program.programId);

    const createCanvasModelSlotIncrementorIx = await program.methods
      .createCanvasModelSlotIncrementor(
        "canvas_model_slot",
        canvasModelSlotIncrementorAddress[1],
      ).accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();

    const canvasModelSlotAddress1 = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        account1.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("head"),
        new BN(1).toBuffer(),
      ],
      program.programId,
    );

    const createSlotIx = await program.methods.createCanvasModelSlot(
      "head",
      1,
      canvasModelSlotAddress1[1],
    ).accounts(
      {
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress1[0],
        collectionMint: mintKeypair.publicKey,
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      },
    ).instruction();

    const canvasModelSlotAddress2 = findProgramAddressSync([
      Buffer.from("canvas_model_slot"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from("body"),
      new BN(2).toBuffer(),
    ], program.programId);

    const createSlotIIx = await program.methods.createCanvasModelSlot(
      "body",
      2,
      canvasModelSlotAddress2[1],
    ).accounts(
      {
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress2[0],
        collectionMint: mintKeypair.publicKey,
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      },
    ).signers([account1]).instruction();

    tx.add(createAccountInstruction)
      .add(createMintIx)
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx)
      .add(createSlotIx)
      .add(createSlotIIx);

    try {
      const signature = await connection.sendTransaction(tx, [
        account1,
        mintKeypair,
      ]);
      const { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();
      const result = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    // const slots = await program.account.canvasModelSlot.all();
    // slots.forEach((slot) => {
    //   console.log(slot.account.canvasModel.toBase58());
    //   console.log(slot.account.index);
    //   console.log("\n");
    // });
  });

  it("associate mints with slots", async () => {
    const connection = anchor.getProvider().connection;
    const tx = new Transaction();

    let mintKeypair = Keypair.generate();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: account1.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      0,
      account1.publicKey,
      account1.publicKey,
    );

    const canvasModelAddress = findProgramAddressSync([
      Buffer.from("canvas_model"),
      account1.publicKey.toBuffer(),
      Buffer.from("nil_bearz"),
      mintKeypair.publicKey.toBuffer(),
    ], program.programId);

    const createCanvasModelIx = await program.methods.createCanvasModel(
      "nil_bearz",
      canvasModelAddress[1],
    )
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: account1.publicKey,
        collectionMint: mintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();

    const canvasModelSlotIncrementorAddress = findProgramAddressSync([
      Buffer.from("incrementor"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from("canvas_model_slot"),
    ], program.programId);

    const createCanvasModelSlotIncrementorIx = await program.methods
      .createCanvasModelSlotIncrementor(
        "canvas_model_slot",
        canvasModelSlotIncrementorAddress[1],
      ).accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();

    const canvasModelSlotAddress1 = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        account1.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("head"),
        new BN(1).toBuffer(),
      ],
      program.programId,
    );

    const createSlotIx = await program.methods.createCanvasModelSlot(
      "head",
      1,
      canvasModelSlotAddress1[1],
    ).accounts(
      {
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress1[0],
        collectionMint: mintKeypair.publicKey,
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      },
    ).instruction();

    const canvasModelSlotAddress2 = findProgramAddressSync([
      Buffer.from("canvas_model_slot"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from("body"),
      new BN(2).toBuffer(),
    ], program.programId);

    const createSlotIIx = await program.methods.createCanvasModelSlot(
      "body",
      2,
      canvasModelSlotAddress2[1],
    ).accounts(
      {
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress2[0],
        collectionMint: mintKeypair.publicKey,
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      },
    ).signers([account1]).instruction();

    tx.add(createAccountInstruction)
      .add(createMintIx)
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx)
      .add(createSlotIx)
      .add(createSlotIIx);

    try {
      const signature = await connection.sendTransaction(tx, [
        account1,
        mintKeypair,
      ]);
      const { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();
      const result = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    const anotherMintKeypair = Keypair.generate();
    const tx2 = new Transaction();

    const createAccountIIx = SystemProgram.createAccount({
      fromPubkey: account1.publicKey,
      newAccountPubkey: anotherMintKeypair.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const createMintIIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      anotherMintKeypair.publicKey,
      0,
      account1.publicKey,
      account1.publicKey,
    );

    const canvasModelSlot1 = await program.account.canvasModelSlot.fetch(
      canvasModelSlotAddress1[0],
    );

    const canvasModelSlotMintAssociationAddress = findProgramAddressSync([
      Buffer.from("canvas_model_slot_mint"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      canvasModelSlotAddress1[0].toBuffer(),
      anotherMintKeypair.publicKey.toBuffer(),
    ], program.programId);

    const associateMintWithSlotIx = await program.methods
      .createCanvasModelSlotMintAssociation(
        canvasModelSlot1.index,
        false,
        canvasModelSlotMintAssociationAddress[1],
      ).accounts({
        canvasModel: canvasModelAddress[0],
        canvasModelSlot: canvasModelSlotAddress1[0],
        canvasModelSlotMintAssociation:
          canvasModelSlotMintAssociationAddress[0],
        associatedMint: anotherMintKeypair.publicKey,
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();

    tx2.add(createAccountIIx).add(createMintIIx).add(associateMintWithSlotIx);

    try {
      let associationSig = await connection.sendTransaction(tx2, [
        account1,
        anotherMintKeypair,
      ]);
      let { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();

      let confirmation = await connection.confirmTransaction({
        signature: associationSig,
        blockhash,
        lastValidBlockHeight,
      });
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    let sma = await program.account.canvasModelSlotMintAssociation.fetch(
      canvasModelSlotMintAssociationAddress[0],
    );
  });

  it("create nft canvas instance", async () => {
    const connection = anchor.getProvider().connection;
    const tx = new Transaction();

    let mintKeypair = Keypair.generate();

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: account1.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      0,
      account1.publicKey,
      account1.publicKey,
    );

    const canvasModelAddress = findProgramAddressSync([
      Buffer.from("canvas_model"),
      account1.publicKey.toBuffer(),
      Buffer.from("nil_bearz"),
      mintKeypair.publicKey.toBuffer(),
    ], program.programId);

    const createCanvasModelIx = await program.methods.createCanvasModel(
      "nil_bearz",
      canvasModelAddress[1],
    )
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator: account1.publicKey,
        collectionMint: mintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();

    const canvasModelSlotIncrementorAddress = findProgramAddressSync([
      Buffer.from("incrementor"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from("canvas_model_slot"),
    ], program.programId);

    const createCanvasModelSlotIncrementorIx = await program.methods
      .createCanvasModelSlotIncrementor(
        "canvas_model_slot",
        canvasModelSlotIncrementorAddress[1],
      ).accounts({
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();

    const canvasModelSlotAddress1 = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot"),
        account1.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        Buffer.from("head"),
        new BN(1).toBuffer(),
      ],
      program.programId,
    );

    const createSlotIx = await program.methods.createCanvasModelSlot(
      "head",
      1,
      canvasModelSlotAddress1[1],
    ).accounts(
      {
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress1[0],
        collectionMint: mintKeypair.publicKey,
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      },
    ).instruction();

    const canvasModelSlotAddress2 = findProgramAddressSync([
      Buffer.from("canvas_model_slot"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from("body"),
      new BN(2).toBuffer(),
    ], program.programId);

    const createSlotIIx = await program.methods.createCanvasModelSlot(
      "body",
      2,
      canvasModelSlotAddress2[1],
    ).accounts(
      {
        canvasModel: canvasModelAddress[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        canvasModelSlot: canvasModelSlotAddress2[0],
        collectionMint: mintKeypair.publicKey,
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      },
    ).signers([account1]).instruction();

    tx.add(createAccountInstruction)
      .add(createMintIx)
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx)
      .add(createSlotIx)
      .add(createSlotIIx);

    try {
      const signature = await connection.sendTransaction(tx, [
        account1,
        mintKeypair,
      ]);
      const { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();
      const result = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    const anotherMintKeypair = Keypair.generate();
    const tx2 = new Transaction();

    const createAccountIIx = SystemProgram.createAccount({
      fromPubkey: account1.publicKey,
      newAccountPubkey: anotherMintKeypair.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const createMintIIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      anotherMintKeypair.publicKey,
      0,
      account1.publicKey,
      account1.publicKey,
    );

    const canvasModelSlot1 = await program.account.canvasModelSlot.fetch(
      canvasModelSlotAddress1[0],
    );

    const canvasModelSlotMintAssociationAddress = findProgramAddressSync([
      Buffer.from("canvas_model_slot_mint"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      canvasModelSlotAddress1[0].toBuffer(),
      anotherMintKeypair.publicKey.toBuffer(),
    ], program.programId);

    const associateMintWithSlotIx = await program.methods
      .createCanvasModelSlotMintAssociation(
        canvasModelSlot1.index,
        false,
        canvasModelSlotMintAssociationAddress[1],
      ).accounts({
        canvasModel: canvasModelAddress[0],
        canvasModelSlot: canvasModelSlotAddress1[0],
        canvasModelSlotMintAssociation:
          canvasModelSlotMintAssociationAddress[0],
        associatedMint: anotherMintKeypair.publicKey,
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();

    tx2.add(createAccountIIx).add(createMintIIx).add(associateMintWithSlotIx);

    try {
      let associationSig = await connection.sendTransaction(tx2, [
        account1,
        anotherMintKeypair,
      ]);
      let { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();

      let confirmation = await connection.confirmTransaction({
        signature: associationSig,
        blockhash,
        lastValidBlockHeight,
      });
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    const canvasName = "austin's canvas";
    const canvasAddress = findProgramAddressSync([
      Buffer.from("canvas"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from(canvasName),
    ], program.programId);

    let tx3 = new Transaction();
    let createCanvasIx = await program.methods.createCanvas(
      canvasName,
      canvasAddress[1],
    )
      .accounts({
        canvas: canvasAddress[0],
        canvasModel: canvasModelAddress[0],
        creator: account1.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();

    tx3.add(createCanvasIx);

    let createCanvasSignature = await connection.sendTransaction(tx3, [
      account1,
    ]);

    try {
      let { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();
      let result = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: createCanvasSignature,
      });

      if (result.value.err) {
        console.log(result.value.err);
        assert.fail();
      }
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    let canvas = await program.account.canvas.fetch(canvasAddress[0]);
    assert.equal(
      account1.publicKey.toBase58(),
      canvas.creator.toBase58(),
      "creator must match expected key",
    );
  });

  it("assign nft to canvas instance slot", async () => {
    const connection = anchor.getProvider().connection;
    const tx = new Transaction();

    const attributeMintKeypair = Keypair.generate();

    // create account for attribute mint
    let createAccountIx = SystemProgram.createAccount(
      {
        fromPubkey: account1.publicKey,
        newAccountPubkey: attributeMintKeypair.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(
          MintLayout.span,
        ),
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      },
    );
    // init attribute mint
    let createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      attributeMintKeypair.publicKey,
      0,
      account1.publicKey,
      account1.publicKey,
    );
    // create account for canvas collection mint
    let canvasModelCollectionMintKeypair = Keypair.generate();
    let createAccountIIx = SystemProgram.createAccount({
      fromPubkey: account1.publicKey,
      newAccountPubkey: canvasModelCollectionMintKeypair.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });
    // init canvas collection mint
    let createMintIIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      canvasModelCollectionMintKeypair.publicKey,
      0,
      account1.publicKey,
      account1.publicKey,
    );

    let attributeMetadataAddress = findProgramAddressSync([
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      attributeMintKeypair.publicKey.toBuffer(),
    ], TOKEN_METADATA_PROGRAM_ID);
    let createMetadataIx = createCreateMetadataAccountV2Instruction({
      metadata: attributeMetadataAddress[0],
      mint: attributeMintKeypair.publicKey,
      mintAuthority: account1.publicKey,
      payer: account1.publicKey,
      updateAuthority: account1.publicKey,
    }, {
      createMetadataAccountArgsV2: {
        data: {
          name: "Test From Devland",
          symbol: "DEVLAND",
          uri: "https://api.jsonbin.io/b/627e726138be29676103f1ae/1",
          sellerFeeBasisPoints: 0,
          creators: [{
            address: account1.publicKey,
            share: 100,
            verified: false,
          }],
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
    });

    const associatedTokenAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      attributeMintKeypair.publicKey,
      account1.publicKey,
      false,
    );
    const createUserTokenAccountIx = Token
      .createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        attributeMintKeypair.publicKey,
        associatedTokenAccountAddress,
        account1.publicKey,
        account1.publicKey,
      );
    const mintIx = Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      attributeMintKeypair.publicKey,
      associatedTokenAccountAddress,
      account1.publicKey,
      [],
      1,
    );

    // const mintTokenIx = Token.createMintToInstruction(TOKEN_PROGRAM_ID, attributeMintKeypair.publicKey, );

    let canvasModelName = "nil_bearz";
    let canvasModelAddress = findProgramAddressSync([
      Buffer.from("canvas_model"),
      account1.publicKey.toBuffer(),
      Buffer.from(canvasModelName),
      canvasModelCollectionMintKeypair.publicKey.toBuffer(),
    ], program.programId);
    let createCanvasModelIx = await program.methods.createCanvasModel(
      canvasModelName,
      canvasModelAddress[1],
    ).accounts({
      canvasModel: canvasModelAddress[0],
      collectionMint: canvasModelCollectionMintKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    }).instruction();

    // create incrementor
    let canvasModelSlotIncrementorAddress = findProgramAddressSync([
      Buffer.from("incrementor"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from("canvas_model_slot"),
    ], program.programId);

    const createCanvasModelSlotIncrementorIx = await program.methods
      .createCanvasModelSlotIncrementor(
        "canvas_model_slot",
        canvasModelSlotIncrementorAddress[1],
      ).accounts({
        canvasModel: canvasModelAddress[0],
        creator: account1.publicKey,
        incrementor: canvasModelSlotIncrementorAddress[0],
        systemProgram: SystemProgram.programId,
      }).instruction();

    // create slots
    const canvasModelSlot1Props = {
      name: "head",
      index: 1,
    };

    let canvasModelSlot1Address = findProgramAddressSync([
      Buffer.from("canvas_model_slot"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from(canvasModelSlot1Props.name),
      new BN(canvasModelSlot1Props.index).toBuffer(),
    ], program.programId);

    const createCanvasModelSlotIx = await program.methods
      .createCanvasModelSlot(
        canvasModelSlot1Props.name,
        canvasModelSlot1Props.index,
        canvasModelSlot1Address[1],
      ).accounts({
        canvasModel: canvasModelAddress[0],
        canvasModelSlot: canvasModelSlot1Address[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        collectionMint: canvasModelCollectionMintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();
    // associate nft mints with slots
    // create canvas
    tx.add(createAccountIx)
      .add(createMintIx)
      .add(createMetadataIx)
      .add(createAccountIIx)
      .add(createMintIIx)
      .add(createUserTokenAccountIx)
      .add(mintIx);

    try {
      let initAccountsSig = await connection.sendTransaction(tx, [
        account1,
        attributeMintKeypair,
        canvasModelCollectionMintKeypair,
      ]);

      let { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();

      let confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: initAccountsSig,
      });
      if (confirmation.value.err) {
        console.log(confirmation.value.err);
        assert.fail();
      }
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    let tx2 = new Transaction();

    const canvasModelSlotMintAssociationAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot_mint"),
        account1.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        canvasModelSlot1Address[0].toBuffer(),
        attributeMintKeypair.publicKey.toBuffer(),
      ],
      program.programId,
    );

    const createSlotMintAssociationIx = await program.methods
      .createCanvasModelSlotMintAssociation(
        canvasModelSlot1Props.index,
        false,
        canvasModelSlotMintAssociationAddress[1],
      )
      .accounts(
        {
          canvasModel: canvasModelAddress[0],
          canvasModelSlot: canvasModelSlot1Address[0],
          canvasModelSlotMintAssociation:
            canvasModelSlotMintAssociationAddress[0],
          associatedMint: attributeMintKeypair.publicKey,
          creator: account1.publicKey,
          systemProgram: SystemProgram.programId,
        },
      ).instruction();

    tx2
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx)
      .add(createCanvasModelSlotIx)
      .add(createSlotMintAssociationIx);

    try {
      let setupCanvasSig = await connection.sendTransaction(tx2, [account1]);
      let { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();

      let confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: setupCanvasSig,
      });

      if (confirmation.value.err) {
        console.log(confirmation.value.err);
        assert.fail();
      }
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    const tx3 = new Transaction();

    const canvasName = "austin's nilbearz";
    const canvasAddress = findProgramAddressSync([
      Buffer.from("canvas"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from(canvasName),
    ], program.programId);
    const createCanvasIx = await program.methods.createCanvas(
      canvasName,
      canvasAddress[1],
    ).accounts({
      canvas: canvasAddress[0],
      canvasModel: canvasModelAddress[0],
      creator: account1.publicKey,
      systemProgram: SystemProgram.programId,
    }).instruction();

    const canvasSlotTokenAccountAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_token_account"),
        account1.publicKey.toBuffer(),
        canvasAddress[0].toBuffer(),
        canvasModelAddress[0].toBuffer(),
        canvasModelSlot1Address[0].toBuffer(),
        attributeMintKeypair.publicKey.toBuffer(),
      ],
      program.programId,
    );

    const transferTokenToCanvasIx = await program.methods
      .transferTokenToCanvas(canvasModelAddress[0]).accounts(
        {
          canvas: canvasAddress[0],
          canvasModelSlot: canvasModelSlot1Address[0],
          tokenAccount: associatedTokenAccountAddress,
          mint: attributeMintKeypair.publicKey,
          canvasModelSlotMintAssociation:
            canvasModelSlotMintAssociationAddress[0],
          canvasSlotTokenAccount: canvasSlotTokenAccountAddress[0],
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          creator: account1.publicKey,
        },
      ).instruction();

    tx3.add(createCanvasIx)
      .add(transferTokenToCanvasIx);

    try {
      let createCanvasSig = await connection.sendTransaction(tx3, [account1]);
      let { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();
      let confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: createCanvasSig,
      });

      if (confirmation.value.err) {
        console.log(confirmation.value.err);
        assert.fail();
      }
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    const attributeNFTMint = new Token(
      connection,
      attributeMintKeypair.publicKey,
      TOKEN_PROGRAM_ID,
      account1,
    );
    const accountInfo = await attributeNFTMint.getAccountInfo(
      associatedTokenAccountAddress,
    );

    assert(
      accountInfo.amount.eq(new BN(0)),
      "token balance must equal 0 after transaction",
    );

    const tx4 = new Transaction();
    const transferTokenFromCanvasToAccountIx = await program.methods
      .transferTokenFromCanvasToAccount().accounts({
        canvas: canvasAddress[0],
        canvasModel: canvasModelAddress[0],
        canvasModelSlot: canvasModelSlot1Address[0],
        canvasSlotTokenAccount: canvasSlotTokenAccountAddress[0],
        tokenAccount: associatedTokenAccountAddress,
        mint: attributeMintKeypair.publicKey,
        authority: account1.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).instruction();

    tx4.add(transferTokenFromCanvasToAccountIx);

    let transferTokenFromCanvasToAccountSig = await connection.sendTransaction(
      tx4,
      [account1],
      { skipPreflight: true },
    );

    let { blockhash, lastValidBlockHeight } = await connection
      .getLatestBlockhash();
    let confirmation = await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: transferTokenFromCanvasToAccountSig,
    });
    if (confirmation.value.err) {
      assert.fail();
    }

    const accountInfoAfter = await attributeNFTMint.getAccountInfo(
      associatedTokenAccountAddress,
    );
    assert(
      accountInfoAfter.amount.eq(new BN(1)),
      "token balance must equal 1 after transaction",
    );
  });

  xit("commit canvas and mint", async () => {
    const connection = anchor.getProvider().connection;
    const tx = new Transaction();

    const attributeMintKeypair = Keypair.generate();

    // create account for attribute mint
    let createAccountIx = SystemProgram.createAccount(
      {
        fromPubkey: account1.publicKey,
        newAccountPubkey: attributeMintKeypair.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(
          MintLayout.span,
        ),
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      },
    );
    // init attribute mint
    let createMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      attributeMintKeypair.publicKey,
      0,
      account1.publicKey,
      account1.publicKey,
    );
    // create account for canvas collection mint
    let canvasModelCollectionMintKeypair = Keypair.generate();
    let createAccountIIx = SystemProgram.createAccount({
      fromPubkey: account1.publicKey,
      newAccountPubkey: canvasModelCollectionMintKeypair.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });
    // init canvas collection mint
    let createMintIIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      canvasModelCollectionMintKeypair.publicKey,
      0,
      account1.publicKey,
      account1.publicKey,
    );

    let attributeMetadataAddress = findProgramAddressSync([
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      attributeMintKeypair.publicKey.toBuffer(),
    ], TOKEN_METADATA_PROGRAM_ID);
    let createMetadataIx = createCreateMetadataAccountV2Instruction({
      metadata: attributeMetadataAddress[0],
      mint: attributeMintKeypair.publicKey,
      mintAuthority: account1.publicKey,
      payer: account1.publicKey,
      updateAuthority: account1.publicKey,
    }, {
      createMetadataAccountArgsV2: {
        data: {
          name: "Test From Devland",
          symbol: "DEVLAND",
          uri: "https://api.jsonbin.io/b/627e726138be29676103f1ae/1",
          sellerFeeBasisPoints: 0,
          creators: [{
            address: account1.publicKey,
            share: 100,
            verified: false,
          }],
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
    });

    const associatedTokenAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      attributeMintKeypair.publicKey,
      account1.publicKey,
      false,
    );
    const createUserTokenAccountIx = Token
      .createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        attributeMintKeypair.publicKey,
        associatedTokenAccountAddress,
        account1.publicKey,
        account1.publicKey,
      );
    const mintIx = Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      attributeMintKeypair.publicKey,
      associatedTokenAccountAddress,
      account1.publicKey,
      [],
      1,
    );

    // const mintTokenIx = Token.createMintToInstruction(TOKEN_PROGRAM_ID, attributeMintKeypair.publicKey, );

    let canvasModelName = "nil_bearz";
    let canvasModelAddress = findProgramAddressSync([
      Buffer.from("canvas_model"),
      account1.publicKey.toBuffer(),
      Buffer.from(canvasModelName),
      canvasModelCollectionMintKeypair.publicKey.toBuffer(),
    ], program.programId);
    let createCanvasModelIx = await program.methods.createCanvasModel(
      canvasModelName,
      canvasModelAddress[1],
    ).accounts({
      canvasModel: canvasModelAddress[0],
      collectionMint: canvasModelCollectionMintKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    }).instruction();

    // create incrementor
    let canvasModelSlotIncrementorAddress = findProgramAddressSync([
      Buffer.from("incrementor"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from("canvas_model_slot"),
    ], program.programId);

    const createCanvasModelSlotIncrementorIx = await program.methods
      .createCanvasModelSlotIncrementor(
        "canvas_model_slot",
        canvasModelSlotIncrementorAddress[1],
      ).accounts({
        canvasModel: canvasModelAddress[0],
        creator: account1.publicKey,
        incrementor: canvasModelSlotIncrementorAddress[0],
        systemProgram: SystemProgram.programId,
      }).instruction();

    // create slots
    const canvasModelSlot1Props = {
      name: "head",
      index: 1,
    };

    let canvasModelSlot1Address = findProgramAddressSync([
      Buffer.from("canvas_model_slot"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from(canvasModelSlot1Props.name),
      new BN(canvasModelSlot1Props.index).toBuffer(),
    ], program.programId);

    const createCanvasModelSlotIx = await program.methods
      .createCanvasModelSlot(
        canvasModelSlot1Props.name,
        canvasModelSlot1Props.index,
        canvasModelSlot1Address[1],
      ).accounts({
        canvasModel: canvasModelAddress[0],
        canvasModelSlot: canvasModelSlot1Address[0],
        incrementor: canvasModelSlotIncrementorAddress[0],
        collectionMint: canvasModelCollectionMintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      }).instruction();
    // associate nft mints with slots
    // create canvas
    tx.add(createAccountIx)
      .add(createMintIx)
      .add(createMetadataIx)
      .add(createAccountIIx)
      .add(createMintIIx)
      .add(createUserTokenAccountIx)
      .add(mintIx);

    try {
      let initAccountsSig = await connection.sendTransaction(tx, [
        account1,
        attributeMintKeypair,
        canvasModelCollectionMintKeypair,
      ]);

      let { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();

      let confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: initAccountsSig,
      });
      if (confirmation.value.err) {
        console.log(confirmation.value.err);
        assert.fail();
      }
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    let tx2 = new Transaction();

    const canvasModelSlotMintAssociationAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_model_slot_mint"),
        account1.publicKey.toBuffer(),
        canvasModelAddress[0].toBuffer(),
        canvasModelSlot1Address[0].toBuffer(),
        attributeMintKeypair.publicKey.toBuffer(),
      ],
      program.programId,
    );

    const createSlotMintAssociationIx = await program.methods
      .createCanvasModelSlotMintAssociation(
        canvasModelSlot1Props.index,
        false,
        canvasModelSlotMintAssociationAddress[1],
      )
      .accounts(
        {
          canvasModel: canvasModelAddress[0],
          canvasModelSlot: canvasModelSlot1Address[0],
          canvasModelSlotMintAssociation:
            canvasModelSlotMintAssociationAddress[0],
          associatedMint: attributeMintKeypair.publicKey,
          creator: account1.publicKey,
          systemProgram: SystemProgram.programId,
        },
      ).instruction();

    tx2
      .add(createCanvasModelIx)
      .add(createCanvasModelSlotIncrementorIx)
      .add(createCanvasModelSlotIx)
      .add(createSlotMintAssociationIx);

    try {
      let setupCanvasSig = await connection.sendTransaction(tx2, [account1]);
      let { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();

      let confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: setupCanvasSig,
      });

      if (confirmation.value.err) {
        console.log(confirmation.value.err);
        assert.fail();
      }
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    const tx3 = new Transaction();

    const canvasName = "austin's nilbearz";
    const canvasAddress = findProgramAddressSync([
      Buffer.from("canvas"),
      account1.publicKey.toBuffer(),
      canvasModelAddress[0].toBuffer(),
      Buffer.from(canvasName),
    ], program.programId);
    const createCanvasIx = await program.methods.createCanvas(
      canvasName,
      canvasAddress[1],
    ).accounts({
      canvas: canvasAddress[0],
      canvasModel: canvasModelAddress[0],
      creator: account1.publicKey,
      systemProgram: SystemProgram.programId,
    }).instruction();

    const canvasSlotTokenAccountAddress = findProgramAddressSync(
      [
        Buffer.from("canvas_token_account"),
        account1.publicKey.toBuffer(),
        canvasAddress[0].toBuffer(),
        canvasModelAddress[0].toBuffer(),
        canvasModelSlot1Address[0].toBuffer(),
        attributeMintKeypair.publicKey.toBuffer(),
      ],
      program.programId,
    );

    const transferTokenToCanvasIx = await program.methods
      .transferTokenToCanvas(canvasModelAddress[0]).accounts(
        {
          canvas: canvasAddress[0],
          canvasModelSlot: canvasModelSlot1Address[0],
          tokenAccount: associatedTokenAccountAddress,
          mint: attributeMintKeypair.publicKey,
          canvasModelSlotMintAssociation:
            canvasModelSlotMintAssociationAddress[0],
          canvasSlotTokenAccount: canvasSlotTokenAccountAddress[0],
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          creator: account1.publicKey,
        },
      ).instruction();

    tx3.add(createCanvasIx)
      .add(transferTokenToCanvasIx);

    try {
      let createCanvasSig = await connection.sendTransaction(tx3, [account1]);
      let { blockhash, lastValidBlockHeight } = await connection
        .getLatestBlockhash();
      let confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: createCanvasSig,
      });

      if (confirmation.value.err) {
        console.log(confirmation.value.err);
        assert.fail();
      }
    } catch (e) {
      console.log(e);
      assert.fail();
    }

    const attributeNFTMint = new Token(
      connection,
      attributeMintKeypair.publicKey,
      TOKEN_PROGRAM_ID,
      account1,
    );
    const accountInfo = await attributeNFTMint.getAccountInfo(
      associatedTokenAccountAddress,
    );

    assert(
      accountInfo.amount.eq(new BN(0)),
      "token balance must equal 0 after transaction",
    );

    // commit and mint nft.
    let tx4 = new Transaction();

    let commitMintIx = await program.methods.commitMint({})
      .accounts({
        creator: account1.publicKey,
      })
      .instruction();

    const commitMintSig = await connection.sendTransaction(tx4, [account1]);
    let { blockhash: blockHash4, lastValidBlockHeight: blockHeight4 } =
      await connection.getLatestBlockhash();
    const tx4Confirmation = await connection.confirmTransaction({
      signature: commitMintSig,
      blockhash: blockHash4,
      lastValidBlockHeight: blockHeight4,
    });

    if (tx4Confirmation.value.err) {
      assert.fail(tx4Confirmation.value.err.toString());
    }
  });
  xit("consume nft and transfer backing nfts", async () => {});
  xit("cleans up accounts", async () => {
    const connection = anchor.getProvider().connection;

    let allTokenAccounts = await connection.getTokenAccountsByOwner(
      account1.publicKey,
      { programId: TOKEN_PROGRAM_ID },
    );

    // allTokenAccounts.value.forEach((account) => {
    for (let i = 0; i < allTokenAccounts.value.length; i++) {
      let tx = new Transaction();
      let account = allTokenAccounts.value[i];
      console.log("removing account", account.pubkey.toBase58());
      let al = AccountLayout.decode(account.account.data);
      if (new BN(al.amount).gt(new BN(0))) {
        let burnIx = Token.createBurnInstruction(
          TOKEN_PROGRAM_ID,
          new PublicKey(al.mint),
          account.pubkey,
          account1.publicKey,
          [],
          1,
        );
        tx.add(burnIx);
      }
      let closeIx = Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        account.pubkey,
        account1.publicKey,
        account1.publicKey,
        [],
      );
      tx.add(closeIx);
      let sig = await connection.sendTransaction(tx, [account1]);
      await connection.confirmTransaction(sig);
    }
    // Token.createCloseAccountInstruction(TOKEN_PROGRAM_ID, )
    // get all token accounts.
    // burn all tokens.
    // close all accounts.
  });
});
