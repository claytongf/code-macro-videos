import * as React from 'react';
import format from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import castMemberHttp from '../../util/http/cast-member-http';
import { CastMember, ListResponse, CastMemberTypeMap } from '../../util/models';
import DefaultTable, { makeActionStyles, MuiDataTableRefComponent, TableColumn } from '../../components/Table'
import { useSnackbar } from 'notistack';
import { IconButton, MuiThemeProvider } from '@material-ui/core';
import { Link } from 'react-router-dom';
import EditIcon from '@material-ui/icons/Edit'
import * as yup from '../../util/vendor/yup'
import useFilter from '../../hooks/useFilter';
import { FilterResetButton } from '../../components/Table/FilterResetButton';
import { invert } from 'lodash';
import DeleteDialog from '../../components/DeleteDialog';
import useDeleteCollection from '../../hooks/useDeleteCollection';
import LoadingContext from '../../components/loading/LoadingContext';

const castMemberNames = Object.values(CastMemberTypeMap)

const columnsDefinition: TableColumn[] = [
    {
        name: 'id',
        label: 'ID',
        width: '30%',
        options: {
            sort: false,
            filter: false
        }
    },
    {
        name: "name",
        label: "Nome",
        width: "43%",
        options: {
            filter: false
        }
    },
    {
        name: "type",
        label: "Tipo",
        options: {
            filterOptions: {
                names: castMemberNames
            },
            customBodyRender(value, tableMeta, updateValue){
                return CastMemberTypeMap[value]
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
        width: '10%',
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
    const {enqueueSnackbar} = useSnackbar()
    const subscribed = React.useRef(true)
    const [data, setData] = React.useState<CastMember[]>([])
    const loading = React.useContext(LoadingContext)
    const {openDeleteDialog, setOpenDeleteDialog, rowsToDelete, setRowsToDelete } = useDeleteCollection();
    const tableRef = React.useRef() as React.MutableRefObject<MuiDataTableRefComponent>

    const extraFilter = React.useMemo(() => ({
            createValidationSchema: () => {
                return yup.object().shape({
                    type: yup.string()
                        .nullable()
                        .transform(value => {
                            return !value || !castMemberNames.includes(value) ? undefined : value;
                        })
                        .default(null)
                })
            },
            formatSearchParams: (debouncedState) => {
                return debouncedState.extraFilter
                ? {
                    ...(
                        debouncedState.extraFilter.type &&
                        {type: debouncedState.extraFilter.type}
                    )
                }
                : undefined
            },
            getStateFromURL: (queryParams) => {
                return {
                    type: queryParams.get('type')
                }
            }
    }), [])
    const {columns, filterManager, cleanSearchText, filterState, debouncedFilterState, totalRecords, setTotalRecords} = useFilter({
        columns: columnsDefinition,
        debounceTime: debounceTime,
        rowsPerPage,
        rowsPerPageOptions,
        tableRef,
        extraFilter
    })
    const searchText = cleanSearchText(filterState.search)

    const indexColumnType = columns.findIndex(c => c.name === 'type')
    const columnType = columns[indexColumnType]
    const typeFilterValue = filterState.extraFilter && filterState.extraFilter.type as never;
    (columnType.options as any).filterList = typeFilterValue ? [typeFilterValue] : []

    const serverSideFilterList = columns.map(column => [])
    if(typeFilterValue){
        serverSideFilterList[indexColumnType] = [typeFilterValue]
    }

    const getData = React.useCallback(async ({search, page, per_page, sort, dir, type}) => {
        try{
            const {data} = await castMemberHttp.list<ListResponse<CastMember>>({
                queryParams: {
                    search,
                    page,
                    per_page,
                    sort,
                    dir,
                    ...(
                        type && {type: invert(CastMemberTypeMap)[type]}
                    )
                }
            })
            if(subscribed.current){
                setData(data.data)
                setTotalRecords(data.meta.total)
                if(openDeleteDialog){
                    setOpenDeleteDialog(false)
                }
            }
        } catch (error) {
            console.error(error);
            if(castMemberHttp.isCancelledRequest(error)){
                return;
            }
            enqueueSnackbar(
                'Não foi possível carregar as informações',
                {variant: 'error'}
            )
        }
    }, [enqueueSnackbar, setTotalRecords, openDeleteDialog, setOpenDeleteDialog])

    React.useEffect(() => {
        subscribed.current = true
        getData({
            search: searchText,
            page: filterState.pagination.page,
            per_page: filterState.pagination.per_page,
            sort: filterState.order.sort,
            dir: filterState.order.dir,
            ...(
                debouncedFilterState.extraFilter &&
                debouncedFilterState.extraFilter.type &&
                {type: debouncedFilterState.extraFilter.type}
            )
        })
        return () => {
            subscribed.current = false
            //executado quando componente estiver desmontado
        }
    }, [
        getData,
        searchText,
        filterState.pagination.page,
        filterState.pagination.per_page,
        filterState.order,
        debouncedFilterState.extraFilter
    ])

    function deleteRows(confirmed: boolean){
        if(!confirmed){
            setOpenDeleteDialog(false);
            return;
        }
        const ids = rowsToDelete
            .data
            .map(value => data[value.index].id)
            .join(',');
        castMemberHttp
            .deleteCollection({ids})
            .then(response => {
                enqueueSnackbar(
                    'Registros excluídos com sucesso', {variant: 'success'}
                )
                if(rowsToDelete.data.length === filterState.pagination.per_page && filterState.pagination.page > 1){
                    const page = filterState.pagination.page - 2;
                    filterManager.changePage(page)
                }else{
                    getData({
                        search: searchText,
                        page: filterState.pagination.page,
                        per_page: filterState.pagination.per_page,
                        sort: filterState.order.sort,
                        dir: filterState.order.dir,
                        ...(
                            debouncedFilterState.extraFilter &&
                            debouncedFilterState.extraFilter.type &&
                            {type: debouncedFilterState.extraFilter.type}
                        )
                    })
                }
            })
            .catch((error) => {
                console.error(error)
                enqueueSnackbar(
                    'Não foi possível excluir os registros', {variant: 'error'}
                )
            })
    }

    return (
        <MuiThemeProvider theme={makeActionStyles(columnsDefinition.length - 1)}>
            <DeleteDialog open={openDeleteDialog} handleClose={deleteRows}/>
            <DefaultTable
                title="Listagem de membros"
                columns={columns}
                data={data}
                loading={loading}
                debouncedSearchTime={debounceSearchTime}
                ref={tableRef}
                options={{
                    serverSide: true,
                    responsive: 'vertical',
                    searchText: filterState.search as any,
                    page: filterState.pagination.page - 1,
                    rowsPerPage: filterState.pagination.per_page,
                    rowsPerPageOptions,
                    count: totalRecords,
                    onFilterChange: (column, filterList) => {
                        const columnIndex = columns.findIndex(c => c.name === column)
                        if(column === null){
                            filterManager.changeExtraFilter({
                                type: null
                            })
                            return
                        }
                        filterManager.changeExtraFilter({
                            [column as string]: filterList[columnIndex].length ? filterList[columnIndex][0] : null
                        })
                    },
                    customToolbar: () => (
                        <FilterResetButton handleClick={() => filterManager.resetFilter()}/> //default
                    ),
                    onSearchChange: (value) => filterManager.changeSearch(value),
                    onChangePage: (page) => filterManager.changePage(page),
                    onChangeRowsPerPage: (perPage) => filterManager.changeRowsPerPage(perPage),
                    onColumnSortChange: (changedColumn: string, direction: string) => filterManager.changeColumnSort(changedColumn, direction),
                    onRowsDelete: (rowsDeleted) => {
                        setRowsToDelete(rowsDeleted as any);
                        return false;
                    }
                }}
            />
        </MuiThemeProvider>
    );
};

export default Table
