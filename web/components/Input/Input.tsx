import { InputStyles, InputContainerStyles } from "./Input.css";

import React from "react";

const Input = (inputProps: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <div css={InputContainerStyles}>
      <input css={InputStyles} {...inputProps} />
    </div>
  );
};

export default Input;
