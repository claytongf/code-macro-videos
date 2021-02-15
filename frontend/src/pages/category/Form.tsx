import { Box, Button, ButtonProps, Checkbox, FormControlLabel, makeStyles, TextField, Theme } from '@material-ui/core';
import * as React from 'react';
import categoryHttp from '../../util/http/category-http';
import * as yup from '../../util/vendor/yup'
import { useForm } from "react-hook-form"
import { useHistory, useParams } from 'react-router';

const useStyles = makeStyles((theme: Theme) => {
    return {
        submit: {
            margin: theme.spacing(1)
        }
    }
})

const useYupValidationResolver = validationSchema =>
  React.useCallback(
    async data => {
      try {
        const values = await validationSchema.validate(data, {
          abortEarly: false
        });

        return {
          values,
          errors: {}
        };
      } catch (errors) {
        return {
          values: {},
          errors: errors.inner.reduce(
            (allErrors, currentError) => ({
              ...allErrors,
              [currentError.path]: {
                type: currentError.type ?? "validation",
                message: currentError.message
              }
            }),
            {}
          )
        };
      }
    },
    [validationSchema]
  );

export const Form = () => {
    const classes = useStyles()

    const validationSchema = React.useMemo(
        () =>
          yup.object({
            name: yup.string().label('Nome').required().max(255),
          }),
        []
    );
    const resolver = useYupValidationResolver(validationSchema);

    const {register, handleSubmit, getValues, setValue, errors, reset, watch} = useForm<{name: string, is_active: boolean}>({resolver})

    const history = useHistory()

    const {id} = useParams<{id:string}>()
    const [category, setCategory] = React.useState<{id: string} | null>(null)
    const [loading, setLoading] = React.useState<boolean>(false)

    const buttonProps: ButtonProps = {
        className: classes.submit,
        color: 'secondary',
        variant: "contained",
        disabled: loading
    }

    React.useEffect(() => {
        register({name: "is_active"})
    }, [register])

    React.useEffect(() => {
        if(!id){
            return
        }
        setLoading(true)
        categoryHttp
            .get(id)
            .then(({data}) => {
                setCategory(data.data)
                reset(data.data)
            })
            .finally(() => setLoading(false))
    }, [])

    function onSubmit(formData, event){
        setLoading(true)
        const http = !category
            ? categoryHttp.create(formData)
            : categoryHttp.update(category.id, formData)
        http
            .then(({data}) => {
                setTimeout(() => {
                    event ? (
                        id
                            ? history.replace(`/categories/${data.data.id}/edit`)
                            : history.push(`/categories/${data.data.id}/edit`)
                    ) : history.push('/categories')
                })
            })
            .finally(() => setLoading(false))
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
                name="name"
                label="Nome"
                fullWidth
                variant={'outlined'}
                inputRef={register}
                disabled={loading}
                error={errors.name !== undefined}
                helperText={errors.name && errors.name.message}
                InputLabelProps={{ shrink:true }}
            />

            <TextField
                name="description"
                label="Descrição"
                multiline
                rows="4"
                fullWidth
                variant={'outlined'}
                margin={'normal'}
                inputRef={register}
                disabled={loading}
                InputLabelProps={{ shrink:true }}
            />
            <FormControlLabel
              disabled={loading}
              control={
                  <Checkbox
                      name="is_active"
                      color={"primary"}
                      onChange={
                          () => setValue('is_active', !getValues()['is_active'])
                      }
                      checked={watch('is_active')}
                      disabled={loading}
                  />
              }
              label={'Ativo?'}
              labelPlacement={'end'}
            />
            <Box dir={"rtl"}>
                <Button
                    color={"primary"}
                    {...buttonProps}
                    onClick={() => onSubmit(getValues(), null)}
                >
                    Salvar
                </Button>
                <Button {...buttonProps} type="submit">Salvar e continuar editando</Button>
            </Box>
        </form>
    );
};
