// @flow
import { Box, Button, ButtonProps, Checkbox, makeStyles, MenuItem, TextField, Theme } from '@material-ui/core';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import categoryHttp from '../../util/http/category-http';
import * as yup from '../../util/vendor/yup'
import genreHttp from '../../util/http/genre-http';
import { useHistory, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

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
    const validationSchema = React.useMemo(
        () =>
          yup.object({
            name: yup.string().label('Nome').required().max(255),
            category_id: yup.array().label('Categorias').required()
          }),
        []
    );
    const resolver = useYupValidationResolver(validationSchema);
    const {register, handleSubmit, getValues, setValue, errors, reset, watch} = useForm<{name: string, categories_id: string[]}>({resolver,
        defaultValues: {
            categories_id: []
        }
    })

    const classes = useStyles()
    const snackbar = useSnackbar();
    const history = useHistory()
    const {id} = useParams<{id:string}>()
    const [genre, setGenre] = React.useState<{id: string} | null>(null)
    const [categories, setCategories] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState<boolean>(false)

    const buttonProps: ButtonProps = {
        className: classes.submit,
        color: 'secondary',
        variant: "contained",
        disabled: loading
    }



    React.useEffect(() => {
        register({name: "categories_id"})
    }, [register])

    React.useEffect(() => {

        async function loadData(){
            setLoading(true)
            const promises = [categoryHttp.list()]
            if(id){
                promises.push(genreHttp.get(id))
            }
            try{
                const [categoriesResponse, genreResponse] = await Promise.all(promises)
                setCategories(categoriesResponse.data.data)
                if(id){
                    setGenre(genreResponse.data.data)
                    reset({
                        ...genreResponse.data.data,
                        categories_id: genreResponse.data.data.categories.map(category => category.id)
                    })
                }

            } catch (error) {
                console.log(error);
                snackbar.enqueueSnackbar(
                    'Não foi possível carregar as informações',
                    {variant: 'error'}
                )
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    async function onSubmit(formData, event){
        setLoading(true)
        try {
            const http = !genre
                ? genreHttp.create(formData)
                : genreHttp.update(genre.id, formData)
                const {data} = await http
                snackbar.enqueueSnackbar(
                    'Gênero salvo com sucesso',
                    {variant: 'success'}
                )
                setTimeout(() => {
                    event ? (
                        id
                            ? history.replace(`/genres/${data.data.id}/edit`)
                            : history.push(`/genres/${data.data.id}/edit`)
                    ) : history.push('/genres')
                })
        } catch(error) {
            console.log(error)
            snackbar.enqueueSnackbar(
                'Erro ao salvar Gênero',
                {variant: 'error'}
            )
        } finally {
            setLoading(false)
        }
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
            <TextField
                select
                name="categories_id"
                value={watch('categories_id')}
                label="Categories"
                margin={'normal'}
                variant={'outlined'}
                fullWidth
                onChange={(e) => {
                    setValue('categories_id', e.target.value)
                }}
                SelectProps={{
                    multiple: true
                }}
                disabled={loading}
                error={errors.categories_id !== undefined}
                helperText={errors.categories_id && errors.categories_id[0]!.message}
                InputLabelProps={{ shrink: true }}
            >
                <MenuItem value="" disabled>
                    <em>Selecione categorias</em>
                </MenuItem>
                {
                    categories.map(
                        (category, key) => (
                            <MenuItem key={key} value={category.id}>{category.name}</MenuItem>
                        )
                    )
                }
            </TextField>
            <Checkbox
                name="is_active"
                inputRef={register}
                defaultChecked
            />
            Ativo?
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
