import { Card, CardContent, Checkbox, FormControlLabel, Grid, makeStyles, TextField, Theme, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { useSnackbar } from 'notistack';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router';
import SubmitActions from '../../../components/SubmitActions';
import videoHttp from '../../../util/http/video-http';
import { Video, VideoFileFieldsMap } from '../../../util/models';
import * as yup from '../../../util/vendor/yup'
import { RatingField } from './RatingField';
import { UploadField } from './UploadField';
import CategoryField, { CategoryFieldComponent } from "./CategoryField";
import GenreField, { GenreFieldComponent } from "./GenreField";
import CastMemberField, { CastMemberFieldComponent } from './CastMemberField';
import { omit, zipObject } from 'lodash';
import { InputFileComponent } from '../../../components/InputFile';
import { DefaultForm } from '../../../components/DefaultForm';
import useSnackbarFormError from '../../../hooks/useSnackbarFormError';
import LoadingContext from '../../../components/loading/LoadingContext';
import SnackbarUpload from '../../../components/SnackbarUpload';
import { useDispatch } from 'react-redux';
import { FileInfo } from '../../../store/upload/types';
import { Creators } from '../../../store/upload';

const useStyles = makeStyles((theme: Theme) => ({
    cardUpload: {
        borderRadius: "4px",
        backgroundColor: "#F5F5F5",
        margin: theme.spacing(2, 0)
    },
    cardOpened: {
        borderRadius: "4px",
        backgroundColor: "#F5F5F5",
    },
    cardContentOpened: {
        paddingBottom: theme.spacing(2) + 'px !important'
    },
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
        genres: yup.array()
            .label('Gêneros')
            .test({
            message: "Cada Gênero escolhido precisa ter, pelo menos, uma categoria selecionada",
            test: (value, ctx) => {
                if (!value) {
                    return false;
                }
                return value.every(
                    v =>
                        v.categories.filter(cat => {
                            const categories = ctx.parent.categories;
                            return (
                                categories && categories.map(c => c.id).includes(cat.id)
                            );
                        }).length !== 0
                    );
                },
            }),
        categories: yup.array().label('Categories').required(),
        rating: yup.string()
            .label('Classificação')
            .required()
    })

    const resolver = useYupValidationResolver(validationSchema);

    const { register, handleSubmit, getValues, setValue, errors, reset, watch, trigger, formState } = useForm<Video>({
        resolver,
        defaultValues: {
            rating: undefined,
            genres: [],
            categories: [],
            cast_members: [],
            opened: false
        }
    })

    useSnackbarFormError(formState.submitCount, errors)

    const classes = useStyles()
    const {enqueueSnackbar} = useSnackbar();
    const history = useHistory()
    const dispatch = useDispatch();
    const {id} = useParams<{id:string}>()
    const [video, setVideo] = React.useState<Video | null>(null)
    const loading = React.useContext(LoadingContext)
    const theme = useTheme();
    const isGreaterMd = useMediaQuery(theme.breakpoints.up('md'));
    const castMemberRef = React.useRef() as React.MutableRefObject<CastMemberFieldComponent>
    const genreRef = React.useRef() as React.MutableRefObject<GenreFieldComponent>
    const categoryRef = React.useRef() as React.MutableRefObject<CategoryFieldComponent>
    const uploadsRef = React.useRef(
        zipObject(fileFields, fileFields.map(() => React.createRef()))
    ) as React.MutableRefObject<{[key: string]: React.MutableRefObject<InputFileComponent>}>;

    const resetForm = React.useCallback((data) => {
        Object.keys(uploadsRef.current).forEach(
            field => uploadsRef.current[field].current.clear()
        );
        castMemberRef.current.clear();
        genreRef.current.clear();
        categoryRef.current.clear();
        reset(data);
    }, [reset, uploadsRef, castMemberRef, genreRef, categoryRef])

    React.useEffect(() => {
        ['rating', 'opened', 'genres', 'categories', 'cast_members', ...fileFields].forEach(name => register({name}));
    }, [register])

    React.useEffect(() => {
        enqueueSnackbar('', {
            key: 'snackbar-upload',
            persist: true,
            anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'right'
            },
            content: (key, message) => {
                const id = key as any;
                return <SnackbarUpload id={id} />
            }
        })
        if(!id){
            return
        }
        let isSubscribed = true;
        (async () => {
            try{
                const {data} = await videoHttp.get(id)
                if(isSubscribed){
                    setVideo(data.data)
                    resetForm(data.data)
                }
            } catch (error) {
                console.error(error);
                enqueueSnackbar(
                    'Não foi possível carregar as informações',
                    {variant: 'error'}
                )
            }
        })()

        return () => {
            isSubscribed = false
        }
    }, [id, resetForm, enqueueSnackbar])

    async function onSubmit(formData: Video, event) {
        const sendData = omit(
            formData, [...fileFields, "genres", "categories", "cast_members"]
        );

        sendData["cast_members_id"] = formData["cast_members"].map((cast_member) => cast_member.id);
        sendData["categories_id"] = formData["categories"].map((category) => category.id);
        sendData["genres_id"] = formData["genres"].map((genre) => genre.id);

        try {
            const http = !video
                ? videoHttp.create(sendData)
                : videoHttp.update(video.id, sendData);

            const { data } = await http;
            enqueueSnackbar("Video salvo com sucesso!", {variant: "success"});
            uploadFiles(data.data)
            id && resetForm(video);
            setTimeout(() => {
                event ? (!id && history.push(`/videos/${data.data.id}/edit`)) : history.push('/videos')
            });
        } catch (error) {
            console.log(error);
            enqueueSnackbar("Falha ao salvar Video", {variant: "error"});
        }
    }

    function uploadFiles(video){
        const files: FileInfo[] = fileFields
            .filter(fileField => getValues()[fileField])
            .map(fileField => ({fileField, file: getValues()[fileField]}))

            if(!files.length){
                return;
            }

        dispatch(Creators.addUpload({video, files}))

        enqueueSnackbar('', {
            key: 'snackbar-upload',
            persist: true,
            anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'right'
            },
            content: (key, message) => {
                const id = key as any;
                return <SnackbarUpload id={id}/>
            }
        })
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
                    <CastMemberField
                        ref={castMemberRef}
                        castMembers={watch('cast_members')}
                        setCastMembers={(value) => setValue('cast_members', value, { shouldValidate: true })}
                        error={errors.cast_members}
                        disabled={loading}
                    />
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
                    </Grid>
                </Grid>
                <Grid item xs={12} md={6}>
                    <RatingField
                        value={watch('rating')}
                        setValue={(value) => setValue('rating', value, { shouldValidate: true })}
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
                                ref={uploadsRef.current['thumb_file']}
                                accept={'image/*'}
                                label={'Thumb'}
                                setValue={(value) => setValue('thumb_file', value)}
                            />
                            <UploadField
                                ref={uploadsRef.current['banner_file']}
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
                                ref={uploadsRef.current['trailer_file']}
                                accept={'video/mp4'}
                                label={'Trailer'}
                                setValue={(value) => setValue('trailer_file', value)}
                            />
                            <UploadField
                                ref={uploadsRef.current['video_file']}
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
