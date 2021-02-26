import MUIDataTable, { MUIDataTableColumn } from 'mui-datatables';
import * as React from 'react';
import format from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import categoryHttp from '../../util/http/category-http';
import { BadgeNo, BadgeYes } from '../../components/Badge';
import { Category, ListResponse } from '../../util/models';

const columnsDefinition: MUIDataTableColumn[] = [
    {
        name: "name",
        label: "Nome"
    },
    {
        name: "is_active",
        label: "Ativo?",
        options: {
            customBodyRender(value, tableMeta, updateValue){
                return value ? <BadgeYes/> : <BadgeNo/>
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
    const [data, setData] = React.useState<Category[]>([])
    React.useEffect(() => {
        let isSubscribed = true;
        (async () => {
            const {data} = await categoryHttp.list<ListResponse<Category>>()
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
        <MUIDataTable title="Listagem de categorias" columns={columnsDefinition} data={data}  />
    );
};

export default Table
