import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import React from "react";

import { ButtonContainer } from "./WalletButton.style";

import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

const WalletButton = (): JSX.Element => {
  // Get connected wallet
  const { publicKey } = useWallet();

  // Shorten address

  return (
    <WalletModalProvider>
      <ButtonContainer className={`${publicKey ? "connected" : ""}`}>
        {/* <button className={`${publicKey ? "connected" : ""}`} disabled></button> */}

        {publicKey ? (
          <>
            <WalletDisconnectButton>
              <span>{shortenAddress(publicKey.toBase58() || "")}</span>
            </WalletDisconnectButton>
          </>
        ) : (
          <WalletMultiButton>Connect</WalletMultiButton>
        )}
      </ButtonContainer>
    </WalletModalProvider>
  );
};

export default WalletButton;
