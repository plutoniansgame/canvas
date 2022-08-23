// this will be the canvas model detail page.
// users will be able to add slots here.
import { useState, useEffect } from 'react';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Stack, Typography, Button } from "@mui/material";
import { useRouter } from "next/router";
import { AnchorProvider, Idl, Program, Wallet } from '@project-serum/anchor';
import { SlotForm, SlotFormState } from "../../components/SlotForm";
import idl from "../../idl.json";
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { BN } from "bn.js";
import { isNFT } from "../../isNFT";
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { MintLayout } from '@solana/spl-token';

export const CanvasModelPage = () => {
    const router = useRouter();
    const { connection } = useConnection();
    const wallet = useWallet();
    const provider = new AnchorProvider(connection, wallet as unknown as Wallet, {});
    const programId = new PublicKey(idl.metadata.address);
    const program = new Program(idl as Idl, programId, provider);
    const canvasModelAddress = new PublicKey(router.query.id as String);
    const [canvasModel, setCanvasModel] = useState<any>();
    const [slots, setSlots] = useState<any[]>([]);
    const [incrementor, setIncrementor] = useState<any>();
    const [showSlotForm, setShowSlotForm] = useState(false);

    const loadCanvasModel = async (address: PublicKey): Promise<void> => {
        const canvasModel = await program.account.canvasModel.fetch(address);
        setCanvasModel(canvasModel);
    }

    const getIncrementorAddress = (wallet: any): [PublicKey, number] => {
        return PublicKey.findProgramAddressSync(
            [
                Buffer.from("incrementor"),
                wallet.publicKey?.toBuffer(),
                canvasModelAddress.toBuffer(),
                Buffer.from("canvas_model_slot")
            ],
            programId
        );
    }

    const loadIncrementor = async (): Promise<void> => {
        if (!wallet.publicKey) { return }

        const incrementorAddress = getIncrementorAddress(wallet);
        const incrementor = await program.account.incrementor.fetchNullable(incrementorAddress[0]);
        setIncrementor(incrementor);
    }

    const loadSlots = async (): Promise<void> => {
        if (!wallet.publicKey) { return }

        const slots = await program.account.canvasModelSlot.all([{
            memcmp: {
                offset: 8,
                bytes: canvasModelAddress.toBase58()
            }
        }]);

        setSlots(slots);
    }

    useEffect(() => {
        loadCanvasModel(canvasModelAddress);
        loadIncrementor();
        loadSlots();
        findNFTs();

    }, [wallet.publicKey]);

    const handleAddSlotClick = () => {
        setShowSlotForm(true);
    }

    const findNFTs = async () => {
        const nfts = [];

        if (!wallet.publicKey) {
            return;
        }
        const tokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_PROGRAM_ID });
        const tokenMints = [];
        for (const tokenAccountData of tokenAccounts.value) {
            const tokenAccount = AccountLayout.decode(tokenAccountData.account.data);
            tokenMints.push(new PublicKey(tokenAccount.mint));
        }

        for (const mintAddress of tokenMints) {
            const result = await isNFT(mintAddress, true, connection);
            console.log({ result })
        }



    }

    const createSlot = async (name: String) => {
        if (!wallet.publicKey) {
            return;
        }
        const tx = new Transaction();
        // find out if there is a slot incrementor
        // if there is, query it for the next slot id
        // if there is not, create one
        const [slotIncrementorAddress, slotIncrementorBump] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("incrementor"),
                wallet.publicKey?.toBuffer(),
                canvasModelAddress.toBuffer(),
                Buffer.from("canvas_model_slot")
            ],
            programId
        );

        const slotIncrementor = await program.account.incrementor.fetchNullable(slotIncrementorAddress);
        let head: number = slotIncrementor?.head as number || 0;

        if (!slotIncrementor) {
            const createSlotIncrementorIx = await program.methods.createCanvasModelSlotIncrementor(slotIncrementorBump).accounts({
                canvasModel: canvasModelAddress,
                incrementor: slotIncrementorAddress,
                systemProgram: SystemProgram.programId,
                creator: wallet.publicKey
            }).instruction();

            tx.add(createSlotIncrementorIx);
        }

        const [canvasModelSlotAddress] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("canvas_model_slot"),
                wallet.publicKey.toBuffer(),
                canvasModelAddress.toBuffer(),
                Buffer.from(name),
                // usually BN has a toBuffer method, but it's not exported
                // so we are using toArrayLike to convert to a buffer instead.
                new BN(head + 1).toArrayLike(Buffer)
            ],
            programId
        );

        const createCanvasModelSlotIx = await program.methods
            .createCanvasModelSlot(
                name,
                head + 1,
                canvasModelSlotAddress
            ).accounts({
                canvasModel: canvasModelAddress,
                canvasModelSlot: canvasModelSlotAddress,
                incrementor: slotIncrementorAddress,
                collectionMint: canvasModel.collectionMint,
                systemProgram: SystemProgram.programId,
            }).instruction();

        tx.add(createCanvasModelSlotIx);

        const sig = await wallet.sendTransaction(tx, connection);
        console.log("sig", sig)
    }

    const handleSlotSubmit = async (data: SlotFormState) => {
        setShowSlotForm(false);
        await createSlot(data.name);
    }

    if (!canvasModel) {
        return null;
    }

    return <Stack>
        <Typography variant="h1">{canvasModel.name}</Typography>
        <Typography variant="h6">{canvasModelAddress.toBase58()}</Typography>
        {slots.map((slot: any) => {
            return <Typography variant="h6">Slot {slot.account.index}: {slot.account.name}</Typography>
        })}
        {!showSlotForm && <Button onClick={handleAddSlotClick}>Add Slot</Button>}
        {showSlotForm && <SlotForm onSubmit={handleSlotSubmit} />}
    </Stack>
}

export default CanvasModelPage;