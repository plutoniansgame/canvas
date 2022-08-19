import { css } from "@emotion/react";
import { colors } from "styles/variables";

// export const InputContainerStyles = () => {
//   return css`
//     position: relative;
//     display: flex;
//     flex-direction: row;
//     background-color: ${colors.almostBlack};
//     transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
//     border-bottom: 1px solid ${colors.redOrange};

//     height: 45px;
//     box-sizing: border-box;
//   `;
// };

export const InputStyles = ({
  hasError,
  isDisabled,
}: {
  hasError?: boolean;
  isDisabled?: boolean;
}) => css`
  display: block;
  color: ${colors.redOrange};
  background-color: ${colors.almostBlack};
  height: 100%;
  font-size: 16px;
  font-weight: 400;
  box-sizing: border-box;
  border: none;
  border-bottom: 2px solid ${colors.redOrange};
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  padding: 12px 16px 12px 16px;
  width: 100%;

  ${hasError &&
  css`
    background-color: transparent;
    color: #000000;
  `}

  &:focus,
    &:active {
    outline: 0;
  }
  &::placeholder {
    color: #000;
    opacity: 0;
  }
  &:disabled {
    background-color: ${colors.almostBlack};
    color: ${colors.lightText};
  }

  &:focus::placeholder {
  }
`;
