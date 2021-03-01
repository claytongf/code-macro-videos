import { Chip, IconButton, MuiThemeProvider } from '@material-ui/core';
import * as React from 'react';
import format from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import genreHttp from '../../util/http/genre-http';
import { Genre, ListResponse } from '../../util/models';
import DefaultTable, { makeActionStyles, TableColumn } from '../../components/Table'
import { useSnackbar } from 'notistack';
import EditIcon from '@material-ui/icons/Edit'
import { Link } from 'react-router-dom';

const columnsDefinition: TableColumn[] = [
    {
        name: 'id',
        label: 'ID',
        width: '27%',
        options: {
            sort: false
        }
    },
    {
        name: "name",
        label: "Nome",
        width: '16%',
    },
    {
        name: "categories",
        label: "Categorias",
        options: {
            customBodyRender(value, tableMeta, updateValue){
                return value.map((value: any) => value.name).join(", ")
            }
        },
        width: '30%'
    },
    {
        name: "is_active",
        label: "Ativo?",
        options: {
            customBodyRender(value, tableMeta, updateValue){
                return value ? <Chip label="Sim" color="primary"/> : <Chip label="Não" color="secondary"/>
            }
        },
        width: "4%"
    },
    {
        name: "created_at",
        label: "Criado em",
        options: {
            customBodyRender(value, tableMeta, updateValue){
                return <span>{format(parseISO(value), 'dd/MM/yyyy')}</span>
            }
        },
        width: "10%"
    },
    {
        name: "actions",
        label: "Ações",
        width: '13%',
        options: {
            sort: false,
            customBodyRender: (value, tableMeta) => {
                return (
                    <IconButton
                        color={'secondary'}
                        component={Link}
                        to={`/categories/${tableMeta.rowData[0]}/edit`}
                    >
                        <EditIcon/>
                    </IconButton>
                )
            }
        }
    }
]

type Props = {};
const Table = (props: Props) => {
    const snackbar = useSnackbar()
    const [data, setData] = React.useState<Genre[]>([])
    const [loading, setLoading] = React.useState<boolean>(false)
    React.useEffect(() => {
        let isSubscribed = true;
        (async () => {
            setLoading(true)
            try{
                const {data} = await genreHttp.list<ListResponse<Genre>>()
                if(isSubscribed){
                    setData(data.data)
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
            //executado quando componente estiver desmontado
        }
    }, [])
    return (
        <MuiThemeProvider theme={makeActionStyles(columnsDefinition.length - 1)}>
            <DefaultTable title="Listagem de gêneros" columns={columnsDefinition} data={data} loading={loading} options={{responsive: 'vertical'}}/>
        </MuiThemeProvider>
    );
};

export default Table
