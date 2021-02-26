import { Chip } from '@material-ui/core';
import MUIDataTable, { MUIDataTableColumn } from 'mui-datatables';
import * as React from 'react';
import format from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import genreHttp from '../../util/http/genre-http';
import { Genre, ListResponse } from '../../util/models';

const columnsDefinition: MUIDataTableColumn[] = [
    {
        name: "name",
        label: "Nome"
    },
    {
        name: "categories",
        label: "Categorias",
        options: {
            customBodyRender(value, tableMeta, updateValue){
                return value.map((value: any) => value.name).join(", ")
            }
        }
    },
    {
        name: "is_active",
        label: "Ativo?",
        options: {
            customBodyRender(value, tableMeta, updateValue){
                return value ? <Chip label="Sim" color="primary"/> : <Chip label="Não" color="secondary"/>
            }
        }
    },
    {
        name: "created_at",
        label: "Criado em",
        options: {
            customBodyRender(value, tableMeta, updateValue){
                return <span>{format(parseISO(value), 'dd/MM/yyyy')}</span>
            }
        }
    }
]

type Props = {};
const Table = (props: Props) => {
    const [data, setData] = React.useState<Genre[]>([])
    React.useEffect(() => {
        let isSubscribed = true;
        (async () => {
            const {data} = await genreHttp.list<ListResponse<Genre>>()
            if(isSubscribed){
                setData(data.data)
            }
        })()

        return () => {
            isSubscribed = false
            //executado quando componente estiver desmontado
        }
    }, [])
    return (
        <MUIDataTable title="Listagem de gêneros" columns={columnsDefinition} data={data} />
    );
};

export default Table
