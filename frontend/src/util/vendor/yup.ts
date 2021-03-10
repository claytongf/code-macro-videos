import { setLocale } from 'yup'

const ptBR = {
    mixed: {
        required: '${path} é requerido',
        notType: '${path} é inválido'
    },
    string: {
        max: '${path} precisa ter no máximo ${max} caracteres'
    },
    number: {
        min: '${path} precisa ser no mínimo ${min}'
    },
    array: {
        min: 'Em ${path}, precisa escolher pelo menos ${min} item'
    }
}

setLocale(ptBR)

export * from 'yup'
