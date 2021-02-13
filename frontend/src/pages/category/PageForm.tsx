import * as React from 'react';
import {useParams} from 'react-router';
import { Page } from '../../components/Page';
import { Form } from './Form';
type Props = {

};
const PageForm = (props: Props) => {
    const {id} = useParams<{id:string}>()

    return (
        <Page title={!id ? 'Criar Categoria' : 'Editar categoria'}>
            <Form/>
        </Page>
    );
};

export default PageForm
