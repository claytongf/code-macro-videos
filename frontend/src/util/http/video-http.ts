import { httpVideo } from "./index"
import HttpResource from "./http-resource"

const videoHttp = new HttpResource(httpVideo, "videos")

export default videoHttp
