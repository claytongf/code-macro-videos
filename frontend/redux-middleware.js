const { default: axios } = require("axios");
const { createStore, applyMiddleware } = require("redux");
const {default: createSagaMiddleware} = require('redux-saga')
const {take, put, call, actionChannel, debounce, select, all, fork} = require('redux-saga/effects')

function reducer(state, action){
    if(action.type === 'acaoY'){
        return {...state, text: action.value}
    }
    if(action.type === 'acaoX'){
        return {value: action.value};
    }

    return state;
}

function* searchData(action){
    // console.log('Hello');
    // const channel = yield actionChannel('acaoY')
    // console.log(channel);
    // while(true){
        console.log(yield select((state) => state.text));
        console.log('antes da acao Y');
        // const action = yield take(channel)
        const search = action.value
        try{
            const [response1, response2] = yield all([
                call(axios.get, 'http://nginx/api/videos?search='+search),
                call(axios.get, 'http://nginx/api/categories?search='+search)
            ])
            // const {data} = yield call(axios.get, 'http://nginx/api/videos?search='+search)
            // const {data1} = yield call(axios.get, 'http://nginx/api/categories?search='+search)
            console.log(response1.data.data.length, response2.data.data.length);
            yield put({
                type: 'acaoX',
                value: data
            })
        }catch(e){
            yield put({
                type: 'acaoX',
                error: e
            })
        }
        const value = 'novo valor' + Math.random()
    // }
}

function* helloWorld(){
    console.log('Hello World');
}

function* debounceSearch(){
    yield debounce(1000, 'acaoY', searchData)
}

function* rootSaga(){
    yield all([
        helloWorld(),
        debounceSearch()
    ])
    // yield fork(helloWorld)
    // yield fork(debounceSearch)
}

const sagaMiddleware = createSagaMiddleware();

// const customMiddleware = store => next => action => {
//     console.log('Hello');
//     next(action)
// }

const store = createStore(
    reducer,
    applyMiddleware(sagaMiddleware)
)
sagaMiddleware.run(rootSaga)

const action = (type, value) => store.dispatch({type, value})

action('acaoY', 'l')
action('acaoY', 'lu')

console.log(store.getState());
