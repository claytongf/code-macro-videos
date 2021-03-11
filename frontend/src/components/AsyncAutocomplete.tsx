import { CircularProgress, TextField, TextFieldProps } from '@material-ui/core';
import { Autocomplete, AutocompleteProps } from '@material-ui/lab';
import * as React from 'react';
import { useDebounce } from 'use-debounce/lib';

interface AsyncAutocompleteProps {
    fetchOptions: (searchText) => Promise<any>
    debounceTime?: number;
    TextFieldProps?: TextFieldProps
    AutocompleteProps?: Omit<AutocompleteProps<any, any, any, any>, 'renderInput' | 'options'>
}

export interface AsyncAutocompleteComponent {
    clear: () => void
}

const AsyncAutocomplete = React.forwardRef<AsyncAutocompleteComponent, AsyncAutocompleteProps>((props, ref) => {
    const {AutocompleteProps, debounceTime = 300} = props;
    const {freeSolo = false, onOpen, onClose, onInputChange} = AutocompleteProps as any;
    const [open, setOpen] = React.useState(false)
    const [searchText, setSearchText] = React.useState("")
    const [debouncedSearchText] = useDebounce(searchText, debounceTime)
    const [loading, setLoading] = React.useState(false)
    const [options, setOptions] = React.useState([])

    const textFieldProps: TextFieldProps = {
        margin: 'normal',
        variant: 'outlined',
        fullWidth: true,
        InputLabelProps: {shrink: true},
        ...(props.TextFieldProps && {...props.TextFieldProps})
    }

    const autocompleteProps: AutocompleteProps<any, any, any, any> = {
        loadingText: 'Carregando...',
        noOptionsText: 'Nenhum item encontrado',
        ...(AutocompleteProps && {...AutocompleteProps}),
        open,
        options,
        loading: loading,
        inputValue: searchText,
        onOpen(){
            setOpen(true)
            onOpen && onOpen()
        },
        onClose(){
            setOpen(false)
            onClose && onClose()
        },
        onInputChange(event, value){
            setSearchText(value)
            onInputChange && onInputChange();
        },
        renderInput:params => {
            return <TextField
                {...params}
                {...textFieldProps}
                InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                        <>
                            {loading && <CircularProgress color={"inherit"} size={20}/>}
                            {params.InputProps.endAdornment}
                        </>
                    )
                 }}

            />
        }
    }

    React.useEffect(() => {
        if(!open && !freeSolo){
            setOptions([])
        }
    }, [open])

    const useEffectCondition = freeSolo ? debouncedSearchText : open;

    React.useEffect(() => {
        if(!open || (debouncedSearchText === "" && freeSolo)){
            return;
        }

        let isSubscribed = true;
        (async() => {
          setLoading(true);
          try {
            const data = await props.fetchOptions(debouncedSearchText);
            if (isSubscribed) {
              setOptions(data);
            }
        } finally {
            setLoading(false);
        }
        })();
        return () => {
          isSubscribed = false;
        };
    }, [useEffectCondition]);

    React.useImperativeHandle(ref, () => ({
        clear: () => {
            setSearchText("")
            setOptions([])
        }
    }))

    return (
        <Autocomplete {...autocompleteProps}/>
    );
});

export default AsyncAutocomplete;
