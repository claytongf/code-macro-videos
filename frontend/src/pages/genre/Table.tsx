import { Chip, IconButton, MuiThemeProvider } from '@material-ui/core';
import * as React from 'react';
import format from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import genreHttp from '../../util/http/genre-http';
import { Category, Genre, ListResponse } from '../../util/models';
import DefaultTable, { makeActionStyles, MuiDataTableRefComponent, TableColumn } from '../../components/Table'
import { useSnackbar } from 'notistack';
import EditIcon from '@material-ui/icons/Edit'
import { Link } from 'react-router-dom';
import * as yup from '../../util/vendor/yup'
import useFilter from '../../hooks/useFilter';
import { FilterResetButton } from '../../components/Table/FilterResetButton';
import categoryHttp from '../../util/http/category-http';

const columnsDefinition: TableColumn[] = [
    {
        name: 'id',
        label: 'ID',
        width: '27%',
        options: {
            sort: false,
            filter: false
        }
    },
    {
        name: "name",
        label: "Nome",
        width: '16%',
        options: {
            filter: false
        }
    },
    {
        name: "categories",
        label: "Categorias",
        options: {
            filterType: 'multiselect',
            filterOptions: {
                names: []
            },
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
            filterOptions: {
                names: ['Sim', 'Não']
            },
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
            filter: false,
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
            filter: false,
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

const debounceTime = 300
const debounceSearchTime = 300
const rowsPerPage = 15;
const rowsPerPageOptions = [15, 25, 50];

const Table = () => {
    const snackbar = useSnackbar()
    const subscribed = React.useRef(true)
    const [data, setData] = React.useState<Genre[]>([])
    const [loading, setLoading] = React.useState<boolean>(false)
    const [categories, setCategories] = React.useState<Category[]>()
    const tableRef = React.useRef() as React.MutableRefObject<MuiDataTableRefComponent>

    const {columns, filterManager, filterState, debouncedFilterState, totalRecords, setTotalRecords} = useFilter({
        columns: columnsDefinition,
        debounceTime: debounceTime,
        rowsPerPage,
        rowsPerPageOptions,
        tableRef,
        extraFilter: {
            createValidationSchema: () => {
                return yup.object().shape({
                    categories: yup.mixed()
                        .nullable()
                        .transform(value => {
                            return !value || value === '' ? undefined : value.split(',');
                        })
                        .default(null)
                })
            },
            formatSearchParams: (debouncedState) => {
                return debouncedState.extraFilter
                ? {
                    ...(
                        debouncedState.extraFilter.categories &&
                        {categories: debouncedState.extraFilter.categories.join(',')}
                    )
                }
                : undefined
            },
            getStateFromURL: (queryParams) => {
                return {
                    categories: queryParams.get('categories')
                }
            }
        }
    })

    const indexColumnCategories = columns.findIndex(c => c.name === 'categories')
    const columnCategories = columns[indexColumnCategories]
    const categoriesFilterValue = filterState.extraFilter && filterState.extraFilter.categories;
    (columnCategories.options as any).filterList = categoriesFilterValue ? categoriesFilterValue : []

    const serverSideFilterList = columns.map(column => [])
    if(categoriesFilterValue){
        serverSideFilterList[indexColumnCategories] = categoriesFilterValue
    }

    React.useEffect(() => {
        let isSubscribed = true;
        (async () => {
            try {
                const {data} = await categoryHttp.list({queryParams: {all: ''}})
                if (isSubscribed) {
                    setCategories(data.data);
                    (columnCategories.options as any).filterOptions.names = data.data.map(category => category.name)
                }
            } catch (error) {
                console.error(error)
                snackbar.enqueueSnackbar(
                    'Não foi possível carregar as informações',
                    {variant: 'error'}
                )
            }
            return () => {
                 isSubscribed = false;
                //executado quando componente estiver desmontado
            }
        })();
    },[])

    React.useEffect(() => {
        subscribed.current = true
        filterManager.pushHistory()
        getData()
        return () => {
            subscribed.current = false
            //executado quando componente estiver desmontado
        }
    }, [
        filterManager.cleanSearchText(debouncedFilterState.search),
        debouncedFilterState.pagination.page,
        debouncedFilterState.pagination.per_page,
        debouncedFilterState.order
    ])

    async function getData(){
        setLoading(true)
        try{
            const {data} = await genreHttp.list<ListResponse<Genre>>({
                queryParams: {
                    search: filterManager.cleanSearchText(filterState.search),
                    page: filterState.pagination.page,
                    per_page: filterState.pagination.per_page,
                    sort: filterState.order.sort,
                    dir: filterState.order.dir
                }
            })
            if(subscribed.current){
                setData(data.data)
                setTotalRecords(data.meta.total)
            }
        } catch (error) {
            console.error(error);
            if(genreHttp.isCancelledRequest(error)){
                return;
            }
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
                title="Listagem de gêneros"
                columns={columns}
                data={data}
                loading={loading}
                debouncedSearchTime={debounceSearchTime}
                ref={tableRef}
                options={{
                    serverSideFilterList,
                    serverSide: true,
                    responsive: 'scrollFullHeight',
                    searchText: filterState.search as any,
                    page: filterState.pagination.page,
                    rowsPerPage: filterState.pagination.per_page,
                    rowsPerPageOptions,
                    count: totalRecords,
                    onFilterChange: (column:any, filterList) => {
                        const columnIndex = columns.findIndex(c => c.name === column)
                        filterManager.changeExtraFilter({
                            [column]: filterList[columnIndex].length ? filterList[columnIndex][0] : null
                        })
                    },
                    customToolbar: () => (
                        <FilterResetButton handleClick={() => filterManager.resetFilter()}/> //default
                    ),
                    onSearchChange: (value) => filterManager.changeSearch(value),
                    onChangePage: (page) => filterManager.changePage(page),
                    onChangeRowsPerPage: (perPage) => filterManager.changeRowsPerPage(perPage),
                    onColumnSortChange: (changedColumn: string, direction: string) => filterManager.changeColumnSort(changedColumn, direction),
                }}
            />
        </MuiThemeProvider>
    );
};

export default Table
