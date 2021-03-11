// @flow
import { Button, FormControl, FormControlProps, FormHelperText } from '@material-ui/core';
import * as React from 'react';
import InputFile, { InputFileComponent } from '../../../components/InputFile';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';

interface UploadFieldProps {
    accept: string;
    label: string;
    setValue: (value) => void;
    error?: any;
    disabled?: boolean;
    FormControlProps?: FormControlProps
}

export interface UploadFieldComponent {
    clear: () => void
}

export const UploadField = React.forwardRef<UploadFieldComponent, UploadFieldProps>((props, ref) => {
    const fileRef = React.useRef() as React.MutableRefObject<InputFileComponent>;

    const { accept, label, setValue, error, disabled} = props;

    React.useImperativeHandle(ref, () => ({
        clear: () => fileRef.current.clear()
    }))

    return (
        <FormControl
                error={error !== undefined}
                disabled={disabled === true}
                fullWidth
                margin={"normal"}
                {...props.FormControlProps}
            >
                <InputFile
                    ref={fileRef}
                    TextFieldProps={{
                        label: label,
                        InputLabelProps: {shrink: true},
                        style:{backgroundColor: "#FFFFFF"}
                    }}
                    InputFileProps={{
                        accept,
                        onChange(event){
                            const files = (event.target.files as any);
                            files.length && setValue(files[0])
                        }
                        }}
                    ButtonFile={
                        <Button
                            endIcon={<CloudUploadIcon/>}
                            variant={"contained"}
                            color={"primary"}
                            onClick={() => fileRef.current.openWindow()}
                        >
                            Adicionar
                        </Button>
                    }
                />
                {error && <FormHelperText>{error.message}</FormHelperText>}
            </FormControl>
    );
});
