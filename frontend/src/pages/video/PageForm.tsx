import { useParams } from 'react-router';
import { Page } from '../../components/Page';
import { Form } from './Form';

export const PageForm = () => {
    const {id} = useParams<{id:string}>();
    return (
        <Page title={!id ? 'Criar vídeo' : 'Editar vídeo'}>
            <Form/>
        </Page>
    );
};

export default PageForm;
