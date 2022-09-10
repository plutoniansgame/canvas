import { css } from '@emotion/react'
import { colors } from './variables'

export const homeBaseStyles = css`
  background-color: #1e1e1e;
  color: #fff;
`

export const headerStyles = css`
  background-color: ${colors.lime};
  h1 {
    font-size: 200px;
    color: #000;
  }
`

export const mainStyles = css`
  display: flex;

  .col-one {
    width: 20%;
    border-right: 1px solid #fff;
  }

  .col-two {
    width: 80%;
    padding: 20px;
    h2 {
      font-size: 40px;
      font-weight: 400;
      color: ${colors.lime};
    }
  }
`

export const menuStyles = css`
  display: flex;
  flex-direction: column;
  list-style-type: none;
  padding: 0;
  li {
    padding: 20px;
    border-bottom: 1px solid #fff;
    a:hover {
      background-color: ${colors.lime};
      color: #000;
    }
  }
`
