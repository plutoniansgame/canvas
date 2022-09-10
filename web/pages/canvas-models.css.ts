import { css } from '@emotion/react';
import { colors } from 'styles/variables';

export const canvasModelButtonStyles = css`
  width: 184px;
  min-width: 184px;
  height: 184px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1.5px solid ${colors.redOrange};

  span {
    font-family: 'IBM Plex Mono';
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 30px;
    color: ${colors.redOrange};

    /* or 167% */
    text-align: center;
    letter-spacing: 4px;
    text-transform: uppercase;
  }
`;
