import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import idl from "../idl.json";
import { ConfirmOptions, Keypair, PublicKey, Transaction, SystemProgram, Connection, clusterApiUrl } from "@solana/web3.js";
import { MintLayout, TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { useEffect, useState } from "react";
import { CanvasSdkClient } from "../../sdk/src/index";
import WalletButton from "../components/WalletButton/WalletButton";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Idl, Program, Wallet } from '@project-serum/anchor';
import { createCreateMetadataAccountV2Instruction, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import axios from "axios";

interface ICanvasData {
  name: string | undefined;
  slots?: [object];
}

const Home: NextPage = () => {
  const wallet = useWallet();
  // const { connection } = useConnection();

  const connection = new Connection(clusterApiUrl("devnet"));
  const programId = new PublicKey(idl.metadata.address);
  const provider = new AnchorProvider(
    connection, wallet as unknown as Wallet, { preflightCommitment: "processed" } as ConfirmOptions,
  );
  const program = new Program(idl as Idl, programId, provider);

  const [canvasModelName, setCanvasModelName] = useState("");
  const [collectionNFTAddress, setCollectionNFTAddress] = useState("");
  const [canvasIds, setCanvasIds] = useState<String[]>([]);

  useEffect(() => {
    const getCanvasIds = async (): Promise<String[]> => {
      const ids = connection.getProgramAccounts(programId, {
        filters: [{
          memcmp: {
            offset: 8,
            bytes: wallet.publicKey!.toBase58()
          }
        }]
      })
      // const ids = await program.account.canvas.fetch   

      return [""]
    };
    getCanvasIds().then(ids => setCanvasIds(ids));
  });

  const createCanvas = async (e: any) => {
    if (!wallet) {
      return false;
    }
    const response = await axios({
      method: "post",
      url: "/api/canvas",
      data: {
        canvasModelName,
      },
    });
  };

  const handleCreateCollectionNFTClick = async (e: any) => {

    e.preventDefault();
    e.stopPropagation();
    if (!wallet) { return; }
    if (!wallet.signTransaction) { return; }
    if (!wallet.publicKey) { return };

    const tx = new Transaction();
    const mintKeypair = Keypair.generate();
    const createAccountIx = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(MintLayout.span),
      space: MintLayout.span,
      newAccountPubkey: mintKeypair.publicKey,
      programId: TOKEN_PROGRAM_ID
    });
    const initializeMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      0,
      wallet.publicKey,
      wallet.publicKey
    );
    const metadataAddress = PublicKey.findProgramAddressSync([
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintKeypair.publicKey.toBuffer()
    ],
      TOKEN_METADATA_PROGRAM_ID);

    const createMetadataIx = createCreateMetadataAccountV2Instruction({
      metadata: metadataAddress[0],
      mint: mintKeypair.publicKey,
      mintAuthority: wallet.publicKey,
      payer: wallet.publicKey,
      updateAuthority: wallet.publicKey
    }, {
      createMetadataAccountArgsV2: {
        data: {
          name: "MY COLLECTION NFT",
          symbol: "MCN",
          uri: "",
          sellerFeeBasisPoints: 0,
          creators: [{ address: wallet.publicKey, verified: false, share: 100 }],
          collection: null,
          uses: null
        },
        isMutable: false
      }
    });

    tx.add(createAccountIx).add(initializeMintIx).add(createMetadataIx);

    try {
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;
      tx.sign(mintKeypair);
      await wallet.sendTransaction(tx, connection);
      // pop success toast
      setCollectionNFTAddress(mintKeypair.publicKey.toBase58());
    } catch (e) {
      console.log(e);
      // pop failure toast
    }

  }

  const handleCreateCanvasModelClick = async () => {
    if (!wallet || !wallet.publicKey) { return; }
    if (canvasModelName.length < 1) { return; }


    const tx = new Transaction();
    const collectionMintAddress = new PublicKey(collectionNFTAddress);

    const canvasModelAddress = PublicKey.findProgramAddressSync([
      Buffer.from("canvas_model"),
      wallet.publicKey.toBuffer(),
      Buffer.from(canvasModelName),
      collectionMintAddress.toBuffer()
    ], programId);

    const createCanvasIx = await program.methods.createCanvasModel(canvasModelName, canvasModelAddress[1]).accounts({
      canvasModel: canvasModelAddress[0],
      creator: wallet.publicKey,
      collectionMint: collectionMintAddress,
      systemProgram: SystemProgram.programId
    }).instruction();

    tx.add(createCanvasIx);

    const signature = await wallet.sendTransaction(tx, connection);
    console.log(signature);

  }

  return (
    <div className={styles.container}>
      <Head>
        <title>NFTCanvas</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <WalletButton />
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to NFT Canvas UI</h1>

        <p className={styles.description}>
          <code className={styles.code}>Composable NFT&apos;s</code> for
          everyone 🤝
        </p>

        {collectionNFTAddress ? <h2>Collection NFT Mint: <span >{collectionNFTAddress}</span></h2> : null}
        <div className={styles.grid}>
          <a href="https://nextjs.org/docs" className={styles.card}>
            <h2>Create Collection NFT</h2>
            <p>Generate a new canvas model & slots</p>
            <button onClick={handleCreateCollectionNFTClick}>Create Collection NFT</button>
          </a>
          <input
            value={canvasModelName}
            onChange={(e) => setCanvasModelName(e.target.value)}
          />
          <button onClick={handleCreateCanvasModelClick} type="button">
            Create Canvas
          </button>
        </div>

        <div className={styles.grid}>
          <a href="https://nextjs.org/docs" className={styles.card}>
            <h2>Create Canvas &rarr;</h2>
            <p>Generate a new canvas model & slots</p>
          </a>

          <a href="https://nextjs.org/docs" className={styles.card}>
            <h2>Placeholder &rarr;</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod.
            </p>
          </a>

          <a href="https://nextjs.org/docs" className={styles.card}>
            <h2>Placeholder &rarr;</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod.
            </p>
          </a>

          <a href="https://nextjs.org/docs" className={styles.card}>
            <h2>Placeholder &rarr;</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod.
            </p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="http://www.nftcanvas.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by <span className={styles.logo}>NFTCanvas</span>
        </a>
      </footer>
    </div>
  );
};

export default Home;
