import classes from '*.module.css';
import { Button, Card, CardContent, Checkbox, FormControlLabel, FormHelperText, Grid, makeStyles, TextField, Theme, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { useSnackbar } from 'notistack';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router';
import { DefaultForm } from '../../../components/DefaultForm';
import SubmitActions from '../../../components/SubmitActions';
import videoHttp from '../../../util/http/video-http';
import { Video, VideoFileFieldsMap } from '../../../util/models';
import * as yup from '../../../util/vendor/yup'
import { RatingField } from './RatingField';
import { UploadField } from './UploadField';
import CategoryField from "./CategoryField";
import GenreField from "./GenreField";

const useStyles = makeStyles((theme: Theme) => ({
    cardUpload: {
        borderRadius: "4px",
        backgroundColor: "#F5F5F5",
        margin: theme.spacing(2, 0)
    }
}))
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

const fileFields = Object.keys(VideoFileFieldsMap);

export const Form = () => {
    const classes = useStyles()
    const validationSchema = yup.object().shape({
        title: yup.string()
            .label('Título')
            .required()
            .max(255),
        description: yup.string()
            .label('Sinopse')
            .required(),
        year_launched: yup.number()
            .label('Ano de Lançamento')
            .required()
            .min(1),
        duration: yup.number()
            .required().min(1),
        genres: yup.array().label('Gêneros').required(),
        categories: yup.array().label('Categories').required(),
        rating: yup.string()
            .label('Classificação')
            .required(),
    })

    const resolver = useYupValidationResolver(validationSchema);

    const { register, handleSubmit, getValues, setValue, errors, reset, watch, trigger } = useForm<Video>({
        resolver,
        defaultValues: {
            genres: [],
            categories: []
        }
    })

    const snackbar = useSnackbar();
    const history = useHistory()
    const {id} = useParams<{id:string}>()
    const [video, setVideo] = React.useState<Video | null>(null)
    const [loading, setLoading] = React.useState<boolean>(false)
    const theme = useTheme();
    const isGreaterMd = useMediaQuery(theme.breakpoints.up('md'));

    React.useEffect(() => {
        ['rating', 'opened', 'genres', 'categories', ...fileFields].forEach(name => register({name}));
    }, [register])

    React.useEffect(() => {
        if(!id){
            return
        }
        let isSubscribed = true;
        (async () => {
            setLoading(true)
            try{
                const {data} = await videoHttp.get(id)
                if(isSubscribed){
                    setVideo(data.data)
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
            const http = !video
                ? videoHttp.create(formData)
                : videoHttp.update(video.id, formData)
                const {data} = await http
                snackbar.enqueueSnackbar(
                    'Vídeo salvo com sucesso',
                    {variant: 'success'}
                )
                setTimeout(() => {
                    event ? (
                        id
                            ? history.replace(`/videos/${data.data.id}/edit`)
                            : history.push(`/videos/${data.data.id}/edit`)
                    ) : history.push('/videos')
                })
        } catch(error) {
            console.log(error)
            snackbar.enqueueSnackbar(
                'Erro ao salvar vídeo',
                {variant: 'error'}
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <DefaultForm onSubmit={handleSubmit(onSubmit)} GridItemProps={{ xs: 12 }}>
            <Grid container spacing={5}>
                <Grid item xs={12} md={6}>
                    <TextField
                        name="title"
                        label="Título"
                        fullWidth
                        variant={'outlined'}
                        inputRef={register}
                        disabled={loading}
                        error={errors.title !== undefined}
                        helperText={errors.title && errors.title.message}
                        InputLabelProps={{ shrink:true }}
                    />
                    <TextField
                        name="description"
                        label="Sinopse"
                        multiline
                        rows="4"
                        fullWidth
                        variant='outlined'
                        margin='normal'
                        inputRef={register}
                        disabled={loading}
                        InputLabelProps={{ shrink:true }}
                        error={errors.description !== undefined}
                        helperText={errors.description && errors.description.message}
                    />
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <TextField
                                name="year_launched"
                                label="Ano de Lançamento"
                                type="number"
                                fullWidth
                                variant='outlined'
                                margin='normal'
                                inputRef={register}
                                disabled={loading}
                                InputLabelProps={{ shrink:true }}
                                error={errors.year_launched !== undefined}
                                helperText={errors.year_launched && errors.year_launched.message}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="duration"
                                label="Duração"
                                type="number"
                                fullWidth
                                variant='outlined'
                                margin='normal'
                                inputRef={register}
                                disabled={loading}
                                InputLabelProps={{ shrink:true }}
                                error={errors.duration !== undefined}
                                helperText={errors.duration && errors.duration.message}
                            />
                        </Grid>
                    </Grid>
                    Elenco
                    <br/>
                    <Grid container spacing={2}>
                        <Grid item md={6} xs={12}>
                            <GenreField
                                genres={watch('genres')}
                                setGenres={(value) => setValue('genres', value, { shouldValidate: true })}
                                categories={watch('categories')}
                                setCategories={(value) => setValue('categories', value, { shouldValidate: true })}
                                error={errors.genres}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item md={6} xs={12}>
                            <CategoryField
                                categories={watch('categories')}
                                setCategories={(value) => setValue('categories', value, { shouldValidate: true })}
                                genres={watch('genres')}
                                error={errors.categories}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormHelperText>
                                Escolha os gêneros do vídeo
                            </FormHelperText>
                            <FormHelperText>
                                Escolha pelo menos uma categoria de cada gênero
                            </FormHelperText>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} md={6}>
                    <RatingField
                        value={watch('rating')}
                        setValue={(value) => setValue('rating', value. true)}
                        error={errors.rating}
                        disabled={loading}
                        FormControlProps={{
                            margin: isGreaterMd ? 'none' : 'normal'
                         }}
                    />
                    <Card className={classes.cardUpload}>
                        <CardContent>
                            <Typography color="primary" variant="h6">
                                Imagens
                            </Typography>
                            <UploadField
                                accept={'image/*'}
                                label={'Thumb'}
                                setValue={(value) => setValue('thumb_file', value)}
                            />
                            <UploadField
                                accept={'image/*'}
                                label={'Banner'}
                                setValue={(value) => setValue('banner_file', value)}
                            />
                        </CardContent>
                    </Card>
                    <Card className={classes.cardUpload}>
                         <CardContent>
                             <Typography color="primary" variant="h6">
                                 Vídeos
                             </Typography>
                            <UploadField
                                accept={'video/mp4'}
                                label={'Trailer'}
                                setValue={(value) => setValue('trailer_file', value)}
                            />
                            <UploadField
                                accept={'video/mp4'}
                                label={'Principal'}
                                setValue={(value) => setValue('video_file', value)}
                            />
                         </CardContent>
                    </Card>
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="opened"
                                color={'primary'}
                                onChange={
                                    () => setValue('opened' as never, !getValues()['opened'])
                                }
                                checked={watch('opened')}
                                disabled={loading}
                            />
                        }
                        label={
                            <Typography color="primary" variant={'subtitle2'}>
                                Quero que este conteúdo apareça na seção lançamentos
                            </Typography>
                        }
                        labelPlacement="end"
                    />
                </Grid>
            </Grid>
            <SubmitActions disabledButtons={loading} handleSave={() => trigger().then(isValid => {
                isValid && onSubmit(getValues(), null)
            })}/>
        </DefaultForm>
    );
};
