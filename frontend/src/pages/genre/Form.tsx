// @flow
import { Checkbox, MenuItem, TextField } from '@material-ui/core';
import * as React from 'react';
import { NestedValue, useForm } from 'react-hook-form';
import categoryHttp from '../../util/http/category-http';
import * as yup from '../../util/vendor/yup'
import genreHttp from '../../util/http/genre-http';
import { useHistory, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Category, Genre } from '../../util/models';
import SubmitActions from '../../components/SubmitActions';

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
            categories_id: yup.array().label('Categorias').required().min(1)
          }),
        []
    );
    const resolver = useYupValidationResolver(validationSchema);
    const {register, handleSubmit, getValues, setValue, errors, reset, watch} = useForm<{name: string, categories_id: NestedValue<string[]>}>({resolver,
        defaultValues: {
            categories_id: []
        }
    })

    const snackbar = useSnackbar();
    const history = useHistory()
    const {id} = useParams<{id:string}>()
    const [genre, setGenre] = React.useState<Genre | null>(null)
    const [categories, setCategories] = React.useState<Category[]>([])
    const [loading, setLoading] = React.useState<boolean>(false)

    React.useEffect(() => {
        register({name: "categories_id"})
    }, [register])

    React.useEffect(() => {
        let isSubscribed = true;
        (async function loadData(){
            setLoading(true)
            const promises = [categoryHttp.list()]
            if(id){
                promises.push(genreHttp.get(id))
            }
            try{
                const [categoriesResponse, genreResponse] = await Promise.all(promises)
                if(isSubscribed){
                    setCategories(categoriesResponse.data.data)
                    if(id){
                        setGenre(genreResponse.data.data)
                        const categories_id = genreResponse.data.data.categories.map(category => category.id)
                        reset({
                            ...genreResponse.data.data,
                            categories_id
                        })
                    }
                }

            } catch (error) {
                console.error(error);
                snackbar.enqueueSnackbar(
                    'Não foi possível carregar as informações',
                    {variant: 'error'}
                )
            } finally {
                setLoading(false)
            }
        })()

        return () => {
            isSubscribed = false
        }
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
                helperText={errors.categories_id && errors.categories_id.message}
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
            <SubmitActions disabledButtons={loading} handleSave={() => onSubmit(getValues(), null)}/>
        </form>
    );
};
