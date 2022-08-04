import { Button } from "@mui/material"
import { useState } from "react";

interface CanvasModelFormProps {
    onSubmit: (data: CanvasModelFormState) => Promise<void>
};

export interface CanvasModelFormState {
    name: String,
    collectionNFTAddress: String,
}

export const CanvasModelForm: React.FC<CanvasModelFormProps> = ({
    onSubmit
}) => {
    const [name, setName] = useState("");
    const [collectionNFTAddress, setCollectionNFTAddress] = useState("");

    const handleChange = (e: any, setter: any) => {
        setter(e.target.value);
    }

    const handleSubmitClick = () => {
        onSubmit({
            name,
            collectionNFTAddress
        } as CanvasModelFormState);
        setName("");
        setCollectionNFTAddress("");
    }

    return (<form>
        <label>
            <input type="text" placeholder="name" onChange={(e) => handleChange(e, setName)} value={name} />
            <input type="text" placeholder="collection NFT Address" onChange={(e) => handleChange(e, setCollectionNFTAddress)} value={collectionNFTAddress} />
            <Button onClick={handleSubmitClick}>Ok</Button>
        </label>
    </form>);
};

export default CanvasModelForm