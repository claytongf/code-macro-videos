import { Box, Fab, Table } from '@material-ui/core';
import { Page } from '../../components/Page';
import AddIcon from '@material-ui/icons/Add'
import { Link } from 'react-router-dom';

const PageList = () => {
    return (
        <Page title={'Listagem vídeos'}>
            <Box dir={'rtl'} paddingBottom={2}>
                <Fab title="Adicionar vídeo" color={'secondary'} size="small" component={Link} to="/videos/create">
                    <AddIcon/>
                </Fab>
            </Box>
            <Box>
                <Table/>
            </Box>
        </Page>
    );
};

export default PageList
