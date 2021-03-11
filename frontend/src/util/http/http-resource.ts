import { AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from "axios";
import axios from 'axios'
import { serialize } from 'object-to-formdata'

export default class HttpResource {

    private cancelList: CancelTokenSource | null = null;

    constructor(protected http: AxiosInstance, protected resource){

    }

    list<T = any>(options?: { queryParams? }): Promise<AxiosResponse<T>>{
        if(this.cancelList){
            this.cancelList.cancel('list request cancelled');
        }
        this.cancelList = axios.CancelToken.source();

        const config:AxiosRequestConfig = {
            cancelToken: this.cancelList.token
        }
        if(options && options.queryParams){
            config.params = options.queryParams
        }
        return this.http.get<T>(this.resource, config)
    }

    get<T = any>(id): Promise<AxiosResponse<T>>{
        return this.http.get<T>(`${this.resource}/${id}`)
    }

    create<T = any>(data): Promise<AxiosResponse<T>>{
        let sendData = this.makeSendData(data)
        return this.http.post<T>(this.resource, sendData)
    }

    update<T = any>(id, data, options?: {http?: {usePost: boolean}}): Promise<AxiosResponse<T>>{
        let sendData = data;
        if(this.containsFile(data)){
            sendData = this.getFormData(data);
        }
        const {http} = (options || {}) as any;
        return !options || !http || !http.usePost
            ? this.http.put<T>(`${this.resource}/${id}`, sendData)
            : this.http.post<T>(`${this.resource}/${id}`, sendData)
    }

    delete<T = any>(id): Promise<AxiosResponse<T>>{
        return this.http.delete<T>(`${this.resource}/${id}`)
    }

    isCancelledRequest(error){
        return axios.isCancel(error)
    }

    private makeSendData(data){
        return this.containsFile(data) ? this.getFormData(data) : data;
    }

    private getFormData(data){
        return serialize(data, {booleansAsIntegers: true});
    }

    private containsFile(data){
        return Object.values(data).filter(e1 => e1 instanceof File).length !== 0
    }
}
