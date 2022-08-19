import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
// import Image from "next/image";
// import idl from "../idl.json";
// import {
//   ConfirmOptions,
//   Keypair,
//   PublicKey,
//   Transaction,
//   SystemProgram,
//   Connection,
//   clusterApiUrl,
// } from "@solana/web3.js";
// import { MintLayout, TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
// import { useEffect, useState } from "react";
// import { CanvasSdkClient } from "../../sdk/src/index";
// import WalletButton from "../components/WalletButton/WalletButton";
// import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// import { AnchorProvider, Idl, Program, Wallet } from "@project-serum/anchor";
// import {
//   createCreateMetadataAccountV2Instruction,
//   PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
// } from "@metaplex-foundation/mpl-token-metadata";

import Link from "next/link";
import {
  homeBaseStyles,
  headerStyles,
  mainStyles,
  menuStyles,
} from "../styles/home.css";

interface ICanvasData {
  name: string | undefined;
  slots?: [object];
}

const Home: NextPage = () => {
  return (
    <div css={homeBaseStyles}>
      <Head>
        <title>NFT Canvas</title>
        <meta
          name="description"
          content="NFT Canvas is an open-source protocol for the Solana Blockchain."
        />
      </Head>

      <header css={headerStyles}>
        <h1 className={styles.title}>Canvas</h1>
      </header>
      <main css={mainStyles}>
        <section className="col-one">
          <ul css={menuStyles}>
            <li>
              <Link href="/canvas-models">
                <a>Create & Update Canvas</a>
              </Link>
            </li>
            <li>
              Canvas is an open-source protocol for the Solana Blockchain.
            </li>
          </ul>
        </section>
        <section className="col-two">
          <h2>Composable NFT&apos;s for everyone</h2>
          <p>
            Composable NFT’s for everyone.Composable NFT’s for
            everyone.Composable NFT’s for everyone.Composable NFT’s for
            everyone.Composable NFT’s for everyone.Composable NFT’s for
            everyone.Composable NFT’s for everyone.Composable NFT’s for
            everyone.
          </p>
        </section>
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
