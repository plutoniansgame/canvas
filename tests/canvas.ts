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
import { MintLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { find } from "rxjs";
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

  it("assign nft to canvas instance slot", async () => {});
  it("commit canvas and mint", async () => {});
  it("consume nft and transfer backing nfts", async () => {});
});
