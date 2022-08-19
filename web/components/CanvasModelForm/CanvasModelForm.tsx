import { Button } from "@mui/material";
import { useState } from "react";
import Input from "components/Input/Input";
import { InputStyles } from "./CanvasModelForm.css";

interface CanvasModelFormProps {
  onSubmit: (data: CanvasModelFormState) => Promise<void>;
}

export interface CanvasModelFormState {
  name: String;
  collectionNFTAddress: String;
}

export const CanvasModelForm: React.FC<CanvasModelFormProps> = ({
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [collectionNFTAddress, setCollectionNFTAddress] = useState("");

  const handleChange = (e: any, setter: any) => {
    setter(e.target.value);
  };

  const handleSubmitClick = () => {
    onSubmit({
      name,
      collectionNFTAddress,
    } as CanvasModelFormState);
    setName("");
    setCollectionNFTAddress("");
  };

  return (
    <form>
      <label>
        <Input
          type="text"
          placeholder="Canvas model name"
          onChange={(e) => handleChange(e, setName)}
          value={name}
          css={InputStyles}
        />
        <Input
          type="text"
          placeholder="Collection NFT address"
          onChange={(e) => handleChange(e, setCollectionNFTAddress)}
          value={collectionNFTAddress}
          css={InputStyles}
        />
        <Button onClick={handleSubmitClick}>Ok</Button>
      </label>
    </form>
  );
};

export default CanvasModelForm;
