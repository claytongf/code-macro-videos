import { Checkbox, FormControlLabel, TextField } from '@material-ui/core';
import * as React from 'react';
import categoryHttp from '../../util/http/category-http';
import * as yup from '../../util/vendor/yup'
import { useForm } from "react-hook-form"
import { useHistory, useParams } from 'react-router';
import { useSnackbar } from 'notistack';
import { Category } from '../../util/models';
import SubmitActions from '../../components/SubmitActions';
import { isValid } from 'date-fns';

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
          }),
        []
    );
    const resolver = useYupValidationResolver(validationSchema);
    const {register, handleSubmit, getValues, setValue, triggerValidation, errors, reset, watch} = useForm<{name: string, is_active: boolean}>({resolver, defaultValues: {is_active: true}})

    const snackbar = useSnackbar();
    const history = useHistory()
    const {id} = useParams<{id:string}>()
    const [category, setCategory] = React.useState<Category | null>(null)
    const [loading, setLoading] = React.useState<boolean>(false)

    React.useEffect(() => {
        register({name: "is_active"})
    }, [register])

    React.useEffect(() => {
        let isSubscribed = true;
        if(!id){
            return
        }
        (async function getCategory(){
            setLoading(true)
            try{
                const {data} = await categoryHttp.get(id)
                if(isSubscribed){
                    setCategory(data.data)
                    reset(data.data)
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
            const http = !category
                ? categoryHttp.create(formData)
                : categoryHttp.update(category.id, formData)
                const {data} = await http
                snackbar.enqueueSnackbar(
                    'Categoria salva com sucesso',
                    {variant: 'success'}
                )
                setTimeout(() => {
                    event ? (
                        id
                            ? history.replace(`/categories/${data.data.id}/edit`)
                            : history.push(`/categories/${data.data.id}/edit`)
                    ) : history.push('/categories')
                })
        } catch(error) {
            console.log(error)
            snackbar.enqueueSnackbar(
                'Erro ao salvar categoria',
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
            <SubmitActions disabledButtons={loading} handleSave={() => triggerValidation().then(isValid => {
                 isValid && onSubmit(getValues(), null)
            })}/>
        </form>
    );
};
