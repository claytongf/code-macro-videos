import { RouteProps } from 'react-router-dom'
import CategoryList from '../pages/category/PageList'
import CategoryCreate from '../pages/category/PageForm'
import GenreList from '../pages/genre/PageList'
import GenreCreate from '../pages/genre/PageForm'
import CastMemberList from '../pages/cast-member/PageList'
import CastMemberCreate from '../pages/cast-member/PageForm'
import Dashboard from '../pages/Dashboard'

export interface MyRouteProps extends RouteProps {
    name: string
    label: string
}

const routes:MyRouteProps[] = [
    {
        name: 'dashboard',
        label: 'Dashboard',
        path: '/',
        component: Dashboard,
        exact: true
    },
    {
        name: 'categories.list',
        label: 'Listar Categorias',
        path: '/categories',
        component: CategoryList,
        exact: true
    },
    {
        name: 'categories.create',
        label: 'Criar Categorias',
        path: '/categories/create',
        component: CategoryCreate,
        exact: true
    },
    {
        name: 'genres.list',
        label: 'Listar Gêneros',
        path: '/genres',
        component: GenreList,
        exact: true
    },
    {
        name: 'genres.create',
        label: 'Criar Gêneros',
        path: '/genres/create',
        component: GenreCreate,
        exact: true
    },
    {
        name: 'cast_members.list',
        label: 'Listar Membros de Elenco',
        path: '/cast-members',
        component: CastMemberList,
        exact: true
    },
    {
        name: 'cast_members.create',
        label: 'Criar Membros',
        path: '/cast-members/create',
        component: CastMemberCreate,
        exact: true
    },
]

export default routes
