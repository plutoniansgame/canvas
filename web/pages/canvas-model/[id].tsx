// this will be the canvas model detail page.
// users will be able to add slots here.
import { useState, useEffect } from 'react';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Stack, Typography, Button } from "@mui/material";
import { useRouter } from "next/router";
import { AnchorProvider, Idl, Program, Wallet } from '@project-serum/anchor';
import idl from "../../idl.json";
import { PublicKey } from '@solana/web3.js';

export const CanvasModelPage = () => {
    const router = useRouter();
    const { connection } = useConnection();
    const wallet = useWallet();
    const provider = new AnchorProvider(connection, wallet as unknown as Wallet, {});
    const programId = new PublicKey(idl.metadata.address);
    const program = new Program(idl as Idl, programId, provider);
    const canvasModelAddress = new PublicKey(router.query.id as String);
    const [canvasModel, setCanvasModel] = useState<any>();

    const loadCanvasModel = async (address: PublicKey): Promise<any> => {
        const canvasModel = await program.account.canvasModel.fetch(address);
        setCanvasModel(canvasModel);
        return canvasModel;
    }

    useEffect(() => {
        loadCanvasModel(canvasModelAddress).then((m) => {
            console.log({ m });
        });
    }, []);

    const handleAddSlotClick = () => {
        console.log({ program })
    }

    if (!canvasModel) {
        return null;
    }

    return <Stack>
        <Typography variant="h1">{canvasModel.name}</Typography>
        <Typography variant="h6">{canvasModelAddress.toBase58()}</Typography>
        <Button onClick={handleAddSlotClick}>Add Slot</Button>
    </Stack>
}

export default CanvasModelPage;