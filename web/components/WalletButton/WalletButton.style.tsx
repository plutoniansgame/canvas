import styled from "styled-components";
import { createGlobalStyle } from "styled-components";

import { breakpoints, colors, spacing } from "../../styles/variables";

// /* Wallet Modal styles */
// export const GlobalWalletModalStyle = createGlobalStyle`
//   .wallet-adapter-modal-wrapper {
//     background-color: ${colors.cream} ;
//     border-radius: 4rem;
//     padding: ${spacing.huge};

//     h1 {
//       font-size: 20px;
//       color: ${colors.darkBrown};
//       padding: ${spacing.huge} 0;
//     }

//     .wallet-adapter-modal-list {
//       margin: 0;

//       li {
//         margin-bottom: ${spacing.small};
//       }
//     }

//     .wallet-adapter-button,
//     .wallet-adapter-modal-button-close {

//       background: ${colors.gold};

//       &:not([disabled]):hover {
//         background: ${colors.gold};
//       }
//     }

//     .wallet-adapter-modal-button-close {
//       border-radius: 50%;
//       padding: 0;
//       width: 4.6rem;
//       height: 4.6rem;
//     }

//     .wallet-adapter-modal-button-close,
//     .wallet-adapter-modal-list-more {
//       color: ${colors.darkBrown};

//       svg {
//         transition: none;
//         fill: ${colors.darkBrown};

//         &:hover {
//           fill: ${colors.darkBrown};
//         }
//       }
//     }
//   }
// `;

export const ButtonContainer = styled.div`
  display: flex;
  align-items: center;

  &:hover > button {
    box-shadow: -0.2rem 0.1rem 0 ${colors.darkestGray};

    &:disabled {
      cursor: not-allowed;
    }
  }

  button {
    color: #000;
    border: 3px solid #000;
    background-color: white;
    height: 3.2rem;
    border-radius: 0;

    &.wallet-adapter-button[disabled],
    &:not([disabled]):hover {
      background-color: white;
      color: ${colors.darkestGray};
    }

    @media screen and (${breakpoints.desktop}) {
      height: 6.4rem;
      padding: 0 ${spacing.large};
    }
  }
  &.connected button {
    background-color: ${colors.lime};
  }

  // Hide the default connect wallet icon
  .wallet-adapter-button-start-icon {
    display: none;
  }
`;
