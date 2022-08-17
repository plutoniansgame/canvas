import Head from "next/head";
import Image from "next/image";
import WalletButton from "components/WalletButton/WalletButton";
import {
  headerStyles,
  columnOneHeaderStyles,
  columnTwoHeaderStyles,
  columnOneMainStyles,
  columnTwoMainStyles,
  mainStyles,
} from "./layout.css";
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
        <div css={columnOneHeaderStyles}>
          <Image src={Logo} alt="logo" />
        </div>
        <div css={columnTwoHeaderStyles}>
          <h1>Dashboard</h1>
          <WalletButton />
        </div>
      </header>
      <main css={mainStyles}>
        <section css={columnOneMainStyles}></section>
        <section css={columnTwoMainStyles}>{children}</section>
      </main>
    </>
  );
}
