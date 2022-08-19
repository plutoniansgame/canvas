import { css } from "@emotion/react";
import { colors } from "styles/variables";

export const headerStyles = css`
  background: ${colors.redOrange};
  height: 116px;
  width: 100%;
  display: flex;
`;

export const columnOneHeaderStyles = css`
  width: 116px;
  min-width: 116px;
  display: flex;
  justify-content: center;
  border-right: 2px solid ${colors.almostBlack};
  span,
  image {
    align-self: center;
    flex-shrink: 0;
  }
`;

export const columnTwoHeaderStyles = css`
  display: flex;
  width: 100%;
  padding-left: 80px;
  .wallet-button {
    margin-left: auto;
  }
  h1 {
    font-weight: 400;
    font-size: 40px;
  }
`;

export const mainStyles = css`
  display: flex;
  height: 100%;
`;

export const columnOneMainStyles = css`
  width: 116px;
  display: flex;
  justify-content: center;
  border-right: 2px solid ${colors.redOrange};
  height: 100%;
  span,
  image {
    align-self: center;
    flex-shrink: 0;
  }
`;

export const columnTwoMainStyles = css`
  display: flex;
  padding: 80px 0 0 80px;
  justify-content: center;
  border-right: 2px solid ${colors.almostBlack};
  span,
  image {
    align-self: center;
    flex-shrink: 0;
  }
`;
