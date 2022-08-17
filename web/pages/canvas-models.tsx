import { useEffect, useState } from "react";
import {
  PublicKey,
  ConfirmOptions,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import { MintLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  createCreateMetadataAccountV2Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Idl, Program, Wallet } from "@project-serum/anchor";
import { Button, Stack, Typography } from "@mui/material";
import {
  CanvasModelForm,
  CanvasModelFormState,
} from "../components/CanvasModelForm";
import Link from "next/link";
import styles from "../styles/Home.module.css";
import idl from "../idl.json";
import Layout from "components/layout/layout";
const CanvasModelsPage = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const programId = new PublicKey(idl.metadata.address);
  const provider = new AnchorProvider(
    connection,
    wallet as unknown as Wallet,
    { preflightCommitment: "processed" } as ConfirmOptions
  );
  const program = new Program(idl as Idl, programId, provider);
  const [canvasModels, setCanvasModels] = useState<any[]>([]);
  const [showCanvasModelForm, setShowCanvasModelForm] = useState(false);
  const [collectionNFTAddress, setCollectionNFTAddress] = useState("");

  const handleCanvasModelFormSubmit = async (data: CanvasModelFormState) => {
    console.log({ data });
    if (!wallet?.publicKey) {
      return;
    }

    setShowCanvasModelForm(false);
    setCollectionNFTAddress("");

    const newModelAddress = await createCanvasModel(
      wallet.publicKey,
      data.name,
      data.collectionNFTAddress
    );
    // use a spinner to show the user that the canvas model is being created
  };

  const getCanvasModels = async (): Promise<any[]> => {
    if (!wallet.publicKey) {
      return [];
    }

    // filter for canvas models belonging to this user.
    const canvasModels = await program.account.canvasModel.all([
      {
        memcmp: {
          offset: 8,
          bytes: wallet.publicKey!.toBase58(),
        },
      },
    ]);

    return canvasModels;
  };

  const handleCreateCollectionNFTClick = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!wallet) {
      return;
    }
    if (!wallet.signTransaction) {
      return;
    }
    if (!wallet.publicKey) {
      return;
    }

    const tx = new Transaction();
    const mintKeypair = Keypair.generate();
    const createAccountIx = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      newAccountPubkey: mintKeypair.publicKey,
      programId: TOKEN_PROGRAM_ID,
    });
    const initializeMintIx = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      0,
      wallet.publicKey,
      wallet.publicKey
    );
    const metadataAddress = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const createMetadataIx = createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataAddress[0],
        mint: mintKeypair.publicKey,
        mintAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      },
      {
        createMetadataAccountArgsV2: {
          // TODO: get this from the form.
          data: {
            name: "MY COLLECTION NFT",
            symbol: "MCN",
            uri: "",
            sellerFeeBasisPoints: 0,
            creators: [
              { address: wallet.publicKey, verified: false, share: 100 },
            ],
            collection: null,
            uses: null,
          },
          isMutable: false,
        },
      }
    );

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
  };

  const createCanvasModel = async (
    creator: PublicKey,
    canvasModelName: String,
    collectionNFTAddress: String
  ): Promise<PublicKey> => {
    const tx = new Transaction();
    const collectionMintAddress = new PublicKey(collectionNFTAddress);

    const canvasModelAddress = PublicKey.findProgramAddressSync(
      [
        Buffer.from("canvas_model"),
        creator.toBuffer(),
        Buffer.from(canvasModelName),
        collectionMintAddress.toBuffer(),
      ],
      programId
    );

    const createCanvasIx = await program.methods
      .createCanvasModel(canvasModelName, canvasModelAddress[1])
      .accounts({
        canvasModel: canvasModelAddress[0],
        creator,
        collectionMint: collectionMintAddress,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(createCanvasIx);

    const signature = await wallet.sendTransaction(tx, connection);
    console.log(signature);

    return canvasModelAddress[0];
  };

  useEffect(() => {
    // TODO: make an interface for CanvasModel.
    getCanvasModels().then((models) => setCanvasModels(models));
  }, [wallet?.publicKey]);

  return (
    <Layout>
      <Stack direction={"column"}>
        <Typography variant={"h1"}>Canvas Models</Typography>
        {canvasModels.map((model) => (
          <Stack key={model.publicKey}>
            <Link href={`/canvas-model/${model.publicKey.toBase58()}`}>
              <a>
                <Typography>
                  {model.account.name} -- {model.publicKey.toBase58()}
                </Typography>
                <Typography>Slot Count: {model.account.slotCount}</Typography>
              </a>
            </Link>
          </Stack>
        ))}
        {collectionNFTAddress && (
          <Typography>{collectionNFTAddress}</Typography>
        )}
        {!showCanvasModelForm && (
          <Button onClick={handleCreateCollectionNFTClick}>
            Create Collection NFT
          </Button>
        )}
        {!showCanvasModelForm && (
          <Button onClick={() => setShowCanvasModelForm(true)}>
            New Canvas Model
          </Button>
        )}
        {showCanvasModelForm && (
          <CanvasModelForm onSubmit={handleCanvasModelFormSubmit} />
        )}
      </Stack>
    </Layout>
  );
};
export default CanvasModelsPage;
