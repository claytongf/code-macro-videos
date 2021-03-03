import * as React from 'react';
import format from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import categoryHttp from '../../util/http/category-http';
import { BadgeNo, BadgeYes } from '../../components/Badge';
import { Category, ListResponse } from '../../util/models';
import DefaultTable, {makeActionStyles ,TableColumn} from '../../components/Table'
import { useSnackbar } from 'notistack';
import { IconButton, MuiThemeProvider } from '@material-ui/core';
import { Link } from 'react-router-dom';
import EditIcon from '@material-ui/icons/Edit'

interface Pagination{
    page: number;
    total: number;
    per_page: number;
}
interface SearchState {
    search: string;
    pagination: Pagination;
}

const columnsDefinition: TableColumn[] = [
    {
        name: 'id',
        label: 'ID',
        width: '30%',
        options: {
            sort: false
        }
    },
    {
        name: "name",
        label: "Nome",
        width: "43%"
    },
    {
        name: "is_active",
        label: "Ativo?",
        options: {
            customBodyRender(value, tableMeta, updateValue){
                return value ? <BadgeYes/> : <BadgeNo/>
            }
        },
        width: '4%'
    },
    {
        name: "created_at",
        label: "Criado em",
        width: '10%',
        options: {
            customBodyRender(value, tableMeta, updateValue){
                return <span>{format(parseISO(value), 'dd/MM/yyyy')}</span>
            }
        }
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

const Table = () => {
    const snackbar = useSnackbar()
    const subscribed = React.useRef(true)
    const [data, setData] = React.useState<Category[]>([])
    const [loading, setLoading] = React.useState<boolean>(false)
    const [searchState, setSearchState] = React.useState<SearchState>({
        search: '',
        pagination: {
            page: 1,
            total: 0,
            per_page: 10
        }
    });

    React.useEffect(() => {

    }, [])

    React.useEffect(() => {
        subscribed.current = true
        getData()
        return () => {
            subscribed.current = false
            //executado quando componente estiver desmontado
        }
    }, [
        searchState.search,
        searchState.pagination.page,
        searchState.pagination.per_page
    ])

    async function getData(){
        setLoading(true)
        try{
            const {data} = await categoryHttp.list<ListResponse<Category>>({
                queryParams: {
                    search: searchState.search,
                    page: searchState.pagination.page,
                    per_page: searchState.pagination.per_page
                }
            })
            if(subscribed.current){
                setData(data.data)
                setSearchState((prevState => ({
                    ...prevState,
                    pagination: {
                        ...prevState.pagination,
                        total: data.meta.total
                    }
                })))
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
    }
    return (
        <MuiThemeProvider theme={makeActionStyles(columnsDefinition.length - 1)}>
            <DefaultTable
                title="Listagem de categorias"
                columns={columnsDefinition}
                data={data}
                loading={loading}
                options={{
                    serverSide: true,
                    responsive: 'vertical',
                    searchText: searchState.search,
                    page: searchState.pagination.page,
                    rowsPerPage: searchState.pagination.per_page,
                    count: searchState.pagination.total,
                    onSearchChange: (value) => setSearchState((prevState => ({
                        ...prevState,
                        search: value,
                        }
                    ))),
                    onChangePage: (page) => setSearchState((prevState => ({
                        ...prevState,
                            pagination: {
                                ...prevState.pagination,
                                page: page + 1,
                            }
                        }
                    ))),
                    onChangeRowsPerPage: (perPage) => setSearchState((prevState => ({
                        ...prevState,
                        pagination: {
                            ...prevState.pagination,
                            per_page: perPage,
                        }
                        }
                    ))),

                }}
            />
        </MuiThemeProvider>
    );
};

export default Table
