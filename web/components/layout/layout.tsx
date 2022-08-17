import Head from "next/head";
import Image from "next/image";
import WalletButton from "components/WalletButton/WalletButton";
import { headerStyles, columnOneStyles, columnTwoStyles } from "./layout.css";
import Logo from "assets/logo.png";

interface baseComponentControllerProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: baseComponentControllerProps) {
  return (
    <>
      <Head>
        <title>NFT Canvas creator</title>
        <meta name="description" content="Creating nft canvas" />
      </Head>
      <header css={headerStyles}>
        <div css={columnOneStyles}>
          <Image src={Logo} alt="logo" />
        </div>
        <div css={columnTwoStyles}>
          <h1>Dashboard</h1>
          <WalletButton />
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
