import { useState } from 'react';
import { Stack, Button } from "@mui/material";

export interface SlotFormProps {
    onSubmit: (data: SlotFormState) => void;
}

export interface SlotFormState {
    name: string;
}

export const SlotForm: React.FC<SlotFormProps> = ({ onSubmit }) => {
    const [name, setName] = useState("");
    const handleChange = (e: any) => {
        setName(e.target.value);
    }

    const handleSubmitClick = (e: any) => {
        e.preventDefault();
        onSubmit({ name } as SlotFormState);
    }

    return <Stack>
        <form>
            <label>
                <input type="text" name="name" placeholder="Name" onChange={handleChange} value={name} />
            </label>
        </form>
        <Button onClick={handleSubmitClick}>Ok</Button>
    </Stack>
};

export default SlotForm;